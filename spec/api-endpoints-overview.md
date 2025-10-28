
# API Endpoints Overview

## Document Purpose
This document catalogs all API endpoints currently used in the frontend application and proposes additional endpoints that would improve frontend efficiency and reduce complexity.

---

## Current API Endpoints

### Authentication & User Management

#### `POST /users/login`
**Usage:** User authentication
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "token": "string",
  "user": {
    "email": "string",
    "role": "string"
  }
}
```
**Files:** `pages/api/login.tsx`

#### `GET /users/me`
**Usage:** Get current user profile
**Headers:** `Authorization: Bearer {jwt}`
**Response:** User object with roles and club information
**Files:** `pages/api/user.tsx`, multiple admin pages

---

### Matches

#### `GET /matches/{id}`
**Usage:** Get single match details
**Response:** Complete match object including rosters, scores, events
**Files:** `pages/matches/[id]/matchcenter/index.tsx`, `pages/matches/[id]/index.tsx`

#### `GET /matches/`
**Usage:** Get matches list (likely with filters)
**Files:** `pages/matches/[id]/[teamFlag]/roster/index.tsx`

---

### Clubs & Teams

#### `GET /clubs/`
**Usage:** Get all clubs
**Files:** `pages/admin/clubs/index.tsx`, `pages/clubs/index.tsx`

#### `GET /clubs/{clubId}`
**Usage:** Get single club details
**Files:** Multiple roster and team management pages

#### `GET /clubs/{clubId}/teams/{teamId}`
**Usage:** Get team details
**Files:** Team management pages

---

### Players

#### `GET /players/`
**Usage:** Get players list (paginated, searchable)
**Query Params:** Pagination, search filters
**Files:** `pages/admin/players/index.tsx`

#### `GET /players/{playerId}`
**Usage:** Get single player details
**Files:** Player edit pages

#### `GET /players/{playerId}/stats`
**Usage:** Get player statistics
**Files:** `pages/matches/[id]/matchcenter/index.tsx`

---

### Documents

#### `GET /documents/`
**Usage:** Get documents list
**Files:** `pages/admin/documents/index.tsx`

#### `POST /documents/`
**Usage:** Create new document
**Files:** `pages/admin/documents/add.tsx`

---

## Proposed New/Enhanced Endpoints

### High Priority

#### `GET /matches?status={status}&date={date}&club={clubId}&limit={n}`
**Current Issue:** Frontend likely fetches all matches and filters client-side
**Benefit:** Reduce payload size, improve performance
**Use Cases:** Calendar view, match lists, club-specific views

#### `GET /matches/{id}/permissions?userId={userId}`
**Current Issue:** Permission calculation done client-side in `tools/utils.tsx`
**Benefit:** 
- Security: Server-side authorization validation
- Consistency: Single source of truth
- Maintenance: Easier to update permission logic
**Response:**
```json
{
  "showButtonEdit": boolean,
  "showButtonStatus": boolean,
  "showButtonRosterHome": boolean,
  "showButtonRosterAway": boolean,
  "showButtonScoresHome": boolean,
  "showButtonScoresAway": boolean,
  "showButtonPenaltiesHome": boolean,
  "showButtonPenaltiesAway": boolean,
  "showButtonEvents": boolean,
  "showButtonMatchCenter": boolean,
  "showButtonSupplementary": boolean
}
```

#### `GET /clubs/{clubId}/teams/{teamId}/available-players?matchDate={date}`
**Current Issue:** Frontend fetches all players and filters by eligibility
**Benefit:** Backend handles complex eligibility logic (age groups, transfers, suspensions)
**Response:** Pre-filtered list of eligible players

#### `PATCH /matches/{id}/roster`
**Current Issue:** Likely uses full PUT or multiple calls
**Benefit:** Partial updates for roster changes
**Request Body:**
```json
{
  "team": "home|away",
  "updates": {
    "called": [playerId1, playerId2],
    "removed": [playerId3]
  }
}
```

#### `POST /auth/refresh`
**Current Issue:** No token refresh mechanism
**Benefit:** Improved security with shorter-lived tokens
**Request:** Refresh token
**Response:** New access token

---

### Medium Priority

#### `GET /players?teamId={teamId}&available=true&position={position}`
**Current Issue:** Player selection requires multiple client-side filters
**Benefit:** Single query for roster management screens

#### `GET /matches/{id}/events`
**Current Issue:** Events likely embedded in match object
**Benefit:** Separate endpoint for event timeline, reduces match payload

#### `POST /matches/{id}/events/batch`
**Current Issue:** Multiple individual POST calls for match events
**Benefit:** Batch create goals, penalties, cards in single request
**Request Body:**
```json
{
  "events": [
    {"type": "goal", "playerId": "...", "time": "12:34", ...},
    {"type": "penalty", "playerId": "...", ...}
  ]
}
```

#### `GET /matches/calendar?start={date}&end={date}&tournament={id}`
**Current Issue:** Calendar view likely fetches too much data
**Benefit:** Optimized for calendar display with date range filtering
**Response:** Minimal match objects with just display fields

#### `GET /clubs/{clubId}/dashboard`
**Current Issue:** Multiple API calls to build club dashboard
**Benefit:** Single aggregated endpoint with club stats, upcoming matches, recent results
**Response:**
```json
{
  "club": {...},
  "upcomingMatches": [...],
  "recentResults": [...],
  "standings": {...},
  "stats": {...}
}
```

---

### Low Priority (Nice to Have)

#### `GET /tournaments/{id}/standings`
**Current Issue:** Standings calculation likely done client-side or embedded
**Benefit:** Server-calculated standings with tiebreakers

#### `GET /search?q={query}&type={type}`
**Current Issue:** Separate searches for players, clubs, matches
**Benefit:** Unified search endpoint
**Response:**
```json
{
  "players": [...],
  "clubs": [...],
  "matches": [...]
}
```

#### `GET /users/me/notifications`
**Benefit:** Push notifications for match assignments, roster changes
**Future Enhancement:** WebSocket support for real-time updates

#### `POST /matches/{id}/validate`
**Benefit:** Pre-submission validation for rosters, scores
**Response:** Validation errors before actual save

---

## API Improvements Needed

### 1. Consistent Error Responses
**Issue:** Inconsistent error handling across frontend
**Proposal:** Standardize error response format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      {"field": "email", "message": "Invalid email format"}
    ]
  }
}
```

### 2. Pagination Standard
**Issue:** Unclear pagination implementation
**Proposal:** Consistent pagination metadata
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

### 3. Include Related Data
**Issue:** Multiple requests for related entities
**Proposal:** Support `?include=` query parameter
**Example:** `GET /matches/{id}?include=teams,venue,tournament`

### 4. Field Selection
**Issue:** Large payloads when only few fields needed
**Proposal:** Support `?fields=` parameter
**Example:** `GET /matches?fields=id,startDate,home.name,away.name`

### 5. Batch Operations
**Issue:** Multiple individual requests for bulk operations
**Proposal:** Batch endpoints for:
- `POST /matches/bulk-status-update`
- `POST /players/bulk-import`
- `DELETE /documents/bulk-delete`

---

## Security Enhancements Needed

1. **Rate Limiting:** Implement per-user/IP rate limits
2. **Token Refresh:** Implement refresh token rotation
3. **Role-Based Endpoints:** Validate permissions server-side for all mutations
4. **Audit Logging:** Track who changed what and when
5. **Input Validation:** Strict validation on all inputs

---

## Performance Optimizations

1. **Caching Headers:** Implement proper cache-control headers
2. **ETags:** Support conditional requests
3. **Compression:** Enable gzip/brotli compression
4. **Database Indexing:** Ensure common query patterns are indexed
5. **Response Streaming:** For large datasets

---

## WebSocket Support (Future)

Consider WebSocket endpoints for real-time features:
- `ws://api/matches/{id}/live` - Live match updates
- `ws://api/notifications` - User notifications
- `ws://api/roster-lock` - Collaborative editing locks

---

## GraphQL Consideration

For complex nested queries (matches with teams, players, stats), consider GraphQL endpoint:
- Single endpoint for flexible queries
- Reduce over-fetching
- Better typing with schema

---

## Migration Path

1. **Phase 1:** Implement permission endpoint, token refresh
2. **Phase 2:** Add filtered/paginated endpoints for matches, players
3. **Phase 3:** Batch operations and dashboard endpoints
4. **Phase 4:** Real-time features via WebSocket

---

## Notes for Backend Team

- Current base URL: `process.env.NEXT_PUBLIC_API_URL`
- Authentication: JWT Bearer tokens in Authorization header
- Current cookie max age: 60 minutes (configurable)
- Cloudinary integration for images (cloud name: 'dajtykxvp')
- Frontend performs significant client-side filtering/calculation
- Permission logic in `tools/utils.tsx` should be migrated to backend

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Maintained By:** Frontend Team
