
# Client-Side Authentication Migration Plan

## Status: IN PROGRESS

## Overview
Migrating all `pages/admin/*` from server-side `getServerSideProps` to client-side authentication using `useAuth` and `usePermissions` hooks.

## Why Client-Side?
- Tokens stored in localStorage (not cookies)
- Automatic token refresh via apiClient interceptors
- Simpler code, no SSR complexity
- Admin pages don't need SEO

## Migration Pattern

```typescript
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import { UserRole } from '../../../lib/auth';
import LoadingState from '../../../components/ui/LoadingState';

const Page = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [data, setData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // 1. Auth redirect check
  useEffect(() => {
    if (authLoading) return; // Wait for auth to complete
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAnyRole([UserRole.REQUIRED])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // 2. Data fetching
  useEffect(() => {
    if (authLoading || !user) return;
    
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/endpoint');
        setData(res.data);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [authLoading, user]);

  // 3. Loading state
  if (authLoading || dataLoading) {
    return <Layout><LoadingState /></Layout>;
  }

  // 4. Auth guard
  if (!hasAnyRole([UserRole.REQUIRED])) return null;

  return <Layout>{/* content */}</Layout>;
};
```

## Pages Migration Status

### ✅ Completed (8)
- [x] `pages/admin/posts/index.tsx` - AUTHOR/ADMIN
- [x] `pages/admin/documents/index.tsx` - ADMIN
- [x] `pages/admin/clubs/index.tsx` - ADMIN/LEAGUE_MANAGER
- [x] `pages/admin/players/index.tsx` - ADMIN/LEAGUE_MANAGER
- [x] `pages/admin/venues/index.tsx` - ADMIN
- [x] `pages/admin/refadmin/index.tsx` - ADMIN
- [x] `pages/admin/myref/index.tsx` - REFEREE
- [x] `pages/admin/myclub/index.tsx` - CLUB_ADMIN/ADMIN

### 🔄 In Progress (0)

### ⏳ Pending (2)

#### High Priority - List Pages

#### Medium Priority - Edit Pages
- [ ] `pages/admin/documents/[alias]/edit.tsx` - DOC_ADMIN/ADMIN
- [ ] `pages/admin/clubs/[cAlias]/teams/[tAlias]/edit.tsx` - ADMIN

### ✅ Already Client-Side (1)
- `pages/admin/profile/index.tsx`

## Key Changes Per File

### Remove:
- `GetServerSideProps` import and function
- `getCookie` import and usage
- `jwt` prop passing
- Server-side auth checks

### Add:
- `useAuth()` hook
- `usePermissions()` hook  
- `UserRole` enum import
- `LoadingState` component
- Client-side auth redirect useEffect
- Client-side data fetching useEffect
- Loading state rendering
- Auth guard before main render

### Update:
- Remove `jwt` parameter from all API calls (apiClient handles it)
- Change toggle/delete functions to use apiClient directly
- Component signature from `NextPage<Props>` to `NextPage`

## Testing Checklist

For each migrated page:
- [ ] Page loads without errors
- [ ] Unauthorized users redirected to `/`
- [ ] Loading states show correctly
- [ ] Data fetches successfully
- [ ] Actions (edit/delete/toggle) work
- [ ] Token refresh works seamlessly
- [ ] No console errors

## Notes
- All pages use apiClient which automatically adds Authorization header from localStorage
- No need to pass jwt as props anymore
- usePermissions provides clean role checking API
- LoadingState component provides consistent UX
