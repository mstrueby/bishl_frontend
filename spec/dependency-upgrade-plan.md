
# Dependency Upgrade Plan

**Document Version:** 1.0  
**Date:** 2025-01-24  
**Status:** Ready to Execute

---

## Current State Analysis

### Critical Outdated Dependencies
| Package | Current | Latest Stable | Security Risk | Breaking Changes | Priority |
|---------|---------|---------------|---------------|------------------|----------|
| next | 12.2.0 | 14.2.x | HIGH | YES - Major | WEEK 4-6 |
| typescript | 4.7.4 | 5.6.3 | MEDIUM | MINOR | WEEK 1 |
| react | 18.2.0 | 18.3.1 | LOW | NO | WEEK 1 |
| react-dom | 18.2.0 | 18.3.1 | LOW | NO | WEEK 1 |
| @headlessui/react | 2.2.0 | 2.2.0 | N/A | Current | ✅ Current |
| @heroicons/react | 2.1.5 | 2.2.0 | LOW | NO | WEEK 1 |
| tailwindcss | 3.4.14 | 3.4.16 | LOW | NO | WEEK 1 |
| autoprefixer | - | latest | LOW | NO | WEEK 1 |
| axios | 1.6.1 | 1.7.9 | MEDIUM | MINOR | WEEK 1 |
| formik | 2.4.2 | 2.4.6 | LOW | NO | WEEK 1 |
| yup | 1.2.0 | 1.6.0 | LOW | MINOR | WEEK 1 |
| date-fns | 2.30.0 | 4.1.0 | LOW | YES - Major | DEFER |
| browserslist | outdated | latest | LOW | NO | WEEK 1 DAY 1 |

---

## Execution Plan

### PHASE 0A: Safe Dependency Upgrades ✅ COMPLETE

#### Step 0: Update Browserslist ✅ COMPLETE
```bash
npx update-browserslist-db@latest
```

**Why First:** This is a quick fix for the console warning and ensures browser compatibility data is current for all subsequent updates.

**Test After:** Verify warning is gone when running `npm run dev` ✅

#### Step 1: Minor Patch Updates ✅ COMPLETE
```bash
npm update tailwindcss autoprefixer postcss
npm update formik
npm update @headlessui/react @heroicons/react
```

**Test After:** `npm run build` and manual testing of forms and UI components ✅

#### Step 2: TypeScript 5.x Upgrade ✅ COMPLETE
```bash
npm install --save-dev typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest
```

**Changes Required:**
- Update `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "lib": ["dom", "dom.iterable", "ES2022"],
      "module": "esnext",
      "moduleResolution": "bundler",
      "strict": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "noEmit": true,
      "esModuleInterop": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
    "exclude": ["node_modules"]
  }
  ```

**Test After:** Fix all TypeScript errors, run `npm run build` ✅

#### Step 3: React 18.3.1 Upgrade ✅ COMPLETE
```bash
npm install react@18.3.1 react-dom@18.3.1
```

**Test After:** All pages, especially forms and interactive components ✅

#### Step 4: Development Dependencies ✅ COMPLETE
```bash
npm update eslint eslint-config-next @typescript-eslint/parser @typescript-eslint/scope-manager
npm install --save-dev @types/cookie@latest @types/prismjs@latest
```

**Test After:** `npm run lint` and `npm run build` ✅

#### Step 5: Utility Libraries ✅ COMPLETE
```bash
# Axios - minor version bump, check for breaking changes
npm install axios@latest

# Yup - minor breaking changes in v1.6
npm install yup@latest

# date-fns - MAJOR version, skip for now or create migration plan
# npm install date-fns@latest  # DO NOT run yet - v4 has breaking changes
```

**Test After:** All API calls, form validation ✅

---

**Phase 0A Summary:**
- ✅ Browserslist updated to latest
- ✅ TypeScript upgraded to 5.x with modern configuration
- ✅ React upgraded to 18.3.1
- ✅ Tailwind CSS, Formik, HeadlessUI updated
- ✅ Axios, Yup updated
- ✅ Development dependencies updated
- ✅ date-fns v4 upgrade deferred (breaking changes)

**Next:** Proceed to Phase 0B

---

### PHASE 0B: Foundation Refactoring (Week 2-3)

Complete these tasks from `refactoring-tasks.md`:
- Task #2: Authentication & Authorization System
- Task #7: Security Vulnerabilities  
- Task #3: API Integration & Error Handling
- Task #1: TypeScript Migration (enable strict mode)

**Do not proceed to Next.js upgrade until these are complete**

---

### PHASE 1: Next.js Incremental Upgrade (Week 4-6)

#### Step 1: Next.js 12.3.x (Latest 12.x)
```bash
npm install next@12.3.4
```

**Changes Required:**
- Test all pages
- Check middleware if any
- Verify API routes

**Test Thoroughly Before Proceeding**

#### Step 2: Next.js 13.5.x (Stable 13.x)
```bash
npm install next@13.5.6
```

**Breaking Changes:**
- `next/image` requires `alt` attribute (already compliant)
- Font optimization changes
- `next.config.js` updates may be needed
- Middleware API changes

**Update `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Re-enable SWC minification
  images: {
    domains: ['res.cloudinary.com'],
  },
  i18n: {
    locales: ["de-DE"],
    defaultLocale: "de-DE",
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://api.bishl.de' : process.env.NEXT_PUBLIC_API_URL,
  }
}

module.exports = nextConfig
```

**Test Thoroughly Before Proceeding**

#### Step 3: Next.js 14.x (Latest Stable)
```bash
npm install next@latest
```

**Breaking Changes:**
- Turbopack (optional, opt-in)
- Metadata API improvements
- Server Actions (Pages Router still works)
- Image optimization changes

**Test All Features**

---

### PHASE 2: Optional - date-fns 4.x (After Next.js Upgrade)

**Breaking Changes in date-fns v4:**
- ESM-only (may require build config changes)
- Some function signatures changed
- Better TypeScript support

**Migration:**
1. Create branch
2. `npm install date-fns@latest`
3. Update imports (may need `/esm/` path)
4. Test all date formatting/parsing
5. Update `tools/dateUtils.tsx`

---

## Testing Checklist After Each Phase

### Critical Paths to Test:
- [ ] User login/logout
- [ ] Admin dashboard access
- [ ] Form submissions (club, team, player, match)
- [ ] Image uploads (Cloudinary)
- [ ] Match center functionality
- [ ] Tournament pages
- [ ] Calendar view
- [ ] PDF generation
- [ ] API calls to backend
- [ ] Permission checks
- [ ] Date formatting/display

### Build & Deploy Tests:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] All pages load correctly
- [ ] Forms validate properly
- [ ] Images display correctly

---

## Rollback Plan

If any phase fails:
1. `git reset --hard <previous-commit>`
2. `npm install` to restore previous dependencies
3. Document the failure
4. Fix issues before retrying

---

## Success Criteria

### Phase 0A Complete When:
- [ ] All non-Next.js dependencies updated
- [ ] TypeScript 5.x working
- [ ] React 18.3.1 working
- [ ] All tests passing
- [ ] No regressions

### Phase 1 Complete When:
- [ ] Next.js 14.x running stable
- [ ] All pages functional
- [ ] Build successful
- [ ] Performance maintained or improved
- [ ] No breaking changes affecting users

---

**IMPORTANT:** Take git commits after each successful step. Create a branch for the upgrade work.

**Estimated Total Time:** 6-8 weeks (with testing and fixes)
