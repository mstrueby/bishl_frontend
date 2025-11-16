
# Client-Side Authentication Migration Plan

## Status: IN PROGRESS

## Overview
Migrating all `pages/admin/*` from server-side `getServerSideProps` to client-side authentication using `useAuth` and `usePermissions` hooks.

## Why Client-Side?
- Tokens stored in localStorage (not cookies)
- Automatic token refresh via apiClient interceptors
- Simpler code, no SSR complexity
- Admin pages don't need SEO

## Migration Patterns

### Pattern A: List/Index Pages (e.g., index.tsx)

```typescript
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import { UserRole } from '../../../lib/auth';
import LoadingState from '../../../components/ui/LoadingState';

const IndexPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [data, setData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // 1. Auth redirect check
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAnyRole([UserRole.REQUIRED])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // 2. Data fetching - separate function for reuse
  const fetchData = async () => {
    try {
      const res = await apiClient.get('/endpoint');
      setData(res.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching data:', error);
      }
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    
    const loadData = async () => {
      await fetchData();
      setDataLoading(false);
    };
    loadData();
  }, [authLoading, user]);

  // 3. Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Page Title" />
        <LoadingState />
      </Layout>
    );
  }

  // 4. Auth guard
  if (!hasAnyRole([UserRole.REQUIRED])) return null;

  return <Layout>{/* content */}</Layout>;
};
```

### Pattern B: Add Pages (e.g., add.tsx)

```typescript
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import { UserRole } from '../../../lib/auth';
import LoadingState from '../../../components/ui/LoadingState';

const AddPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // 1. Auth redirect check
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAnyRole([UserRole.REQUIRED])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // 2. Submit handler
  const onSubmit = async (values: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      const response = await apiClient.post('/endpoint', formData);
      
      if (response.status === 201) {
        router.push({
          pathname: '/admin/resource',
          query: { message: `Success message` }
        }, '/admin/resource');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError('An error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Loading state (auth only)
  if (authLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // 4. Auth guard
  if (!hasAnyRole([UserRole.REQUIRED])) return null;

  return <Layout>{/* form with onSubmit */}</Layout>;
};
```

### Pattern C: Edit Pages (e.g., [id]/edit.tsx)

```typescript
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import { UserRole } from '../../../lib/auth';
import LoadingState from '../../../components/ui/LoadingState';

const EditPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [data, setData] = useState<DataType | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { id } = router.query as { id: string };

  // 1. Auth redirect check
  useEffect(() => {
    if (authLoading) return;
    
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
    if (authLoading || !user || !id) return;
    
    const fetchData = async () => {
      try {
        const response = await apiClient.get(`/endpoint/${id}`);
        setData(response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/admin/resource');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  }, [authLoading, user, id, router]);

  // 3. Submit handler
  const onSubmit = async (values: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        // Handle files, objects, etc.
        formData.append(key, value as string);
      });
      
      const response = await apiClient.patch(`/endpoint/${data?._id}`, formData);
      
      if (response.status === 200) {
        router.push({
          pathname: '/admin/resource',
          query: { message: `Success message` }
        }, '/admin/resource');
      }
    } catch (error: any) {
      if (error.response?.status === 304) {
        router.push({
          pathname: '/admin/resource',
          query: { message: `No changes message` }
        }, '/admin/resource');
      } else {
        setError('An error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Loading state
  if (authLoading || dataLoading) {
    return <Layout><LoadingState /></Layout>;
  }

  // 5. Auth guard
  if (!hasAnyRole([UserRole.REQUIRED])) return null;

  if (!data) {
    return <Layout><LoadingState /></Layout>;
  }

  return <Layout>{/* form with onSubmit */}</Layout>;
};
```

## Pages Migration Status

### ✅ Completed (24)
- [x] `pages/admin/posts/index.tsx` - AUTHOR/ADMIN
- [x] `pages/admin/documents/index.tsx` - ADMIN
- [x] `pages/admin/clubs/index.tsx` - ADMIN/LEAGUE_MANAGER
- [x] `pages/admin/players/index.tsx` - ADMIN/LEAGUE_MANAGER
- [x] `pages/admin/venues/index.tsx` - ADMIN
- [x] `pages/admin/refadmin/index.tsx` - ADMIN
- [x] `pages/admin/myref/index.tsx` - REFEREE
- [x] `pages/admin/myclub/index.tsx` - CLUB_ADMIN/ADMIN
- [x] `pages/admin/documents/[alias]/edit.tsx` - ADMIN
- [x] `pages/admin/posts/[alias]/edit.tsx` - AUTHOR/ADMIN
- [x] `pages/admin/posts/add.tsx` - AUTHOR/ADMIN
- [x] `pages/admin/players/[playerId]/edit.tsx` - ADMIN/LEAGUE_MANAGER
- [x] `pages/admin/venues/[alias]/edit.tsx` - ADMIN
- [x] `pages/admin/clubs/[cAlias]/edit.tsx` - ADMIN
- [x] `pages/admin/clubs/[cAlias]/teams/[tAlias]/edit.tsx` - ADMIN
- [x] `pages/admin/refadmin/referees/[userId]/edit.tsx` - ADMIN
- [x] `pages/admin/documents/add.tsx` - DOC_ADMIN/ADMIN
- [x] `pages/admin/clubs/add.tsx` - ADMIN
- [x] `pages/admin/clubs/[cAlias]/teams/add.tsx` - ADMIN
- [x] `pages/admin/players/add.tsx` - ADMIN/LEAGUE_MANAGER
- [x] `pages/admin/venues/add.tsx` - ADMIN

### 🔄 In Progress (0)

### ⏳ Pending (0)

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
