# BISHL App - Refactoring & Improvement Tasks

**Document Version:** 1.1  
**Date:** 2025-01-24  
**Season Status:** Season 1 Complete  
**Last Updated:** 2025-01-24 (Added dependency upgrade strategy)

---

## 🚨 CRITICAL: Dependency Upgrade Strategy

**TL;DR - BEST TIME TO UPGRADE NEXT.JS:** 

**AFTER completing Phase 0b (Authentication, Security, API refactoring)**

**UPGRADE SEQUENCE:**
1. **NOW (Week 1):** Upgrade all dependencies EXCEPT Next.js (TypeScript, React, utilities)
2. **Week 2-3:** Complete foundation refactoring (Auth, Security, API, TypeScript strict mode)
3. **Week 4-6:** Upgrade Next.js incrementally (12 → 13 → 14)
4. **Week 7+:** Continue other refactoring with modern Next.js

See `spec/dependency-upgrade-plan.md` for detailed execution plan.

---

## High Impact / High Risk

### 1. TypeScript Migration & Type Safety
**Impact:** High | **Risk:** High | **Effort:** Large

**Issues:**
- Inconsistent type definitions across components
- Mix of `.tsx` and `.tsx` without full type coverage
- Missing type definitions for API responses
- `any` types used in multiple locations (e.g., `MyLink` component ref casting)

**Tasks:**
- [x] Add strict type checking in tsconfig.json ✅
- [ ] Audit all components for proper TypeScript usage (defer to Phase 2+)
- [ ] Create comprehensive type definitions for all API responses (defer to Phase 2+)
- [ ] Remove all `any` types and replace with proper interfaces (defer to Phase 2+)
- [ ] Implement proper type guards for API data validation (defer to Phase 2+)

**Note:** TypeScript strict mode is enabled and compiling without errors. Remaining type safety improvements will be addressed incrementally during Phase 2+ refactoring.

**Files Affected:** Most components, especially `Header.tsx`, API integration points

---

### 2. Authentication & Authorization System
**Impact:** High | **Risk:** High | **Effort:** Medium

**Backend Status:** ✅ Two-token system implemented (see `spec/token-refresh-implementation.md`)
- Access token: 15 min (in Authorization header)
- Refresh token: 7 days (for token renewal)

**Frontend Issues:**
- Still using old single-token cookie-based auth
- Login API expects `{token: "..."}` but backend now returns `{access_token: "...", refresh_token: "..."}`
- No token refresh interceptor implemented
- Tokens stored in cookies instead of localStorage
- No automatic retry on 401 errors
- Authorization logic scattered across components

**Tasks:**
- [x] Update `/api/login.tsx` to handle new backend response format
- [x] Remove cookie-based token storage, use localStorage for both tokens
- [x] Implement Axios response interceptor for automatic token refresh on 401
- [x] Implement Axios request interceptor to add access token to headers
- [x] Update `AuthContext` to store both access_token and refresh_token
- [x] Add refresh token flow using `/users/refresh` endpoint
- [x] Handle refresh token expiration (redirect to login after 7 days)
- [x] Update `/api/logout.tsx` to clear both tokens
- [x] Update `/api/user.tsx` to use access token from localStorage
- [x] Remove HTTP-only cookie logic (no longer needed)
- [x] Test full auth flow: login → API calls → token refresh → logout
- [x] Centralize authorization logic (move from components to middleware/utilities)
- [x] Implement server-side permission validation in API routes
- [x] Create RBAC utility functions for role-based access control

**Files Affected:** 
- ✅ `pages/api/login.tsx` (update response handling)
- ✅ `pages/api/logout.tsx` (clear localStorage)
- ✅ `pages/api/user.tsx` (use localStorage token)
- ✅ `context/AuthContext.tsx` (store both tokens)
- ✅ `hooks/useAuth.tsx` (expose token management)
- ✅ `lib/apiClient.tsx` (interceptors for token refresh)
- ✅ `lib/auth.ts` (RBAC utilities and permission checks)
- ✅ `lib/serverAuth.ts` (server-side authentication middleware)
- ✅ `hooks/usePermissions.tsx` (client-side permission hook)

**Implementation Priority:**
1. ✅ **COMPLETE:** Create `lib/apiClient.tsx` with interceptors (reference: `spec/token-refresh-implementation.md`)
2. ✅ **COMPLETE:** Update `pages/api/login.tsx` to parse new response structure
3. ✅ **COMPLETE:** Update `AuthContext` to manage both tokens in localStorage
4. ✅ **COMPLETE:** Update all API route handlers to use new token storage
5. ✅ **COMPLETE:** Replace all `fetch()` calls with configured axios instance (Phase 2 of api-fetch-update-plan.md)
6. ✅ **COMPLETE:** Test complete auth flow end-to-end
7. ✅ **COMPLETE:** Centralize authorization logic and implement RBAC utilities

**Breaking Changes:**
⚠️ **Users will need to re-login after deployment** (token format changed)

**Security Improvements:**
- ✅ Short-lived access tokens (15 min vs 60 min)
- ✅ Separate refresh token for renewals
- ✅ Different secrets for access/refresh tokens
- ✅ Reduced attack window if token is compromisedx`

---

### 3. API Integration & Error Handling
**Impact:** High | **Risk:** Medium | **Effort:** Medium

**Issues:**
- ✅ No centralized API client (FIXED)
- Inconsistent error handling across pages
- ✅ No request/response interceptors (FIXED)
- ✅ Hard-coded API URLs in multiple locations (FIXED with apiClient)
- ✅ No retry logic for failed requests (FIXED with token refresh queue)
- Missing loading states in many components

**Tasks:**
- [x] Create centralized Axios instance with interceptors
- [x] Implement token refresh with request queueing
- [x] Implement global error handling strategy
- [x] Add retry logic for network failures
- [x] Create consistent loading/error state components
- [x] Implement request cancellation for component unmount
- [ ] Add API response caching strategy (optional - consider SWR/React Query in future)

**Files Affected:** 
- ✅ `lib/apiClient.tsx` (interceptors, retry logic, cancellation support)
- ✅ `lib/errorHandler.ts` (centralized error handling)
- ✅ `components/ui/LoadingState.tsx` (loading component)
- ✅ `components/ui/ErrorState.tsx` (error component)
- ✅ `components/ui/EmptyState.tsx` (empty state component)
- ✅ `hooks/useApiRequest.tsx` (request hook with cancellation)
- All pages with API calls

**Progress:** ✅ COMPLETE - Core API integration centralized. Optional: Implement SWR or React Query for advanced caching in Phase 2.

---

## High Impact / Medium Risk

### 4. Performance Optimization
**Impact:** High | **Risk:** Medium | **Effort:** Medium

**Issues:**
- SWC minification disabled in config
- Large bundle sizes (multiple UI libraries)
- No code splitting strategy
- Static generation timeout set to 1000ms (very short)
- On-demand entries buffer very small (2 pages)
- Duplicate tournament configuration data

**Tasks:**
- [ ] Re-enable SWC minification (investigate compatibility issues)
- [ ] Implement dynamic imports for heavy components
- [ ] Optimize bundle with tree-shaking
- [ ] Increase static generation timeout
- [ ] Implement route-based code splitting
- [ ] Move tournament configs to database/API
- [ ] Add performance monitoring

**Files Affected:** `next.config.js`, `components/Header.tsx`, page components

---

### 5. Form Management & Validation
**Impact:** High | **Risk:** Medium | **Effort:** Medium

**Issues:**
- Inconsistent form handling patterns
- Formik used but not consistently
- Validation schemas scattered across components
- No centralized form error display
- Missing field-level validation feedback

**Tasks:**
- [ ] Standardize on Formik + Yup across all forms
- [ ] Create reusable form components library
- [ ] Centralize validation schemas
- [ ] Implement consistent error display patterns
- [ ] Add field-level async validation
- [ ] Create form submission loading states

**Files Affected:** All form components in `components/admin/`, `components/leaguemanager/`

---

## Medium Impact / High Risk

### 6. Data Fetching Strategy
**Impact:** Medium | **Risk:** High | **Effort:** Large

**Issues:**
- Mix of SSR, SSG, and CSR without clear strategy
- `getServerSideProps` used where SSG would be better
- No data revalidation strategy
- Missing error boundaries
- Inconsistent loading states

**Tasks:**
- [ ] Define data fetching strategy per page type
- [ ] Migrate appropriate pages to SSG with ISR
- [ ] Implement error boundaries
- [ ] Add suspense boundaries where appropriate
- [ ] Consider migrating to Next.js 13+ app directory (future)
- [ ] Implement SWR or React Query for client-side data

**Files Affected:** All pages with data fetching

---

### 7. Security Vulnerabilities ✅ COMPLETE
**Impact:** Medium | **Risk:** High | **Effort:** Small

**Issues:**
- Client-side permission checks can be bypassed
- No CSRF protection visible
- Sensitive data in client-side code
- No input sanitization for rich text editor
- Missing security headers

**Tasks:**
- [x] Implement server-side permission validation
- [x] Add CSRF token handling
- [x] Remove sensitive data from client bundle (moved to server-side auth)
- [x] Sanitize all rich text input/output (created lib/sanitize.ts)
- [x] Add security headers in next.config.js
- [x] Implement rate limiting

**Files Affected:** 
- ✅ `next.config.js` (security headers)
- ✅ `lib/csrf.ts` (CSRF utilities)
- ✅ `lib/rateLimit.ts` (rate limiting)
- ✅ `lib/sanitize.ts` (input sanitization)
- ✅ `pages/api/csrf-token.ts` (CSRF endpoint)
- ✅ `pages/api/login.tsx` (rate limiting + CSRF)
- ✅ `pages/api/user.tsx` (server-side auth)
- ✅ `lib/apiClient.tsx` (CSRF token in requests)
- ✅ `context/AuthContext.tsx` (CSRF token fetch)

---

## Medium Impact / Medium Risk

### 8. Component Architecture
**Impact:** Medium | **Risk:** Medium | **Effort:** Large

**Issues:**
- Inconsistent component organization
- Mix of class and functional components patterns
- Prop drilling in several components
- Large component files (>500 lines)
- Duplicate code across similar components
- No component documentation

**Tasks:**
- [ ] Refactor large components into smaller composables
- [ ] Create shared component library
- [ ] Implement composition over prop drilling
- [ ] Add JSDoc comments to components
- [ ] Create component testing strategy
- [ ] Standardize component naming conventions

**Files Affected:** `components/Header.tsx`, `LayoutAdm.tsx`, large form components

---

### 9. State Management
**Impact:** Medium | **Risk:** Medium | **Effort:** Medium

**Issues:**
- Only using Context API for auth
- No global state management solution
- State scattered across components
- No state persistence strategy
- Cache invalidation issues

**Tasks:**
- [ ] Evaluate need for Redux/Zustand
- [ ] Implement state persistence layer
- [ ] Add optimistic updates for mutations
- [ ] Create state synchronization strategy
- [ ] Implement proper cache invalidation

**Files Affected:** Various components with local state

---

### 10. Image & Asset Management
**Impact:** Medium | **Risk:** Medium | **Effort:** Small

**Issues:**
- Cloudinary integration but no optimization strategy
- No image lazy loading implementation
- Missing alt text on many images
- No placeholder/blur-up loading
- Hardcoded Cloudinary URLs

**Tasks:**
- [ ] Implement proper Next/Image usage everywhere
- [ ] Add blur placeholders for images
- [ ] Audit and add missing alt texts
- [ ] Create image optimization pipeline
- [ ] Centralize Cloudinary configuration

**Files Affected:** Components with images, especially logos and player photos

---

## Low Impact / High Risk

### 11. Date & Time Handling
**Impact:** Low | **Risk:** High | **Effort:** Small

**Issues:**
- Inconsistent date formatting
- Timezone issues potential
- Date calculations scattered across code
- No centralized date utility

**Tasks:**
- [ ] Centralize all date operations in `tools/dateUtils.tsx`
- [ ] Add timezone handling
- [ ] Standardize date display formats
- [ ] Add date validation utilities
- [ ] Test edge cases (DST transitions, etc.)

**Files Affected:** `tools/dateUtils.tsx`, `tools/utils.tsx`, match-related components

---

## Low Impact / Medium Risk

### 12. Code Quality & Maintainability
**Impact:** Low | **Risk:** Medium | **Effort:** Medium

**Issues:**
- Minimal ESLint configuration
- No Prettier configuration
- No pre-commit hooks
- Inconsistent code style
- Missing TypeScript strict mode
- No unit tests
- No integration tests

**Tasks:**
- [ ] Expand ESLint rules
- [ ] Add Prettier with pre-commit hook
- [ ] Enable TypeScript strict mode
- [ ] Set up testing framework (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Create CI/CD pipeline

**Files Affected:** `.eslintrc.json`, project configuration

---

### 13. Documentation
**Impact:** Low | **Risk:** Medium | **Effort:** Small

**Issues:**
- Limited inline documentation
- No API documentation
- No component storybook
- Missing setup instructions
- No contribution guidelines

**Tasks:**
- [ ] Add comprehensive README
- [ ] Document API endpoints
- [ ] Create component documentation
- [ ] Add inline code comments
- [ ] Create development setup guide
- [ ] Document deployment process

**Files Affected:** Project-wide

---

### 14. Accessibility
**Impact:** Low | **Risk:** Medium | **Effort:** Medium

**Issues:**
- Missing ARIA labels in places
- Keyboard navigation not tested
- Color contrast issues potential
- No screen reader testing
- Form field associations missing

**Tasks:**
- [ ] Audit accessibility with axe-devtools
- [ ] Add proper ARIA labels
- [ ] Test keyboard navigation
- [ ] Ensure proper focus management
- [ ] Add skip navigation links
- [ ] Test with screen readers

**Files Affected:** All interactive components

---

## Low Impact / Low Risk

### 15. Styling & UI Consistency
**Impact:** Low | **Risk:** Low | **Effort:** Small

**Issues:**
- Tailwind safelist growing large
- Inconsistent spacing/sizing
- Color system could be more systematic
- Badge color logic duplicated

**Tasks:**
- [ ] Create Tailwind theme configuration
- [ ] Define design system tokens
- [ ] Create UI component library
- [ ] Consolidate color/badge logic
- [ ] Document design patterns

**Files Affected:** `tailwind.config.js`, badge/status components

---

### 16. Build & Deployment
**Impact:** Low | **Risk:** Low | **Effort:** Small

**Issues:**
- No environment variable validation
- Missing deployment documentation
- No build optimization checks

**Tasks:**
- [ ] Add env variable schema validation
- [ ] Create deployment checklist
- [ ] Add bundle analyzer
- [ ] Document environment setup
- [ ] Create staging environment

**Files Affected:** Configuration files, deployment docs

---

## High Impact / High Risk (Continued)

### 18. Tournament Page URL Structure Refactoring
**Impact:** High | **Risk:** High | **Effort:** Large

**Issues:**
- `/tournaments/[alias].tsx` is monolithic and handles too many responsibilities
- No distinct URLs for seasons, rounds, matchdays
- Poor SEO (all content on single dynamic route)
- Difficult to share specific standings, matchdays, or matches
- Client-side state management complexity
- No proper deep linking support
- Difficult to implement proper ISR/SSG strategies

**Current Structure:**
```
/tournaments/landesliga (shows everything)
```

**Target Structure:**
```
/tournaments/landesliga
/tournaments/landesliga/2024-2025
/tournaments/landesliga/2024-2025/hauptrunde
/tournaments/landesliga/2024-2025/hauptrunde/matchday-1
/tournaments/landesliga/2024-2025/hauptrunde/matchday-1/standings
/tournaments/landesliga/2024-2025/hauptrunde/matchday-1/stats
/matches/[matchId] (for individual matches)
```

**Tasks:**
- [ ] Create `/tournaments/[tAlias]/index.tsx` - tournament overview
- [ ] Create `/tournaments/[tAlias]/[sAlias]/index.tsx` - season overview
- [ ] Create `/tournaments/[tAlias]/[sAlias]/[rAlias]/index.tsx` - round overview
- [ ] Create `/tournaments/[tAlias]/[sAlias]/[rAlias]/[mdAlias]/index.tsx` - matchday matches
- [ ] Create `/tournaments/[tAlias]/[sAlias]/[rAlias]/[mdAlias]/standings.tsx` - matchday standings
- [ ] Create `/tournaments/[tAlias]/[sAlias]/[rAlias]/[mdAlias]/stats.tsx` - matchday stats
- [ ] Create `/tournaments/[tAlias]/[sAlias]/[rAlias]/standings.tsx` - round standings
- [ ] Implement proper breadcrumb navigation
- [ ] Add canonical URLs and meta tags
- [ ] Implement proper getStaticPaths for all levels
- [ ] Update all internal links to use new URL structure
- [ ] Add redirects from old structure (if needed)
- [ ] Update sitemap generation

**Files Affected:** New page files, existing tournament page, navigation components, `sitemap.xml.tsx`

**Dependencies:** Should be done after #17 (Next.js upgrade)

---

## Integrated Implementation Roadmap

**Current Status:** ✅ Phase 0 Complete - Ready for Next.js Upgrade

### ✅ PHASE 0A: Pre-Foundation Dependencies (COMPLETE)

**Status:** All dependency updates complete including Next.js 12.3.4
- [x] Update browserslist database
- [x] Upgrade TypeScript 4.7.4 → 5.x
- [x] Upgrade React 18.2.0 → 18.3.1
- [x] Update Tailwind CSS, HeadlessUI, Formik
- [x] Update axios 1.6.1 → 1.13.2
- [x] Update yup 1.2.0 → 1.7.1
- [x] **Upgrade Next.js 12.2.0 → 12.3.4** ✅
- [x] Update development dependencies (eslint, type packages)
- [x] **Git commits:** Multiple commits for dependency updates
- [x] date-fns v4 upgrade deferred (breaking changes)

**Impact:** Modern TypeScript, React, and utilities in place. Next.js at 12.3.4 (latest 12.x)

---

### ✅ PHASE 0B: Foundation Refactoring (COMPLETE)

**Status:** All foundation work complete, application stable

**Task #2: Authentication & Authorization ✅**
- [x] Implement two-token system (access + refresh)
- [x] localStorage-based token storage
- [x] Axios interceptors for automatic token refresh
- [x] Request queueing during token refresh
- [x] Server-side authorization middleware
- [x] RBAC utilities and permission checks
- [x] **Git commits:** Multiple commits for auth refactoring

**Task #7: Security Vulnerabilities ✅**
- [x] Server-side permission validation
- [x] CSRF token handling
- [x] Input sanitization (lib/sanitize.ts)
- [x] Security headers in next.config.js
- [x] Rate limiting implementation
- [x] **Git commits:** Security improvements committed

**Task #3: API Integration ✅**
- [x] Centralized Axios client (lib/apiClient.tsx)
- [x] Request/response interceptors
- [x] Global error handling (lib/errorHandler.ts)
- [x] Loading/error/empty state components
- [x] Request cancellation support (useApiRequest hook)
- [x] **Git commits:** API centralization complete

**Task #1 (Partial): TypeScript Strict Mode ✅**
- [x] Enable strict mode in tsconfig.json
- [x] Fix all TypeScript compilation errors
- [x] Zero errors with `npx tsc --noEmit`
- [x] Remaining type improvements deferred to Phase 2+

**Current State:**
- ✅ TypeScript strict mode: ENABLED, compiling without errors
- ✅ Two-token authentication: LIVE
- ✅ Security hardening: COMPLETE
- ✅ Centralized API: IMPLEMENTED
- ✅ Next.js: 12.3.4 (latest 12.x stable)
- ✅ Application stable and tested
- ✅ **Ready for Next.js 13.x upgrade**

**Git tag:** (Suggest: v1.1.0-foundation)

---

### 🔄 PHASE 1: Next.js Incremental Upgrade (NEXT - Week 4-6)

**Current Next.js:** 12.3.4 ✅  
**Target:** 14.x (latest stable)  
**Status:** READY TO START

**Week 4: Next.js 12.3.x** ✅ COMPLETE
- [x] Already at Next.js 12.3.4 (latest 12.x)
- [x] Application running and tested
- [x] All pages and API routes functional

**Week 5: Next.js 13.5.x** ✅ COMPLETE
- [x] `npm install next@13.5.6`
- [x] Update next.config.js:
  - Enable `swcMinify: true`
  - Image configuration (already compatible)
- [x] Test all pages and API routes
- [x] Full regression testing
- [x] **Git commit:** "chore: upgrade Next.js 12.3.4 → 13.5.6"

**Week 6: Next.js 14.x** 🔄 IN PROGRESS
- [ ] `npm install next@latest`
- [ ] Update configuration for Next.js 14
- [ ] Test all features thoroughly
- [ ] Performance benchmarking
- [ ] **Git commit:** "chore: upgrade Next.js 13.x → 14.x"
- [ ] **Git tag:** v1.2.0-nextjs14

**Dependencies:**
- Requires: Phase 0a + 0b ✅ COMPLETE
- Blocks: Task #18 (URL refactoring), Task #4 (Performance)

**Files Affected:** 
- `package.json`
- `next.config.js` 
- All pages (testing)
- All API routes (testing)

### 📋 PHASE 2: Core Refactoring (Week 7-10)

**Status:** NOT STARTED  
**Dependencies:** Requires Phase 1 ✅

**Week 7-8: URL Structure & Data Fetching**
- [ ] **Task #18: Tournament URL Structure Refactoring**
  - Create new page structure: `/tournaments/[tAlias]/[sAlias]/[rAlias]/[mdAlias]`
  - Implement breadcrumb navigation
  - Add canonical URLs and meta tags
  - Implement getStaticPaths for all levels
  - Update all internal links
  - Update sitemap generation
  - **Git commits:** Per route level implemented
  
- [ ] **Task #6: Data Fetching Strategy**
  - Define SSR vs SSG strategy per page type
  - Migrate appropriate pages to SSG with ISR
  - Implement error boundaries
  - Add suspense boundaries
  - Consider SWR or React Query for client-side caching
  - **Git commits:** Per page migration

**Week 9-10: Performance & Forms**
- [ ] **Task #4: Performance Optimization**
  - Re-enable SWC minification (Next.js 14 compatible)
  - Implement dynamic imports for heavy components
  - Optimize bundle with tree-shaking
  - Implement route-based code splitting
  - Move tournament configs to database/API
  - Add performance monitoring
  - **Git commits:** Per optimization task
  
- [ ] **Task #5: Form Management & Validation**
  - Standardize on Formik + Yup across all forms
  - Create reusable form components library
  - Centralize validation schemas
  - Implement consistent error display patterns
  - **Git commits:** Per form component refactor
  
- [ ] **Git tag:** v1.3.0-core-refactoring

---

### 🧪 PHASE 3: Infrastructure & Quality (Week 11-14)

**Status:** NOT STARTED  
**Dependencies:** Requires Phase 2 complete

**Week 11-12: Testing Infrastructure**
- [ ] **Task #12: Testing & Code Quality**
  - Expand ESLint rules
  - Add Prettier with pre-commit hook (husky)
  - Set up Jest + React Testing Library
  - Write tests for lib utilities (auth, apiClient, sanitize)
  - Add E2E tests (Playwright/Cypress)
  - Create CI/CD pipeline
  - **Git commits:** Per testing milestone
  
**Week 13-14: Component Architecture & State**
- [ ] **Task #8: Component Architecture**
  - Refactor large components (>500 lines) - Header.tsx, LayoutAdm.tsx
  - Create shared component library
  - Add JSDoc comments to all components
  - Create component testing strategy
  - Standardize naming conventions
  - **Git commits:** Per component refactor
  
- [ ] **Task #9: State Management**
  - Evaluate Redux/Zustand need (likely Zustand for simplicity)
  - Implement state persistence layer
  - Add optimistic updates for mutations
  - Implement cache invalidation strategy
  - **Git commits:** State management implementation

- [ ] **Git tag:** v1.4.0-infrastructure

---

### 🎨 PHASE 4: Enhancement & Polish (Week 15+)

**Status:** NOT STARTED  
**Focus:** UX improvements, accessibility, documentation

- [ ] **Task #10: Image & Asset Management**
  - Proper Next/Image usage everywhere
  - Add blur placeholders
  - Audit and add alt texts
  - Centralize Cloudinary configuration
  
- [ ] **Task #11: Date & Time Handling**
  - Centralize date operations
  - Add timezone handling
  - **Upgrade date-fns to v4** (deferred from Phase 0a)
  - Test DST edge cases
  
- [ ] **Task #13: Documentation**
  - Comprehensive README
  - API documentation
  - Component documentation
  - Development setup guide
  
- [ ] **Task #14: Accessibility**
  - Audit with axe-devtools
  - Add ARIA labels
  - Test keyboard navigation
  - Screen reader testing
  
- [ ] **Task #15: Styling & UI Consistency**
  - Tailwind theme configuration
  - Design system tokens
  - UI component library
  
- [ ] **Task #16: Build & Deployment**
  - Environment variable validation
  - Deployment checklist
  - Bundle analyzer

- [ ] **Git tag:** v2.0.0-production-ready

---

### 🚀 OPTIONAL FUTURE: App Router Migration

**Status:** DEFERRED  
**Decision Point:** After Phase 4 complete

- [ ] Evaluate if App Router benefits justify migration effort
- [ ] Create incremental migration plan
- [ ] Start with simple static pages
- [ ] Maintain hybrid Pages + App Router approach
- [ ] Keep complex pages on Pages Router initially

---

## Quick Reference: Current Status & Dependencies

### ✅ COMPLETED (Phase 0a + 0b)
- Task #1 (Partial): TypeScript strict mode enabled, all errors fixed
- Task #2: Authentication refactoring with two-token system
- Task #3: API centralization with interceptors
- Task #7: Security hardening complete
- All non-Next.js dependencies upgraded
- **Application Status:** Stable, tested, ready for Next.js upgrade

### 🔄 NEXT UP (Phase 1 - Week 4-6)
- Next.js 12.2.0 → 12.3.4 → 13.5.6 → 14.x incremental upgrade
- **Blocks:** All Phase 2+ tasks

### 📋 BLOCKED UNTIL NEXT.JS 14 (Phase 2+)
- Task #18: URL structure refactoring (needs modern Next.js routing)
- Task #6: Data fetching strategy (SSG/ISR with Next.js 14)
- Task #4: Performance optimization (SWC minification, Next.js 14 features)
- Task #5: Form management standardization

### 🕐 CAN START ANYTIME (Independent)
- Task #10: Image & Asset Management
- Task #11: Date & Time Handling
- Task #13: Documentation
- Task #14: Accessibility
- Task #15: Styling & UI Consistency

### 🧪 PHASE 3+ (After Phase 2)
- Task #12: Testing infrastructure
- Task #8: Component architecture refactoring
- Task #9: State management
- Task #16: Build & Deployment

---

## Notes

This document represents a comprehensive audit after Season 1. Additional issues may be identified during implementation. Each task should be broken down into smaller, manageable tickets before implementation.

**Next Steps:**
1. Review and prioritize with team
2. Add season-specific issues
3. Create detailed implementation plans
4. Set up project tracking (GitHub Issues/Projects)