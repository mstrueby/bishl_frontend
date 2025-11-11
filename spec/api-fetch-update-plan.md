
# API Fetch Update Plan - Immediate Implementation

*Created: 2025-01-22*  
*Priority: CRITICAL*  
*Status: In Progress*

---

## Backend Response Format Changes

All API endpoints now return standardized wrappers (see `spec/api-response-standards.md`):

### Before (Old Frontend Expectation)
```javascript
// Single resource
const match = await fetch('/matches/123').then(r => r.json());
// match = { _id: "123", name: "..." }

// List
const matches = await fetch('/matches').then(r => r.json());
// matches = [{ _id: "1" }, { _id: "2" }]
```

### After (New Backend Format)
```javascript
// Single resource
const response = await fetch('/matches/123').then(r => r.json());
// response = { success: true, data: { _id: "123", name: "..." }, message: "..." }

// Paginated list
const response = await fetch('/matches?page=1&page_size=10').then(r => r.json());
// response = { success: true, data: [...], pagination: {...}, message: "..." }
```

---

## Migration Strategy

### Phase 1: Create API Client Helper ✅ COMPLETE
**File:** `lib/apiClient.tsx`

**Status:** ✅ FULLY IMPLEMENTED (2025-01-24)

Features implemented:
- ✅ Handles response unwrapping automatically
- ✅ Manages authentication headers (Bearer token)
- ✅ Implements token refresh interceptor with request queueing
- ✅ Stores both access_token and refresh_token
- ✅ Automatic retry of failed requests after token refresh
- ✅ Graceful handling of refresh token expiration
- ✅ Redirect to login on auth failure

### Phase 2: Update All Fetch Calls ✅ COMPLETE

Replace all `fetch()` and `axios()` calls to use the new client.

**Status:** All user-facing pages have been migrated to use `apiClient` with proper response unwrapping.

---

## Files Requiring Updates

### High Priority (Breaks App - Fix First)

#### 1. **pages/index.tsx** ✅ COMPLETE
- **Issue:** Expects raw arrays for tournaments/posts
- **Lines:** ~40-100
- **Fix:** Unwrap `data` from response

#### 2. **pages/matches/[id]/index.tsx** ✅ COMPLETE
- **Issue:** Expects raw match object
- **Fix:** Unwrap `data` from response

#### 3. **pages/matches/[id]/matchcenter/index.tsx** ✅ COMPLETE
- **Issue:** Multiple fetch calls expect raw data
- **Fix:** Unwrap all responses

#### 4. **pages/tournaments/[alias].tsx** ✅ COMPLETE
- **Issue:** Expects raw tournament object
- **Fix:** Unwrap `data`

#### 5. **pages/clubs/index.tsx** ✅ COMPLETE
- **Issue:** Expects raw clubs array
- **Fix:** Unwrap `data` and handle pagination

#### 6. **pages/posts/index.tsx** ✅ COMPLETE
- **Issue:** Expects raw posts array
- **Fix:** Unwrap `data` and handle pagination

#### 7. **pages/calendar/index.tsx** ✅ COMPLETE
- **Issue:** Expects raw matches array
- **Fix:** Unwrap `data`

### Medium Priority (Admin Pages)

#### 8. **pages/admin/clubs/index.tsx** ✅ COMPLETE
- **Fix:** Unwrap `data`, add pagination support

#### 8a. **pages/admin/clubs/add.tsx** ✅ COMPLETE
- **Fix:** Use apiClient for POST requests

#### 8b. **pages/admin/clubs/[cAlias]/edit.tsx** ✅ COMPLETE
- **Fix:** Use apiClient for PATCH requests

#### 8c. **pages/admin/venues/index.tsx** ✅ COMPLETE
- **Fix:** Use apiClient, unwrap data, add pagination

#### 8d. **pages/venues/index.tsx** ✅ COMPLETE
- **Fix:** Use apiClient, unwrap data, add pagination

#### 8e. **pages/documents/[category].tsx** ✅ COMPLETE
- **Fix:** Use apiClient, unwrap data, add pagination

#### 9. **pages/admin/players/index.tsx** ✅ COMPLETE
- **Fix:** Unwrap `data`, add pagination support

#### 10. **pages/admin/posts/index.tsx** ✅ COMPLETE
- **Fix:** Unwrap `data`, add pagination support

#### 10a. **pages/admin/posts/add.tsx** ✅ COMPLETE
- **Fix:** Use apiClient for POST requests

#### 10b. **pages/admin/posts/[alias]/edit.tsx** ✅ COMPLETE
- **Fix:** Use apiClient for PATCH requests

#### 10c. **pages/posts/[alias].tsx** ✅ COMPLETE
- **Fix:** Use apiClient for GET requests

#### 11. **pages/admin/myclub/index.tsx** ✅ COMPLETE
- **Fix:** Unwrap `data`

#### 12. **pages/admin/myref/index.tsx** ✅ COMPLETE
- **Fix:** Unwrap `data`

#### 13. **pages/admin/documents/index.tsx** ✅ COMPLETE
- **Fix:** Unwrap `data`, add pagination support

### All Files Pattern
Search for: `fetch(.*?).then.*?json()` to find all fetch calls

---

## Implementation Steps

### Step 1: Create API Client
```typescript
// lib/apiClient.tsx
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - unwrap data & handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap standardized response
    if (response.data?.success !== undefined) {
      return {
        ...response,
        data: response.data.data,
        pagination: response.data.pagination,
        message: response.data.message
      };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/users/refresh`,
            { refresh_token: refreshToken }
          );
          
          const { access_token } = response.data.data;
          localStorage.setItem('access_token', access_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed - redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Step 2: Update getServerSideProps Pattern
```typescript
// Old pattern
export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${API_URL}/tournaments/`);
  const tournaments = await res.json();
  return { props: { tournaments } };
};

// New pattern
import apiClient from '@/lib/apiClient';

export const getServerSideProps: GetServerSideProps = async () => {
  const response = await apiClient.get('/tournaments/', {
    params: { page: 1, page_size: 100 }
  });
  const tournaments = response.data || [];
  const pagination = response.pagination;
  return { props: { tournaments, pagination } };
};
```

### Step 3: Update Client-side Fetch Pattern
```typescript
// Old pattern
const response = await fetch(`${API_URL}/matches/${id}`);
const match = await response.json();

// New pattern
import apiClient from '@/lib/apiClient';

const response = await apiClient.get(`/matches/${id}`);
const match = response.data;
```

---

## Testing Checklist

After each file update, test:

- [ ] Data loads correctly
- [ ] Pagination works (if applicable)
- [ ] Error handling works
- [ ] Loading states display
- [ ] Token refresh works on 401
- [ ] Logout redirects properly

---

## Pagination Support

Add pagination props to components:

```typescript
interface Props {
  items: any[];
  pagination?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
```

Use existing `components/ui/Pagination.tsx` component.

---

## Error Handling Pattern

```typescript
try {
  const response = await apiClient.get('/endpoint');
  const data = response.data;
  // Use data
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || 'An error occurred';
    setError(message);
  }
}
```

---

## Migration Order

1. ✅ Create `lib/apiClient.tsx`
2. ✅ Update `pages/index.tsx` (homepage - most visible)
3. ✅ Update `pages/tournaments/[alias].tsx`
4. ✅ Update `pages/matches/[id]/index.tsx`
5. ✅ Update `pages/matches/[id]/matchcenter/index.tsx`
6. ✅ Update `pages/clubs/index.tsx`
7. ✅ Update `pages/calendar/index.tsx`
8. ✅ Update `pages/posts/index.tsx`
9. ✅ Update all admin pages
10. ⏳ Update all API routes in `pages/api/` (if needed)

---

## Breaking Changes

⚠️ **All users must re-login after deployment** (auth token format changed)

---

*Next Step: Implement `lib/apiClient.tsx` immediately*
