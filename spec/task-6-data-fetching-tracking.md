
# Task 6: Data Fetching Strategy - File Tracking Document

**Created:** 2025-02-02  
**Status:** Planning Phase  
**Priority:** High  
**Dependencies:** Phase 0b Complete ✅, Next.js 16.0.3 ✅

---

## Overview

This document tracks all files requiring updates for Task 6: Data Fetching Strategy migration. The goal is to:
- Remove server-side authentication (SSR auth)
- Migrate to appropriate data fetching patterns (SSG/ISR for public, client-side for auth)
- Ensure all pages use `apiClient` (no direct axios or fetch)
- Implement proper error handling and loading states
- Use client-side auth with `useAuth()` and `usePermissions()`

---

## File Categories

### 🔴 High Priority - Breaking Issues

#### 1. `pages/matches/[id]/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses `getServerSideProps` with JWT from cookies  
**Issues:**
- ✅ Uses `apiClient` for match data
- ✅ Removed `/users/me` fetch from SSR
- ✅ Removed `getCookie('jwt', context)`
- ✅ Removed `jwt`, `userRoles`, `userClubId` props

**Completed Actions:**
- ✅ Removed JWT cookie reading from `getServerSideProps`
- ✅ Removed `/users/me` fetch from SSR
- ✅ Only fetches match data in SSR (public data)
- ✅ Auth-dependent features use client-side (`useAuth()`, `usePermissions()`)
- ✅ Context menu permissions are client-side only
- ✅ Has proper error handling
- ✅ Uses `LoadingState` component

**Recommendation:** Keep SSR for SEO, client-side auth only

---

#### 2. `pages/matches/[id]/matchcenter/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses `getServerSideProps` without JWT  
**Issues:**
- ✅ Uses `apiClient` for match data
- ✅ Removed `/users/me` fetch from SSR
- ✅ Removed `getCookie('jwt', context)`
- ✅ Removed `jwt`, `userRoles`, `userClubId` props
- ✅ Removed roster/scores/penalties fetching from SSR

**Completed Actions:**
- ✅ Removed JWT/auth from `getServerSideProps`
- ✅ Removed `/users/me` fetch
- ✅ Only fetches match data in SSR
- ✅ Auth checks use client-side (`useAuth`, `usePermissions`)
- ✅ Roster/scores/penalties data available from match object
- ✅ Has loading states for client-side operations
- ✅ Has proper error handling

**Recommendation:** Keep SSR for match data, client-side for everything else

---

#### 3. `pages/matches/[id]/[teamFlag]/roster/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ Removed `getCookie('jwt', context)`
- ✅ Removed `/users/me` fetch from SSR
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ Removed `getServerSideProps` entirely
- ✅ All API calls use `apiClient`
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Client-side data fetching with `useEffect`
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper role/permission checks
- ✅ Has proper error handling

**Recommendation:** Full client-side migration (admin page)

---

#### 4. `pages/matches/[id]/[teamFlag]/scores/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ Removed `getCookie('jwt', context)`
- ✅ Removed `/users/me` fetch from SSR
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ Removed `getServerSideProps` entirely
- ✅ All API calls use `apiClient`
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Client-side data fetching with `useEffect`
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper role/permission checks
- ✅ Has proper error handling

**Recommendation:** Full client-side migration (admin page)

---

#### 5. `pages/matches/[id]/[teamFlag]/penalties/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ Removed `getCookie('jwt', context)`
- ✅ Removed `/users/me` fetch from SSR
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ Removed `getServerSideProps` entirely
- ✅ All API calls use `apiClient`
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Client-side data fetching with `useEffect`
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper role/permission checks
- ✅ Has proper error handling

**Recommendation:** Full client-side migration (admin page)

---

#### 6. `pages/matches/[id]/supplementary/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ Removed `getCookie('jwt', context)`
- ✅ Removed `/users/me` fetch from SSR
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ Removed `getServerSideProps` entirely
- ✅ All API calls use `apiClient`
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Client-side data fetching with `useEffect`
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper role/permission checks
- ✅ Has proper error handling

**Recommendation:** Full client-side migration (admin page)

---

### 🟡 Medium Priority - Admin Pages

#### 7. `pages/admin/profile/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls (via ProfileForm)
- ✅ Removed `getServerSideProps`
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ Removed `getServerSideProps` entirely
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Role check allows all authenticated users (USER, AUTHOR, CLUB_MANAGER, REFEREE, LEAGUE_MANAGER, ADMIN)
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with `ErrorState`

**Recommendation:** Full client-side migration (user profile page)

---

#### 8. `pages/admin/clubs/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No SSR auth checks
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient`
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (ADMIN, LEAGUE_MANAGER)
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `ErrorState`
- ✅ Client-side search functionality

**Recommendation:** Full client-side migration (admin page)

---

#### 9. `pages/admin/clubs/add.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls (via ClubForm)
- ✅ No `getServerSideProps` present
- ✅ All data operations are client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role check (ADMIN only)
- ✅ Form uses `apiClient` for POST requests (via ClubForm component)
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with `ErrorState`

**Recommendation:** Full client-side migration (admin add page)

---

#### 10. `pages/admin/clubs/[cAlias]/edit.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET/PATCH)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role check (ADMIN only)
- ✅ Client-side data fetching with `useEffect`
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `ErrorMessage`

**Recommendation:** Full client-side migration (admin page)

---

#### 11. `pages/admin/clubs/[cAlias]/teams/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient`
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (ADMIN, LEAGUE_ADMIN)
- ✅ Client-side data fetching with `useEffect`
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch

**Recommendation:** Full client-side migration (admin page)

---

#### 12. `pages/admin/clubs/[cAlias]/teams/add.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data operations are client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role check (ADMIN only)
- ✅ Form uses `apiClient` for POST requests (via TeamForm component)
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with `ErrorMessage`

**Recommendation:** Full client-side migration (admin add page)

---

#### 13. `pages/admin/clubs/[cAlias]/teams/[tAlias]/edit.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET/PATCH)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role check (ADMIN only)
- ✅ Client-side data fetching with `useEffect` for club and team data
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `ErrorMessage`
- ✅ Uses TeamForm component for form handling

**Recommendation:** Full client-side migration (admin page)

---

#### 14. `pages/admin/clubs/[cAlias]/teams/[tAlias]/players/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET for club, team, and players)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (ADMIN, LEAGUE_ADMIN)
- ✅ Client-side data fetching with `useEffect` and `useCallback`
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch
- ✅ Uses DataList component for rendering players
- ✅ Has success message handling

**Recommendation:** Full client-side migration (admin page)

---

#### 15. `pages/admin/players/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET for players list)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (ADMIN, LEAGUE_MANAGER)
- ✅ Client-side data fetching with `useEffect`
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch
- ✅ Uses DataList component for rendering players
- ✅ Has pagination support with `Pagination` component
- ✅ Has search functionality with `SearchBox` component
- ✅ Has success message handling

**Recommendation:** Full client-side migration (admin page)

---

#### 16. `pages/admin/players/add.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data operations are client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (ADMIN, LEAGUE_ADMIN)
- ✅ Client-side data fetching for clubs with `useEffect`
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `ErrorMessage`
- ✅ Uses PlayerAdminForm component for form handling
- ✅ Form uses `apiClient` for POST requests
- ✅ Proper FormData handling for image uploads

**Recommendation:** Full client-side migration (admin add page)

---

#### 17. `pages/admin/players/[playerId]/edit.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET for clubs/player, PATCH for updates)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (ADMIN, LEAGUE_MANAGER)
- ✅ Client-side data fetching with `useEffect` for clubs and player data
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `ErrorMessage`
- ✅ Uses PlayerAdminForm component for form handling
- ✅ Proper FormData handling for image uploads
- ✅ Handles player not found scenario

**Recommendation:** Full client-side migration (admin edit page)

---

#### 18. `pages/admin/posts/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET for posts list, PATCH for updates)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (AUTHOR, ADMIN)
- ✅ Client-side data fetching with `useEffect` and `fetchPosts` function
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `axios.isAxiosError()`
- ✅ Uses DataList component for rendering posts
- ✅ Has success message handling from query params
- ✅ Implements toggle published/featured functionality
- ✅ Implements delete functionality

**Recommendation:** Full client-side migration (admin page)

---

#### 19. `pages/admin/posts/add.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data operations are client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (AUTHOR, ADMIN)
- ✅ Form uses `apiClient` for POST requests
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch, `axios.isAxiosError()`, and `ErrorMessage`
- ✅ Uses PostForm component for form handling
- ✅ Proper FormData handling with author object
- ✅ Sets initial values with current user's name

**Recommendation:** Full client-side migration (admin add page)

---

#### 20. `pages/admin/posts/[alias]/edit.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET for post, PATCH for updates)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (AUTHOR, ADMIN)
- ✅ Client-side data fetching with `useEffect` for post data
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `ErrorMessage`
- ✅ Uses PostForm component for form handling
- ✅ Proper FormData handling for image uploads
- ✅ Handles image removal (imageUrl = '')
- ✅ Handles 304 (no changes) response with success message
- ✅ Redirects to posts list on success

**Recommendation:** Full client-side migration (admin edit page)

---

#### 21. `pages/admin/myclub/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET for club by clubId)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (CLUB_ADMIN, ADMIN)
- ✅ Client-side data fetching with `useEffect` and `fetchClub` function
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `axios.isAxiosError()`
- ✅ Uses DataList component for rendering teams
- ✅ Has success message handling from query params
- ✅ Handles case when user has no club assigned
- ✅ Sorts teams by age group and team number

**Recommendation:** Full client-side migration (club admin page)

---

#### 22. `pages/admin/myclub/[teamAlias]/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET for club, team, players; PATCH for player updates)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (ADMIN, CLUB_ADMIN)
- ✅ Client-side data fetching with `useEffect` and `useCallback` (`fetchData`, `fetchPlayers`)
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `axios.isAxiosError()`
- ✅ Uses DataList component with `getDataListItems` helper
- ✅ Has success message handling from query params
- ✅ Has pagination support with `handlePageChange`
- ✅ Implements toggle active functionality for players
- ✅ Edit player navigation

**Recommendation:** Full client-side migration (club admin team page)

---

#### 23. `pages/admin/myclub/[teamAlias]/[playerId]/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET for player, PATCH for updates)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role checks (ADMIN, CLUB_ADMIN)
- ✅ Client-side data fetching with `useEffect` for player data
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch, `axios.isAxiosError()`, and `ErrorMessage`
- ✅ Uses PlayerForm component for form handling
- ✅ Proper FormData handling for image uploads
- ✅ Handles image removal (imageUrl = null)
- ✅ Handles 304 (no changes) response with success message
- ✅ Redirects to team page on success
- ✅ Handles player not found scenario
- ✅ Cleans up assignedTeams data (removes null jerseyNo)

**Recommendation:** Full client-side migration (club admin player edit page)

---

#### 24. `pages/admin/myref/index.tsx` ✅
**Status:** COMPLETED  
**Current:** Uses client-side auth and data fetching  
**Issues:**
- ✅ Uses `apiClient` for all API calls
- ✅ No `getServerSideProps` present
- ✅ All data fetching is client-side

**Completed Actions:**
- ✅ No `getServerSideProps` present
- ✅ All API calls use `apiClient` (GET for matches)
- ✅ Implements client-side auth with `useAuth()` and `usePermissions()`
- ✅ Has auth redirect `useEffect` (redirects to login if not authenticated)
- ✅ Has proper role check (REFEREE)
- ✅ Client-side data fetching with `useEffect` and `fetchMatches` function
- ✅ Has loading states with `LoadingState` component
- ✅ Has proper error handling with try/catch and `axios.isAxiosError()`
- ✅ Filters matches client-side (referee1 or referee2 matches user._id)
- ✅ Uses MatchCardRef component for rendering
- ✅ Shows empty state when no assigned matches found

**Recommendation:** Full client-side migration (referee page)

---

#### 25. `pages/admin/documents/index.tsx` ✅
**Status:** MARKED COMPLETE (needs verification)  
**Actions:**
- [ ] Verify implementation

---

#### 26. `pages/admin/documents/add.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #9

---

#### 27. `pages/admin/documents/[alias]/edit.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 28. `pages/admin/venues/index.tsx` ✅
**Status:** MARKED COMPLETE (needs verification)  
**Actions:**
- [ ] Verify implementation

---

#### 29. `pages/admin/venues/add.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #9

---

#### 30. `pages/admin/venues/[alias]/edit.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 31. `pages/admin/refadmin/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 32. `pages/admin/refadmin/referees/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 33. `pages/admin/refadmin/referees/[userId]/edit.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

### 🔵 League Manager Pages

#### 34. `pages/leaguemanager/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Verify client-side auth pattern

---

#### 35. `pages/leaguemanager/tournaments/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Verify client-side auth pattern

---

#### 36. `pages/leaguemanager/tournaments/add.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as admin add pages

---

#### 37-50. All nested league manager tournament pages ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Verify client-side auth pattern for each

---

### 🟢 Public Pages (Should use SSG/ISR)

#### 51. `pages/posts/[alias].tsx` ⚠️
**Status:** NEEDS MIGRATION  
**Current:** Unknown (need to check)  
**Recommendation:** Should use SSG with ISR

**Required Actions:**
- [ ] Check current implementation
- [ ] Migrate to `getStaticProps` with `getStaticPaths`
- [ ] Use ISR (`revalidate: 300`)
- [ ] Remove any auth from SSR
- [ ] Verify `apiClient` usage (if client-side fetching)

---

#### 52. `pages/documents/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Recommendation:** Should use SSG or client-side fetch (public)

**Required Actions:**
- [ ] Check current implementation
- [ ] Consider migrating to `getStaticProps` with ISR
- [ ] Or use client-side fetch with `apiClient`
- [ ] No auth needed

---

#### 53. `pages/documents/[category].tsx` ✅
**Status:** MARKED COMPLETE  
**Actions:**
- [ ] Verify implementation

---

#### 54. `pages/venues/index.tsx` ✅
**Status:** MARKED COMPLETE  
**Actions:**
- [ ] Verify implementation

---

#### 55. `pages/datenschutz.tsx` ✅
**Status:** Static page, no data fetching needed

---

#### 56. `pages/impressum.tsx` ✅
**Status:** Static page, no data fetching needed

---

## Common Issues Checklist

For each page, verify:

### ❌ DO NOT USE:
- `getCookie('jwt', context)` in server-side code
- `/users/me` fetches in `getServerSideProps`
- Direct `axios` usage (use `apiClient`)
- `jwt` props passed from server to client
- `fetch()` calls (use `apiClient`)

### ✅ MUST HAVE:
- Client-side auth uses `useAuth()` and `usePermissions()`
- Proper auth redirect pattern with `useEffect`:
```typescript
useEffect(() => {
  if (authLoading) return;
  
  if (!user) {
    router.push('/login');
    return;
  }
  
  if (!hasAnyRole([UserRole.AUTHOR, UserRole.ADMIN])) {
    router.push('/');
  }
}, [authLoading, user, hasAnyRole, router]);
```
- Loading states with `LoadingState` component
- Error handling with try/catch and `ErrorState`
- Link components without deprecated `<a>` tag
- All API calls use `apiClient`

---

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. `pages/matches/[id]/[teamFlag]/roster/index.tsx` - Replace axios, full migration
2. `pages/matches/[id]/[teamFlag]/scores/index.tsx` - Replace axios, full migration
3. `pages/matches/[id]/[teamFlag]/penalties/index.tsx` - Replace axios, full migration
4. `pages/matches/[id]/index.tsx` - Remove SSR auth, keep SSR for match data
5. `pages/matches/[id]/matchcenter/index.tsx` - Remove SSR auth

### Phase 2: Admin Pages Verification (Week 2)
6. Verify all pages marked as "✅ COMPLETE"
7. Review and fix all admin add/edit pages
8. Review league manager pages

### Phase 3: Public Pages Optimization (Week 3)
9. Migrate `pages/posts/[alias].tsx` to SSG with ISR
10. Review `pages/documents/index.tsx` for SSG opportunity

---

## Testing Checklist

After each file migration:
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Page loads without errors
- [ ] Auth redirect works (unauthenticated users redirected to login)
- [ ] Permission checks work (unauthorized users see error message)
- [ ] Data loads correctly
- [ ] Loading states display properly
- [ ] Error states display on failures
- [ ] No console errors or warnings
- [ ] No `/users/me` calls in SSR
- [ ] All API calls use `apiClient`

---

## Progress Tracker

**Total Files:** 56  
**Completed:** 24 (files 1-24)  
**In Progress:** 0  
**Pending:** 32  

**Last Updated:** 2025-02-03
