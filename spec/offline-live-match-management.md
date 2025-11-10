
# Offline Live Match Management - Technical Requirements

**Document Version:** 1.0  
**Date:** 2025-01-24  
**Status:** Planning

---

## Executive Summary

This document outlines the technical requirements and implementation strategy for enabling live match management at venues with unreliable or no internet connectivity, including a dual-screen display system for audience visualization.

---

## Core Requirements

### 1. Offline Functionality
- Match center must work without internet connectivity
- Data entry for scores, penalties, roster changes must be possible offline
- Sync with backend API when connection is restored

### 2. Dual Screen Display
- Primary screen: Match management interface (data entry)
- Secondary screen: Public-facing scoreboard/penalty display
- Real-time updates between screens even when offline

### 3. Data Synchronization
- Queue changes made offline
- Auto-sync when connection restored
- Conflict resolution for simultaneous edits
- Preserve data integrity

---

## Technical Approach Options

### Option A: Progressive Web App (PWA) - RECOMMENDED

**Feasibility:** ✅ **YES - This is achievable with web technology**

#### Advantages:
- No separate software installation required
- Works on any device with a modern browser
- Leverages existing React/Next.js codebase
- Cross-platform (Windows, Mac, Linux, tablets)
- Can be "installed" as desktop app
- Service Workers enable offline functionality

#### Implementation Strategy:

**1. Service Worker for Offline Caching**
```typescript
// Intercept API calls and cache responses
// Queue mutations for later sync
// Serve cached static assets offline
```

**2. IndexedDB for Local Storage**
```typescript
// Store match data locally
// Queue pending operations
// Sync queue when online
```

**3. Window Management for Dual Screen**
```typescript
// window.open() for secondary display
// postMessage() for cross-window communication
// Works offline as both windows are local
```

**4. Background Sync API**
```typescript
// Auto-sync queued changes when connection restored
// Retry failed requests
```

#### Technology Stack:
- Next.js with Service Worker
- Workbox (Google's PWA toolkit)
- IndexedDB (via idb library)
- Web Storage API
- Window.postMessage() for inter-window communication

---

### Option B: Electron Desktop App

**Feasibility:** ✅ Possible but NOT recommended

#### Why Not Recommended:
- Requires separate codebase maintenance
- Installation/updates more complex
- Doesn't leverage existing web infrastructure
- Platform-specific builds needed
- Larger download size
- More complex deployment

---

### Option C: Hybrid Approach

**Feasibility:** ✅ Best of both worlds

#### Strategy:
- PWA as primary solution (works everywhere)
- Optional Electron wrapper for venues requiring desktop app
- Same codebase, different packaging

---

## Recommended Solution: Progressive Web App (PWA)

### Phase 1: Core PWA Implementation

#### 1.1 Service Worker Setup
```
Tasks:
- Install next-pwa package
- Configure service worker for static asset caching
- Implement runtime caching for API responses
- Add offline fallback page
```

#### 1.2 Offline Data Management
```
Tasks:
- Implement IndexedDB wrapper for match data
- Create operation queue for offline mutations
- Add optimistic UI updates
- Implement data versioning/timestamps
```

#### 1.3 Sync Manager
```
Tasks:
- Background sync for queued operations
- Conflict detection and resolution
- Retry logic with exponential backoff
- Success/failure notifications
```

---

### Phase 2: Dual Screen Implementation

#### 2.1 Display Controller
```typescript
// Match Center (Primary Screen)
- Control interface
- Data entry forms
- Connection status indicator
- Sync status display

// Public Display (Secondary Screen)
- Full-screen scoreboard
- Team logos, colors
- Current score
- Active penalties
- Match time
- Auto-refresh from local data
```

#### 2.2 Inter-Window Communication
```typescript
// Use Window.postMessage() API
// Broadcast state changes
// Works offline (both windows local)
// Automatic reconnection if display closed
```

#### 2.3 Display Features
```
- Responsive to different screen sizes
- Customizable layouts
- Animations for score changes
- Penalty timer countdown
- Match status updates
```

---

### Phase 3: Sync & Conflict Resolution

#### 3.1 Sync Strategy
```
Online Mode:
- Direct API calls
- Immediate persistence
- Real-time updates

Offline Mode:
- Local storage writes
- Queue API mutations
- Optimistic UI updates

Sync Mode (coming back online):
- Process queue in order
- Handle conflicts
- Merge server state
- Update UI with canonical data
```

#### 3.2 Conflict Resolution
```
Strategy:
1. Timestamp-based resolution (last write wins)
2. User confirmation for critical conflicts
3. Merge non-conflicting changes
4. Log all conflicts for review
```

---

## Implementation Roadmap

### Milestone 1: PWA Foundation (2-3 weeks)
- [ ] Install and configure next-pwa
- [ ] Implement service worker
- [ ] Add offline detection
- [ ] Create manifest.json
- [ ] Test installability
- [ ] Implement basic caching strategy

### Milestone 2: Offline Storage (2-3 weeks)
- [ ] Set up IndexedDB schema
- [ ] Create data access layer
- [ ] Implement operation queue
- [ ] Add optimistic updates
- [ ] Test offline data persistence

### Milestone 3: Dual Screen System (2-3 weeks)
- [ ] Create public display component
- [ ] Implement window management
- [ ] Add postMessage communication
- [ ] Design scoreboard layouts
- [ ] Test multi-screen scenarios

### Milestone 4: Sync Engine (3-4 weeks)
- [ ] Implement background sync
- [ ] Add conflict detection
- [ ] Create resolution strategies
- [ ] Build sync queue processor
- [ ] Add retry logic
- [ ] Implement error handling

### Milestone 5: Testing & Polish (2-3 weeks)
- [ ] Offline scenario testing
- [ ] Multi-device testing
- [ ] Performance optimization
- [ ] Edge case handling
- [ ] User documentation
- [ ] Deployment preparation

---

## Technical Specifications

### Service Worker Capabilities Needed:
```javascript
- Static asset caching (CSS, JS, images)
- Runtime API response caching
- Background sync registration
- Offline fallback handling
- Cache versioning and cleanup
```

### IndexedDB Schema:
```typescript
// Stores
- matches: Complete match objects
- pendingOperations: Queued mutations
- syncLog: Sync history
- displaySettings: Screen configurations

// Indexes
- matchId
- timestamp
- syncStatus
- operationType
```

### API Modifications Required:
```
- Add ETags for conflict detection
- Timestamp all responses
- Batch operation endpoint
- Sync status endpoint
- Idempotency keys for operations
```

---

## Device Requirements

### Minimum Requirements:
- Modern browser (Chrome 80+, Firefox 75+, Safari 14+, Edge 80+)
- 4GB RAM
- 10GB free storage
- Dual monitor support (for secondary display)

### Recommended Setup:
- Laptop with external monitor
- Or: Tablet + external display via HDMI/wireless
- Stable power supply
- Backup internet connection (mobile hotspot)

---

## Data Flow Diagrams

### Online Mode:
```
User Input → Match Center UI → API → Database
                ↓
        Public Display (via postMessage)
```

### Offline Mode:
```
User Input → Match Center UI → IndexedDB → Operation Queue
                ↓
        Public Display (via postMessage)
```

### Sync Mode:
```
Operation Queue → Batch API → Database
        ↓
    Success/Conflict
        ↓
IndexedDB Update → UI Refresh → Public Display Update
```

---

## Security Considerations

### Offline Security:
- Local data encryption (Web Crypto API)
- Session timeout even offline
- Secure storage of JWT tokens
- Clear data on logout

### Sync Security:
- Verify JWT still valid before sync
- Re-authenticate if token expired
- Validate all queued operations
- Prevent injection attacks

---

## User Experience

### Connection Status Indicator:
```
🟢 Online - Live sync enabled
🟡 Offline - Data saved locally
🔵 Syncing - Uploading changes
🔴 Error - Manual intervention needed
```

### User Workflows:

#### Pre-Match Setup (Online):
1. Open match center
2. Verify rosters loaded
3. Open secondary display
4. Position on public screen
5. Test offline mode

#### During Match (Can be Offline):
1. Enter scores/penalties
2. See instant updates on public display
3. Data queued if offline
4. Continue without interruption

#### Post-Match (Back Online):
1. Auto-sync queued data
2. Verify all data synced
3. Close displays
4. Data available in main system

---

## Testing Strategy

### Offline Scenarios:
- Start offline, add data, go online
- Start online, lose connection mid-match
- Multiple simultaneous offline sessions
- Extended offline period (hours)
- Rapid online/offline toggling

### Display Scenarios:
- Display window closed/crashed
- Multiple displays on different matches
- Display on different devices
- Various screen resolutions
- Display orientation changes

### Sync Scenarios:
- Large queue processing
- Conflicting edits from different sources
- Partial sync failures
- Network timeout during sync
- Invalid data in queue

---

## Known Limitations & Mitigations

### Limitations:
1. **No real-time collaboration offline** - Only one user per match offline
2. **Storage limits** - ~50MB-2GB depending on browser
3. **Safari PWA limitations** - Limited service worker support
4. **iOS restrictions** - Some PWA features limited

### Mitigations:
1. Single-user mode enforcement when offline
2. Regular cache cleanup, store only active matches
3. Graceful degradation, encourage Chrome/Firefox
4. Electron wrapper option for iOS tablets

---

## Success Metrics

### Functionality:
- ✅ 100% match center features work offline
- ✅ Public display updates <100ms
- ✅ Sync success rate >99%
- ✅ Data loss rate: 0%

### Performance:
- Initial load: <3s
- Offline detection: <500ms
- Display update: <100ms
- Sync completion: <10s for typical match

### Reliability:
- Works offline: Yes
- Survives browser refresh: Yes
- Auto-recovery: Yes
- Data integrity: Guaranteed

---

## Next Steps

1. **Prototype Phase** (Week 1-2)
   - Build minimal PWA proof of concept
   - Test offline basics
   - Validate dual-screen approach

2. **Stakeholder Review** (Week 3)
   - Demo to league managers
   - Gather feedback
   - Refine requirements

3. **Full Implementation** (Week 4-15)
   - Follow milestone roadmap
   - Iterative testing
   - Gradual rollout

4. **Pilot Program** (Week 16-20)
   - Select 2-3 venues for testing
   - Monitor performance
   - Collect user feedback

5. **Production Rollout** (Week 21+)
   - Full deployment
   - Training materials
   - Ongoing support

---

## Conclusion

**Answer to your questions:**

1. ✅ **YES - Web app can handle this requirement**
2. ❌ **NO - Separate client software is NOT required** (PWA is sufficient)
3. ✅ **Dual screen is fully achievable with web technology**
4. ✅ **API backend will still be used** (with sync when online)

**Recommended Path:** Progressive Web App with Service Workers and IndexedDB

This approach provides:
- Zero installation friction
- Works on any modern device
- Leverages existing Next.js codebase
- True offline capability
- Reliable sync mechanism
- Professional dual-screen display
- Future-proof architecture

The PWA approach is **production-ready technology** used by major apps (Twitter, Spotify, Starbucks) and is the modern standard for offline-capable web applications.
