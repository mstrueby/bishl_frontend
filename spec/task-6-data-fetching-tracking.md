
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

#### 1. `pages/matches/[id]/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Current:** Uses `getServerSideProps` with JWT from cookies  
**Issues:**
- ✅ Uses `apiClient` for match data
- ❌ Fetches `/users/me` in SSR
- ❌ Uses `getCookie('jwt', context)`
- ❌ Passes `jwt`, `userRoles`, `userClubId` as props

**Required Actions:**
- [ ] Remove JWT cookie reading from `getServerSideProps`
- [ ] Remove `/users/me` fetch from SSR
- [ ] Only fetch match data in SSR (public data)
- [ ] Move auth-dependent features to client-side (`useAuth()`, `usePermissions()`)
- [ ] Verify context menu permissions are client-side only
- [ ] Ensure proper error handling
- [ ] Add loading states with `LoadingState` component

**Recommendation:** Keep SSR for SEO, client-side auth only

---

#### 2. `pages/matches/[id]/matchcenter/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Current:** Uses `getServerSideProps` with JWT  
**Issues:**
- ✅ Uses `apiClient` for match data
- ❌ Fetches `/users/me` in SSR
- ❌ Uses `getCookie('jwt', context)`
- ❌ Passes `jwt`, `userRoles`, `userClubId` as props
- ❌ Multiple data fetches in SSR (roster, scores, penalties)

**Required Actions:**
- [ ] Remove JWT/auth from `getServerSideProps`
- [ ] Remove `/users/me` fetch
- [ ] Only fetch match data in SSR
- [ ] Move auth checks to client-side (`useAuth`, `usePermissions`)
- [ ] Move roster/scores/penalties fetching to client-side
- [ ] Add loading states for client-side data
- [ ] Ensure proper error handling

**Recommendation:** Keep SSR for match data, client-side for everything else

---

#### 3. `pages/matches/[id]/[teamFlag]/roster/index.tsx` ⚠️
**Status:** NEEDS MIGRATION  
**Current:** Uses `getServerSideProps` with JWT  
**Issues:**
- ❌ Uses direct `axios` (not `apiClient`)
- ❌ Uses `getCookie('jwt', context)`
- ❌ Fetches `/users/me` in SSR
- ❌ All data fetching in SSR

**Required Actions:**
- [ ] Remove `getServerSideProps` entirely
- [ ] Replace all `axios` with `apiClient`
- [ ] Implement client-side auth with `useAuth()` and `usePermissions()`
- [ ] Add auth redirect `useEffect` (redirect to login if not authenticated)
- [ ] Client-side data fetching with `useEffect` or `useApiRequest`
- [ ] Add loading states with `LoadingState` component
- [ ] Check role requirements (likely needs team manager/admin)
- [ ] Ensure proper error handling

**Recommendation:** Full client-side migration (admin page)

---

#### 4. `pages/matches/[id]/[teamFlag]/scores/index.tsx` ⚠️
**Status:** NEEDS MIGRATION  
**Current:** Uses `getServerSideProps` with JWT  
**Issues:** Same as roster page

**Required Actions:**
- [ ] Remove `getServerSideProps` entirely
- [ ] Replace all `axios` with `apiClient`
- [ ] Implement client-side auth pattern
- [ ] Client-side data fetching
- [ ] Add loading/error states
- [ ] Check role requirements

**Recommendation:** Full client-side migration (admin page)

---

#### 5. `pages/matches/[id]/[teamFlag]/penalties/index.tsx` ⚠️
**Status:** NEEDS MIGRATION  
**Current:** Uses `getServerSideProps` with JWT  
**Issues:** Same as roster page

**Required Actions:**
- [ ] Remove `getServerSideProps` entirely
- [ ] Replace all `axios` with `apiClient`
- [ ] Implement client-side auth pattern
- [ ] Client-side data fetching
- [ ] Add loading/error states
- [ ] Check role requirements

**Recommendation:** Full client-side migration (admin page)

---

#### 6. `pages/matches/[id]/supplementary/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Current:** Uses `getServerSideProps` with JWT  
**Issues:**
- ❌ Uses direct `fetch()` (not `apiClient`)
- ❌ Uses `getCookie('jwt', context)`

**Required Actions:**
- [ ] Remove `getServerSideProps` or remove auth from it
- [ ] Replace `fetch()` with `apiClient`
- [ ] Implement client-side auth if admin-only
- [ ] Add loading/error states

**Recommendation:** Determine if public or admin-only, then migrate accordingly

---

### 🟡 Medium Priority - Admin Pages

#### 7. `pages/admin/profile/index.tsx` ⚠️
**Status:** NEEDS CLEANUP  
**Current:** Has `getServerSideProps` returning empty props  
**Issues:**
- Has SSR wrapper but does nothing

**Required Actions:**
- [ ] Remove `getServerSideProps` entirely
- [ ] Verify client-side auth with `useAuth()` and `usePermissions()`
- [ ] Add auth redirect `useEffect`
- [ ] Check role requirements (likely `UserRole.USER` minimum)
- [ ] Verify `apiClient` usage
- [ ] Add loading states

---

#### 8. `pages/admin/clubs/index.tsx` ✅
**Status:** MARKED COMPLETE (needs verification)  
**Actions:**
- [ ] Verify no SSR auth checks
- [ ] Verify `apiClient` usage
- [ ] Verify client-side auth implementation
- [ ] Check error handling

---

#### 9. `pages/admin/clubs/add.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:**
- [ ] Check for `getServerSideProps` - should be removed
- [ ] Verify client-side auth (`useAuth`, `usePermissions`)
- [ ] Check role requirements (`UserRole.ADMIN`)
- [ ] Verify `apiClient` for POST requests
- [ ] Check error handling

---

#### 10. `pages/admin/clubs/[cAlias]/edit.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:**
- [ ] Remove `getServerSideProps` if present
- [ ] Client-side auth with proper roles
- [ ] Client-side data fetching (useEffect or useApiRequest)
- [ ] Verify `apiClient` for GET/PATCH
- [ ] Check error handling

---

#### 11. `pages/admin/clubs/[cAlias]/teams/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 12. `pages/admin/clubs/[cAlias]/teams/add.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #9

---

#### 13. `pages/admin/clubs/[cAlias]/teams/[tAlias]/edit.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 14. `pages/admin/clubs/[cAlias]/teams/[tAlias]/players/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 15. `pages/admin/players/index.tsx` ✅
**Status:** MARKED COMPLETE (needs verification)  
**Actions:**
- [ ] Verify implementation follows client-side auth pattern

---

#### 16. `pages/admin/players/add.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #9

---

#### 17. `pages/admin/players/[playerId]/edit.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 18. `pages/admin/posts/index.tsx` ✅
**Status:** MARKED COMPLETE (needs verification)  
**Actions:**
- [ ] Verify implementation

---

#### 19. `pages/admin/posts/add.tsx` ✅
**Status:** MARKED COMPLETE (needs verification)  
**Actions:**
- [ ] Verify implementation

---

#### 20. `pages/admin/posts/[alias]/edit.tsx` ✅
**Status:** MARKED COMPLETE (needs verification)  
**Actions:**
- [ ] Verify implementation

---

#### 21. `pages/admin/myclub/index.tsx` ✅
**Status:** MARKED COMPLETE (needs verification)  
**Actions:**
- [ ] Verify implementation

---

#### 22. `pages/admin/myclub/[teamAlias]/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 23. `pages/admin/myclub/[teamAlias]/[playerId]/index.tsx` ⚠️
**Status:** NEEDS REVIEW  
**Actions:** Same as #10

---

#### 24. `pages/admin/myref/index.tsx` ✅
**Status:** MARKED COMPLETE (needs verification)  
**Actions:**
- [ ] Verify implementation

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
**Completed:** 0  
**In Progress:** 0  
**Pending:** 56  

**Last Updated:** 2025-02-02
