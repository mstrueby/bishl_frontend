# Live Match Management — SSE & WebSocket Spec

## Overview

This document describes the backend architecture and incremental build plan for
real-time match updates in BISHL. It covers two distinct channels:

- **SSE (Server-Sent Events)** — server pushes read-only match state to public viewers
- **WebSocket** — bidirectional channel for the match management console (admin)

The frontend is Next.js with ISR pages. The backend is FastAPI.

---

## Guiding principle

The ISR pages own the page shell (navigation, standings, match list structure).
The `MatchCard` component owns live match data. These two responsibilities must
stay separate. ISR handles the slow-moving structure; SSE/WebSocket handle the
fast-moving match state.

```
ISR page (shell, standings)
  └── MatchCard
        ├── Initial data: from ISR props (status/score at build time)
        └── Live data: SSE subscription (INPROGRESS) or polling (SCHEDULED)
```

---

## Data model — match events

Before building the real-time transport, the backend needs a match event log.
Instead of just overwriting a score field, each meaningful change is stored as
an immutable event. The current score is always derived from the event log.

```
MatchEvent
  id:          UUID
  matchId:     string
  type:        GOAL | PENALTY | PERIOD_START | PERIOD_END | MATCH_START
               | MATCH_END | CLOCK_CORRECTION | STATUS_CHANGE
  occurredAt:  datetime (wall clock)
  matchTime:   string  (e.g. "12:34" — game clock at moment of event)
  period:      int
  payload:     JSON   (type-specific fields, see below)
  createdBy:   userId
```

Payload examples:

```json
// GOAL
{ "teamFlag": "home", "scorerId": "...", "assistId": "...", "homeScore": 2, "awayScore": 1 }

// PENALTY
{ "teamFlag": "away", "playerId": "...", "minutes": 2, "reason": "Charging" }

// STATUS_CHANGE
{ "from": "SCHEDULED", "to": "INPROGRESS" }
```

The match document stores derived summary fields (`homeScore`, `awayScore`,
`matchStatus`, `periods`) computed from the event log. SSE and WebSocket
broadcast these derived fields — clients never need to re-derive them.

---

## Channel 1 — SSE (public viewers)

### Purpose
Push score and status updates to MatchCard components on public pages
(calendar, tournament schedule) when a match is INPROGRESS.

### Endpoint
```
GET /matches/{matchId}/stream
```

- Returns `Content-Type: text/event-stream`
- Keeps the HTTP connection open
- Sends a `data:` event whenever the match state changes
- Sends a keepalive comment (`:\n\n`) every 15 seconds
- Closes the stream when the match reaches a terminal status (FINISHED, CANCELLED)

### Event format
```
event: match_update
data: {"matchId":"...","matchStatus":{"key":"INPROGRESS"},"homeScore":2,"awayScore":1,"period":2,"matchTime":"23:15"}

:keepalive
```

### FastAPI implementation sketch
```python
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio

router = APIRouter()

@router.get("/matches/{match_id}/stream")
async def match_stream(match_id: str):
    async def event_generator():
        while True:
            match = await get_match(match_id)
            yield f"event: match_update\ndata: {match.to_sse_json()}\n\n"

            if match.status in ("FINISHED", "CANCELLED"):
                break

            await asyncio.sleep(5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

In production, replace the polling loop with a publish/subscribe mechanism
(Redis pub/sub or an in-process asyncio queue) so the event fires immediately
when the match state changes, rather than polling the database every 5 seconds.

### Frontend — MatchCard integration
```tsx
useEffect(() => {
  if (match.matchStatus?.key !== 'INPROGRESS') return;

  const source = new EventSource(
    `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}/stream`
  );

  source.addEventListener('match_update', (e) => {
    const updated = JSON.parse(e.data);
    setLiveMatch((prev) => ({ ...prev, ...updated }));
  });

  return () => source.close();
}, [match._id, match.matchStatus?.key]);
```

The `MatchRefreshProvider` polling (currently 30 s) can be retired for
INPROGRESS matches once SSE is in place. Keep it as a fallback for browsers
that do not support `EventSource` or when the SSE connection drops.

---

## Channel 2 — WebSocket (match management console)

### Purpose
Allow an authorised match manager to control the live match:
- Start / end match and periods
- Record goals and assists
- Record penalties
- Correct the game clock
- Remove incorrectly entered events

All connected SSE subscribers receive the resulting state update immediately
after a management action is processed.

### Endpoint
```
WS /matches/{matchId}/manage
```

- Requires JWT in the `Authorization` header (validated on connect)
- Only users with role `LEAGUE_MANAGER` or `REFEREE_ADMIN` may connect
- Only one active management connection per match is enforced server-side

### Message format — client → server
```json
{
  "action": "RECORD_GOAL",
  "matchTime": "12:34",
  "period": 1,
  "payload": {
    "teamFlag": "home",
    "scorerId": "player-id",
    "assistId": "player-id"
  }
}
```

Supported `action` values:
```
MATCH_START
PERIOD_START      { period }
PERIOD_END        { period }
MATCH_END
RECORD_GOAL       { teamFlag, scorerId, assistId?, matchTime, period }
UNDO_GOAL         { eventId }
RECORD_PENALTY    { teamFlag, playerId, minutes, reason, matchTime, period }
UNDO_PENALTY      { eventId }
CLOCK_CORRECTION  { matchTime }
```

### Message format — server → client
```json
{
  "type": "STATE_UPDATE",
  "match": { ...full derived match state... }
}

{
  "type": "ERROR",
  "code": "INVALID_ACTION",
  "message": "Cannot start a match that is already INPROGRESS"
}

{
  "type": "ACK",
  "eventId": "uuid-of-stored-event"
}
```

### FastAPI implementation sketch
```python
from fastapi import WebSocket, WebSocketDisconnect

@router.websocket("/matches/{match_id}/manage")
async def match_manage(websocket: WebSocket, match_id: str):
    await websocket.accept()
    user = await authenticate_ws(websocket)  # validate JWT from header/query

    try:
        while True:
            message = await websocket.receive_json()
            result = await handle_management_action(match_id, user, message)

            # Acknowledge to the manager
            await websocket.send_json({"type": "ACK", "eventId": result.event_id})

            # Broadcast updated state to all SSE subscribers of this match
            await publish_match_update(match_id, result.new_state)

    except WebSocketDisconnect:
        pass
```

---

## Publish / subscribe — connecting WebSocket to SSE

When a WebSocket action mutates the match state, SSE subscribers must receive
the update without delay. Use an in-process asyncio queue per match (suitable
for a single-process FastAPI deployment). For multi-process deployments, use
Redis pub/sub.

```
Manager WebSocket  →  handle_action()  →  asyncio.Queue (per matchId)
                                                  │
                                           SSE generator polls queue
                                                  │
                                         SSE clients (MatchCards)
```

---

## Incremental build plan

### Step 1 — Match event log (backend only)
Create the `MatchEvent` collection/table in the database.
Add `POST /matches/{matchId}/events` (internal, not public) to append an event
and recompute derived fields (`homeScore`, `awayScore`, `matchStatus`).
No frontend change required. This is the data foundation for everything else.

**Acceptance:** An event can be written and the derived match state updates correctly.

### Step 2 — SSE endpoint (backend + MatchCard)
Implement `GET /matches/{matchId}/stream` in FastAPI using a polling loop
(database poll every 5 s, no Redis yet).
Update `MatchCard` to open an `EventSource` when `matchStatus === INPROGRESS`.
Retire the 30-second polling in `MatchRefreshContext` for INPROGRESS matches.

**Acceptance:** Opening a browser on the calendar page with an INPROGRESS match
shows score updates within 5 seconds of a backend change without a page reload.

### Step 3 — Management actions via REST (no WebSocket yet)
Build the management API as plain REST endpoints with JWT auth:
```
POST /matches/{matchId}/events  (with action payload)
DELETE /matches/{matchId}/events/{eventId}  (undo)
```
Build a minimal management UI page (`/admin/matches/{id}/live`) that calls
these endpoints with buttons (Start match, Record goal, etc.).
The public MatchCard updates via SSE within 5 seconds of each action.

**Acceptance:** A league manager can start a match and record goals from the
admin UI. Public viewers see the score update via SSE.

### Step 4 — Async pub/sub (backend only)
Replace the 5-second SSE polling loop with an asyncio queue.
When a management action writes a MatchEvent, it puts the new state on the
queue. The SSE generator reads from the queue and sends immediately.

**Acceptance:** Public viewers see score updates within 1 second of a
management action, not 5 seconds.

### Step 5 — WebSocket management channel
Replace the REST management calls with a WebSocket connection in the admin UI.
The WS connection provides: immediate ACK, real-time error feedback (e.g.
duplicate goal), and a live game clock that ticks server-authoritative time.
The SSE path remains unchanged — WebSocket actions still publish to the queue.

**Acceptance:** The management console works fully over WebSocket. Multiple
browser tabs on the public site all update within 1 second.

### Step 6 — Match clock
Add a `CLOCK_RUNNING` flag to the match state. When true, the SSE stream sends
a `clock_tick` event every second with the current game time (computed
server-side from period start timestamp). MatchCard renders a live clock.
The WebSocket `PERIOD_START` / `PERIOD_END` / `CLOCK_CORRECTION` actions
control the flag.

**Acceptance:** Public viewers see a ticking clock during INPROGRESS matches.

---

## ISR / SSR decision — current recommendation

| Page | Strategy | Reason |
|---|---|---|
| Calendar | ISR 60 s + MatchCard SSE | Shell rarely changes; live scores handled by SSE |
| Season / Round / Matchday | ISR 60 s + MatchCard SSE | Same — structure is stable |
| Tournament list | ISR 300 s | Rarely changes |
| Posts, Venues, Clubs | ISR 300 s | Static content |
| Match management console | `getServerSideProps` | Auth-gated, always needs current state |

Do not migrate public pages to `getServerSideProps`. The ISR + SSE combination
gives fast initial loads and live updates without server-rendering on every
request.

---

## What to implement right now (before this spec)

1. ~~Fix `notFound: true` in calendar and season hub `getStaticProps`~~ ✓ Done
2. Reduce `MatchRefreshContext` polling interval from 30 s to 10 s (cheap win)
3. Begin Step 1 (event log) on the FastAPI backend whenever live management
   becomes a priority
