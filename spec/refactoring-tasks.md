
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
- [ ] Audit all components for proper TypeScript usage
- [ ] Create comprehensive type definitions for all API responses
- [ ] Remove all `any` types and replace with proper interfaces
- [ ] Add strict type checking in tsconfig.json
- [ ] Implement proper type guards for API data validation

**Files Affected:** Most components, especially `Header.tsx`, API integration points

---

### 2. Authentication & Authorization System
**Impact:** High | **Risk:** High | **Effort:** Medium

**Issues:**
- Cookie-based JWT storage vulnerable to XSS
- No token refresh mechanism
- Authorization logic scattered across components
- Permission calculations done client-side (can be manipulated)
- No centralized role-based access control (RBAC)

**Tasks:**
- [ ] Implement HTTP-only cookies for JWT storage
- [ ] Add token refresh mechanism
- [ ] Centralize authorization logic in middleware
- [ ] Move permission validation to API layer
- [ ] Create comprehensive RBAC utility functions
- [ ] Add session timeout handling

**Files Affected:** `context/AuthContext.tsx`, `hooks/useAuth.tsx`, `pages/api/login.tsx`, `tools/utils.tsx`

---

### 3. API Integration & Error Handling
**Impact:** High | **Risk:** Medium | **Effort:** Medium

**Issues:**
- No centralized API client
- Inconsistent error handling across pages
- No request/response interceptors
- Hard-coded API URLs in multiple locations
- No retry logic for failed requests
- Missing loading states in many components

**Tasks:**
- [ ] Create centralized Axios instance with interceptors
- [ ] Implement global error handling strategy
- [ ] Add retry logic for network failures
- [ ] Create consistent loading/error state components
- [ ] Implement request cancellation for component unmount
- [ ] Add API response caching strategy

**Files Affected:** All pages with `getServerSideProps`, `getStaticProps`, API calls

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

### 7. Security Vulnerabilities
**Impact:** Medium | **Risk:** High | **Effort:** Small

**Issues:**
- Client-side permission checks can be bypassed
- No CSRF protection visible
- Sensitive data in client-side code
- No input sanitization for rich text editor
- Missing security headers

**Tasks:**
- [ ] Implement server-side permission validation
- [ ] Add CSRF token handling
- [ ] Remove sensitive data from client bundle
- [ ] Sanitize all rich text input/output
- [ ] Add security headers in next.config.js
- [ ] Implement rate limiting

**Files Affected:** `tools/utils.tsx`, API routes, form components

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

### 17. Dependencies & Next.js Upgrade Strategy
**Impact:** High | **Risk:** High | **Effort:** Large

**Issues:**
- Next.js 12.2.0 is severely outdated (current is 14.x/15.x)
- Missing critical security patches and performance improvements
- Tailwind CSS 3.4.14 (current stable)
- HeadlessUI 2.2.0 (current: 2.2.0 - latest)
- React 18.2.0 (current stable: 18.3.1)
- TypeScript 4.7.4 (current: 5.x)
- Other dependencies need security updates
- No access to modern Next.js features (App Router, Server Components, etc.)
- Breaking changes expected in upgrade path

**RECOMMENDED UPGRADE SEQUENCE:**

**Phase 0a: Pre-Foundation Dependencies (DO NOW)**
- [ ] Update TypeScript to 5.x
- [ ] Update React to 18.3.1
- [ ] Update Tailwind CSS to latest 3.x
- [ ] Update date-fns, axios, formik, yup (non-breaking)
- [ ] Update development dependencies (eslint, etc.)
- [ ] Test application thoroughly
- [ ] **DO NOT upgrade Next.js yet**

**Phase 0b: Foundation Work (Week 1-2)**
- [ ] Complete Task #2 (Authentication refactoring)
- [ ] Complete Task #7 (Security vulnerabilities)
- [ ] Complete Task #3 (API integration centralization)
- [ ] Enable TypeScript strict mode
- [ ] Fix all TypeScript errors

**Phase 1: Next.js Incremental Upgrade (Week 3-4)**
- [ ] Upgrade Next.js 12.2 → 12.3.x (latest 12.x)
- [ ] Test all pages and API routes
- [ ] Fix any breaking changes
- [ ] Upgrade Next.js 12.x → 13.5.x (stable 13.x)
- [ ] Test with Pages Router (no App Router yet)
- [ ] Fix breaking changes (middleware, next/image, etc.)
- [ ] Update next.config.js for Next.js 13
- [ ] Test all functionality

**Phase 2: Next.js 14 & Modern Features (Week 5-6)**
- [ ] Upgrade Next.js 13.x → 14.x (latest stable)
- [ ] Test thoroughly with Pages Router
- [ ] Update build configuration
- [ ] Consider App Router migration plan (separate phase)
- [ ] Test all pages and API routes
- [ ] Performance benchmarking

**Phase 3 (Optional): App Router Migration (Week 7+)**
- [ ] Evaluate if App Router is needed
- [ ] Create migration plan for specific routes
- [ ] Migrate incrementally (start with simple pages)
- [ ] Maintain Pages Router for complex pages initially
- [ ] Use hybrid approach (Pages + App Router)

**Why This Sequence?**
1. **Stability First**: Foundation refactoring reduces risk
2. **Incremental Safety**: Smaller upgrade steps = easier debugging
3. **Type Safety**: TypeScript 5.x + strict mode before architectural changes
4. **API Stability**: Centralized API client before Next.js changes
5. **Auth Security**: Fixed auth before framework migration
6. **Dependency Compatibility**: Other deps upgraded first for better Next.js compatibility

**Files Affected:** `package.json`, `next.config.js`, `tsconfig.json`, potentially all pages if migrating to App Router

**Critical Note:** Next.js upgrade should happen AFTER completing Tasks #2, #3, #7, and #1 (partial)

**Dependencies:** 
- Must complete before: Task #18 (URL structure refactoring)
- Should complete first: Tasks #2, #3, #7, #1 (partial)

---

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

## Priority Recommendations

### Phase 0a - Pre-Foundation Dependencies (Week 1 - DO NOW):
1. **Dependencies Upgrade - Part 1 (#17a)** - Everything EXCEPT Next.js
   - TypeScript 4.7.4 → 5.6.3
   - React 18.2.0 → 18.3.1
   - Tailwind, axios, formik, yup, dev dependencies
   - Test thoroughly after each group

### Phase 0b - Foundation (Week 2-3 - Critical):
2. **Authentication & Authorization System (#2)** - Security critical
3. **Security Vulnerabilities (#7)** - Fix before Next.js upgrade
4. **API Integration & Error Handling (#3)** - Centralize before migration
5. **TypeScript Migration (#1)** - Enable strict mode, fix errors

### Phase 1 - Next.js Upgrade (Week 4-6):
6. **Next.js Incremental Upgrade (#17b)**
   - 12.2 → 12.3.x → 13.5.x → 14.x
   - Test extensively between each step
   - Update configuration progressively

### Phase 2 - Core Refactoring (Week 7-10):
7. **Tournament URL Structure Refactoring (#18)** - After Next.js stable
8. **Data Fetching Strategy (#6)** - Use Next.js 14 patterns
9. **Performance Optimization (#4)** - Leverage new Next.js features

### Phase 2 - Infrastructure (Early Season 2):
7. Code Quality & Testing (#12) - Set up testing before more changes
8. Performance Optimization (#4)
9. Data Fetching Strategy (#6)

### Phase 3 - Enhancement (Mid Season 2):
10. Form Management (#5)
11. Component Architecture (#8)
12. State Management (#9)

### Phase 4 - Polish (Post Season 2):
13. Image & Asset Management (#10)
14. Documentation (#13)
15. Accessibility (#14)
16. Styling & UI Consistency (#15)

---

## Notes

This document represents a comprehensive audit after Season 1. Additional issues may be identified during implementation. Each task should be broken down into smaller, manageable tickets before implementation.

**Next Steps:**
1. Review and prioritize with team
2. Add season-specific issues
3. Create detailed implementation plans
4. Set up project tracking (GitHub Issues/Projects)
