
# BISHL App - Testing Strategy

**Document Version:** 1.0  
**Date:** 2025-01-24  
**Status:** Active Testing Plan

---

## Testing Philosophy

**Core Principle:** Test stable foundation code now, defer page/component testing until after architectural refactoring is complete.

**Rationale:**
- Avoid wasting ~40-60 hours testing pages that will be rebuilt (Task #18, #8, #5)
- Focus testing effort on infrastructure that won't change (auth, API, security)
- Use manual regression testing for pages during refactoring phases
- Build comprehensive test suite only after architecture stabilizes

---

## Phase-Based Testing Approach

### Phase 0b: Foundation Testing (NOW - Week 1-3)

**Status:** ✅ Foundation Complete, Testing in Progress

#### What to Test (PRIORITY - Write Tests Now):

1. **Authentication & Authorization (`lib/auth.ts`)**
   ```typescript
   // Test cases:
   - hasRole() with single role
   - hasRole() with multiple roles
   - hasAnyRole() logic
   - hasPermission() checks
   - extractUserRoles() parsing
   ```

2. **API Client (`lib/apiClient.tsx`)**
   ```typescript
   // Test cases:
   - Token refresh queue logic (prevents duplicate refresh requests)
   - Request interceptor adds access token correctly
   - Response interceptor handles 401 errors
   - Request cancellation on component unmount
   - Error transformation in errorHandler
   ```

3. **Security Utilities**
   - `lib/sanitize.ts`: XSS prevention, SQL injection prevention
   - `lib/csrf.ts`: Token generation and validation
   - `lib/rateLimit.ts`: Rate limiting logic
   - `lib/serverAuth.ts`: Server-side auth middleware

4. **Server-side Authentication (`lib/serverAuth.ts`)**
   ```typescript
   // Test cases:
   - getServerSideAuth() extracts user correctly
   - requireAuth() redirects unauthenticated users
   - requireRoles() validates permissions
   ```

#### What NOT to Test (Skip for Now):

- ❌ Page components (`pages/**/*.tsx`)
- ❌ UI components (`components/ui/**`)
- ❌ Form components (`components/admin/**`)
- ❌ Layout components (`Layout.tsx`, `Header.tsx`)
- ❌ Any component that will be refactored in Task #8

#### Testing Method:
- **Unit tests** using Jest + React Testing Library
- **Manual regression testing** for pages after each change
- **No E2E tests** until Phase 3

---

### Phase 1-2: Active Refactoring (Week 4-10)

**Testing Approach:** Minimal testing, maximum velocity

#### During Next.js Upgrade (Week 4-6):
- ✅ Smoke tests: "Does the app build and load?"
- ✅ Manual testing of critical paths after each upgrade step
- ❌ No new automated tests

#### During Core Refactoring (Week 7-10):
- ✅ Update existing foundation tests if APIs change
- ✅ Manual regression testing after each task
- ❌ Don't test new components until architecture stabilizes

#### Critical Path Manual Testing Checklist:
```
After each major refactoring task, manually test:
- [ ] Login/Logout flow
- [ ] Admin dashboard access
- [ ] Form submissions (any one form)
- [ ] Match center (basic functionality)
- [ ] Calendar view loads
- [ ] Tournament page loads
- [ ] Permission checks work
```

---

### Phase 3: Comprehensive Testing Infrastructure (Week 11-14)

**Goal:** Build production-ready test suite for FINAL architecture

#### Week 11-12: Testing Setup

1. **Test Infrastructure**
   ```bash
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
   npm install --save-dev @playwright/test  # For E2E
   ```

2. **Configuration Files**
   - `jest.config.js`: Configure Jest for Next.js
   - `setupTests.ts`: Global test setup
   - `.github/workflows/test.yml`: CI/CD pipeline

3. **Test Organization**
   ```
   __tests__/
   ├── lib/              # Foundation tests (already written)
   ├── components/       # Component tests
   ├── pages/            # Page tests (after refactoring)
   ├── integration/      # Integration tests
   └── e2e/              # Playwright E2E tests
   ```

#### Week 13-14: Component & Page Testing

1. **Component Testing Priority**
   - Shared UI components (`components/ui/`)
   - Form components (after Task #5 standardization)
   - Layout components (after Task #8 refactoring)

2. **Page Testing Priority**
   - Authentication pages (login, logout)
   - Admin dashboard
   - Match center
   - Tournament pages (after Task #18 URL refactoring)

3. **E2E Testing (Playwright)**
   - User registration/login flow
   - Match management workflow
   - Admin operations
   - Form validation

---

## Testing Standards & Patterns

### Unit Test Template

```typescript
// __tests__/lib/auth.test.ts
import { hasRole, hasPermission } from '@/lib/auth';
import type { UserValues } from '@/types/UserValues';

describe('auth utilities', () => {
  const mockUser: UserValues = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    roles: ['admin', 'referee'],
    // ... other fields
  };

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      expect(hasRole(mockUser, 'admin')).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      expect(hasRole(mockUser, 'superadmin')).toBe(false);
    });

    it('should handle multiple roles', () => {
      expect(hasRole(mockUser, 'admin', 'referee')).toBe(true);
      expect(hasRole(mockUser, 'admin', 'clubadmin')).toBe(false);
    });
  });
});
```

### Component Test Template

```typescript
// __tests__/components/ui/LoadingState.test.tsx
import { render, screen } from '@testing-library/react';
import LoadingState from '@/components/ui/LoadingState';

describe('LoadingState', () => {
  it('renders loading message', () => {
    render(<LoadingState message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders default message when no message provided', () => {
    render(<LoadingState />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### E2E Test Template

```typescript
// __tests__/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login successfully', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('http://localhost:3000/admin');
  await expect(page.locator('text=Dashboard')).toBeVisible();
});
```

---

## Test Coverage Goals

### Phase 3 Targets (After All Refactoring):

- **Foundation Code:** 90%+ coverage
  - `lib/auth.ts`: 100%
  - `lib/apiClient.tsx`: 95%
  - `lib/sanitize.ts`: 100%
  - `lib/csrf.ts`: 95%

- **Components:** 80%+ coverage
  - Shared UI components: 85%
  - Form components: 80%
  - Layout components: 75%

- **Pages:** 60%+ coverage (integration tests)

- **E2E Critical Paths:** 100% coverage
  - Authentication flow
  - Match management
  - Admin operations

---

## CI/CD Integration

### GitHub Actions Workflow (Phase 3)

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run TypeScript checks
        run: npx tsc --noEmit
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Testing Tools & Libraries

### Already Installed:
- TypeScript 5.x
- ESLint
- Next.js testing utilities

### To Install (Phase 3):

```bash
# Unit testing
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom

# E2E testing
npm install --save-dev @playwright/test

# Mocking
npm install --save-dev msw  # Mock Service Worker for API mocking

# Coverage reporting
npm install --save-dev @codecov/codecov-action
```

---

## Manual Testing Checklist (Use During Phases 0-2)

### After Each Foundation Change:
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout successfully
- [ ] Access protected page without auth (should redirect)
- [ ] Access admin page without admin role (should show error)
- [ ] API call with valid token succeeds
- [ ] API call with expired token triggers refresh
- [ ] Form submission works
- [ ] Image upload works

### After Next.js Upgrade:
- [ ] All pages render without errors
- [ ] Build completes successfully (`npm run build`)
- [ ] Production build runs (`npm start`)
- [ ] Static assets load correctly
- [ ] API routes respond correctly
- [ ] Middleware functions correctly

---

## Success Criteria

### Phase 0b Complete When:
- [x] Auth utilities have 90%+ test coverage
- [x] API client has 85%+ test coverage
- [x] Security utilities have 90%+ test coverage
- [x] All tests pass in CI
- [ ] Manual regression testing passes

### Phase 3 Complete When:
- [ ] Foundation code: 90%+ coverage
- [ ] Components: 80%+ coverage
- [ ] E2E critical paths: 100% coverage
- [ ] CI/CD pipeline runs all tests automatically
- [ ] Test suite runs in <5 minutes
- [ ] Zero flaky tests

---

## Next Steps

1. **This Week (Phase 0b):**
   - Write unit tests for `lib/auth.ts`
   - Write unit tests for `lib/apiClient.tsx`
   - Write unit tests for `lib/sanitize.ts`
   - Setup Jest configuration

2. **Week 4-10 (Phase 1-2):**
   - Manual regression testing only
   - Update foundation tests if APIs change
   - Document any bugs found

3. **Week 11+ (Phase 3):**
   - Setup Playwright
   - Write component tests
   - Write E2E tests
   - Setup CI/CD pipeline

---

## Notes

- **Don't test what will change:** Avoid testing pages/components that will be refactored in Tasks #5, #8, #18
- **Test the foundation:** Focus on stable infrastructure code that won't change
- **Manual > Automated (for now):** During active refactoring, manual testing is more efficient
- **Comprehensive testing later:** Build full test suite after architecture stabilizes

**Estimated Time Saved:** ~40-60 hours by deferring page/component testing until after refactoring
