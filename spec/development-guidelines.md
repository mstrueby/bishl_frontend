
# BISHL App - Development Guidelines

**Document Version:** 1.0  
**Date:** 2025-02-02  
**Status:** Active

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [API Integration](#api-integration)
3. [Error Handling](#error-handling)
4. [Data Fetching Strategies](#data-fetching-strategies)
5. [Security Best Practices](#security-best-practices)
6. [Component Patterns](#component-patterns)
7. [Code Quality Standards](#code-quality-standards)

---

## Authentication & Authorization

### Client-Side Authentication Pattern

**✅ DO:**
```typescript
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { UserRole, Permission } from '../lib/auth';
import LoadingState from '../components/ui/LoadingState';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const AdminPage: NextPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAuthenticated, hasRole, hasPermission } = usePermissions();

  // Client-side auth guard
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    // Check specific role/permission
    if (!hasRole(UserRole.ADMIN)) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router, hasRole]);

  // Show loading state while checking auth
  if (authLoading) {
    return <LoadingState />;
  }

  // Guard against rendering before redirect
  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Your admin content */}
    </div>
  );
};
```

**❌ DON'T:**
```typescript
// Don't use getServerSideProps for auth checks
export async function getServerSideProps(context) {
  const jwt = getCookie('jwt', context); // ❌ NO
  const response = await axios.get('/users/me', {
    headers: { Authorization: `Bearer ${jwt}` }
  }); // ❌ NO
  return { props: { user: response.data, jwt } };
}

// Don't pass jwt as props
const AdminPage = ({ jwt }) => { // ❌ NO
  // ...
};
```

### Permission Checks

**Available Hooks:**
```typescript
const {
  // Auth state
  isAuthenticated,
  user,
  
  // Permission checks
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  
  // Role checks
  hasRole,
  hasAnyRole,
  isAdmin,
  isLeagueManager,
  isReferee,
  isClubManager,
  
  // Resource-specific
  canManageClub,
  canManageTeamPlayers,
  
  // All permissions
  permissions
} = usePermissions();
```

**Conditional Rendering:**
```typescript
// Show edit button only if user has permission
{hasPermission(Permission.MANAGE_MATCHES) && (
  <button onClick={handleEdit}>Edit</button>
)}

// Show admin section only for admins
{isAdmin && (
  <AdminPanel />
)}

// Check multiple permissions
{hasAnyPermission([Permission.MANAGE_CLUBS, Permission.MANAGE_OWN_CLUB]) && (
  <ClubManagement />
)}
```

### Token Management

**Storage:**
- Access tokens: `localStorage.getItem('access_token')` (15 min lifespan)
- Refresh tokens: `localStorage.getItem('refresh_token')` (7 day lifespan)
- CSRF tokens: `localStorage.getItem('csrf_token')`

**Automatic Handling:**
- `apiClient` automatically adds `Authorization: Bearer <token>` to requests
- Token refresh happens automatically on 401 errors
- Failed requests are queued and retried after token refresh
- Users are redirected to login when refresh token expires

**Manual Token Operations:**
```typescript
// Login
const response = await fetch('/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': localStorage.getItem('csrf_token') || '',
  },
  body: JSON.stringify({ email, password }),
});
const { access_token, refresh_token } = await response.json();
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);

// Logout
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('csrf_token');
```

---

## API Integration

### Always Use apiClient

**✅ DO:**
```typescript
import apiClient from '../lib/apiClient';

// GET request
const response = await apiClient.get('/matches');
const matches = response.data; // Already unwrapped

// GET with params
const response = await apiClient.get('/matches', {
  params: { page: 1, page_size: 10 }
});
const matches = response.data;
const pagination = response.pagination; // Available if backend returns it

// POST request
const response = await apiClient.post('/matches', {
  homeTeam: '123',
  awayTeam: '456'
});
const newMatch = response.data;

// PUT request
const response = await apiClient.put(`/matches/${matchId}`, updatedData);

// DELETE request
await apiClient.delete(`/matches/${matchId}`);
```

**❌ DON'T:**
```typescript
// Don't use axios directly
import axios from 'axios'; // ❌ NO
const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/matches`); // ❌ NO

// Don't use fetch()
const response = await fetch('/api/matches'); // ❌ NO

// Don't manually add auth headers
const response = await apiClient.get('/matches', {
  headers: { Authorization: `Bearer ${jwt}` } // ❌ NO - apiClient does this
});
```

### Response Format

Backend returns standardized responses:
```typescript
// Success response
{
  success: true,
  data: { ... }, // or [...]
  message: "Operation successful",
  pagination: { // For paginated endpoints
    page: 1,
    page_size: 10,
    total_items: 100,
    total_pages: 10,
    has_next: true,
    has_prev: false
  }
}
```

**apiClient automatically unwraps `data` field:**
```typescript
const response = await apiClient.get('/matches');
// response.data = the actual match data (not wrapped)
// response.pagination = pagination metadata (if available)
// response.message = backend message
```

### File Uploads

**✅ DO:**
```typescript
const formData = new FormData();
formData.append('image', file);
formData.append('name', 'Player Name');

const response = await apiClient.post('/players', formData);
// apiClient automatically removes Content-Type header for FormData
```

**❌ DON'T:**
```typescript
// Don't manually set Content-Type for FormData
const response = await apiClient.post('/players', formData, {
  headers: { 'Content-Type': 'multipart/form-data' } // ❌ NO
});
```

---

## Error Handling

### Centralized Error Handler

**✅ DO:**
```typescript
import { getErrorMessage, parseApiError, handleApiError } from '../lib/errorHandler';
import apiClient from '../lib/apiClient';

try {
  const response = await apiClient.get('/matches');
  setData(response.data);
} catch (error) {
  // Simple: Get user-friendly message
  const message = getErrorMessage(error);
  setError(message);
  
  // Or: Parse structured error
  const apiError = parseApiError(error);
  console.error('Status:', apiError.statusCode);
  console.error('Message:', apiError.message);
  console.error('Field:', apiError.field);
  
  // Or: Use handler with custom status handlers
  handleApiError(error, {
    404: (err) => setError('Match not found'),
    403: (err) => router.push('/'),
    // Default handler for other errors
  });
}
```

**Error Display Pattern:**
```typescript
import ErrorState from '../components/ui/ErrorState';

const [error, setError] = useState<string | null>(null);

// In JSX
{error && <ErrorState message={error} />}
```

**❌ DON'T:**
```typescript
// Don't use generic error messages
} catch (error) {
  setError('An error occurred'); // ❌ Not helpful
}

// Don't ignore errors
} catch (error) {
  // ❌ Silent failure
}

// Don't expose raw error objects to users
} catch (error) {
  setError(error.toString()); // ❌ May expose sensitive info
}
```

### Loading & Error States

**Complete Pattern:**
```typescript
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';

const [data, setData] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/matches');
      setData(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

// In JSX
if (loading) return <LoadingState />;
if (error) return <ErrorState message={error} />;
if (data.length === 0) return <EmptyState message="No matches found" />;

return (
  <div>
    {/* Render data */}
  </div>
);
```

---

## Data Fetching Strategies

### Public Pages (SEO Important)

Use **SSG with ISR** for public content:

```typescript
export async function getStaticProps() {
  try {
    const response = await apiClient.get('/tournaments');
    
    return {
      props: {
        tournaments: response.data,
      },
      revalidate: 300, // Revalidate every 5 minutes
    };
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return {
      props: {
        tournaments: [],
      },
      revalidate: 60, // Retry sooner on error
    };
  }
}

export async function getStaticPaths() {
  const response = await apiClient.get('/tournaments');
  const paths = response.data.map((t) => ({
    params: { alias: t.alias }
  }));
  
  return {
    paths,
    fallback: 'blocking', // Generate new pages on-demand
  };
}
```

**Revalidation Guidelines:**
- Static content (rules, venues): `revalidate: 3600` (1 hour)
- Tournament pages: `revalidate: 300` (5 minutes)
- Match listings: `revalidate: 180` (3 minutes)
- Live match pages: `revalidate: 60` (1 minute)

### Admin Pages (Auth Required)

Use **client-side fetching** with auth guards:

```typescript
const AdminPage: NextPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/');
  }, [authLoading, user, router]);

  // Data fetching
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/admin/data');
        setData(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (authLoading || loading) return <LoadingState />;
  if (!user) return null;
  if (error) return <ErrorState message={error} />;

  return <div>{/* Admin content */}</div>;
};
```

### Hybrid Approach (Public + Auth Features)

```typescript
// SSG for base content
export async function getStaticProps() {
  const response = await apiClient.get('/matches');
  return {
    props: { matches: response.data },
    revalidate: 180,
  };
}

// Client-side auth for features
const MatchPage: NextPage<Props> = ({ matches }) => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  return (
    <div>
      {/* Public content - SSG */}
      <MatchList matches={matches} />
      
      {/* Auth-gated features - client-side */}
      {hasPermission(Permission.MANAGE_MATCHES) && (
        <button onClick={handleEdit}>Edit Match</button>
      )}
    </div>
  );
};
```

---

## Security Best Practices

### Input Sanitization

**Always sanitize user input:**
```typescript
import { sanitizeHtml, sanitizeInput } from '../lib/sanitize';

// For rich text (from editor)
const cleanHtml = sanitizeHtml(userInput);

// For plain text
const cleanText = sanitizeInput(userInput);
```

### CSRF Protection

**Automatic for apiClient:**
- CSRF token automatically added to POST/PUT/PATCH/DELETE requests
- Token fetched on login and stored in localStorage

**Manual CSRF (rare cases):**
```typescript
const csrfToken = localStorage.getItem('csrf_token');
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

### Rate Limiting

Login endpoint has built-in rate limiting:
- Max 5 attempts per IP per 15 minutes
- Automatic cleanup of old attempts

### Permissions

**Server-Side Validation (API Routes):**
```typescript
import { validateAuth } from '../lib/serverAuth';

export default async function handler(req, res) {
  const { valid, user, error } = await validateAuth(req, [UserRole.ADMIN]);
  
  if (!valid) {
    return res.status(401).json({ error });
  }
  
  // Proceed with authorized action
}
```

**Client-Side Display:**
```typescript
// Only show UI elements user can actually use
{hasPermission(Permission.DELETE_MATCHES) && (
  <DeleteButton />
)}
```

---

## Component Patterns

### Reusable UI Components

**Use existing components:**
- `LoadingState` - Consistent loading indicators
- `ErrorState` - Error messages with retry
- `EmptyState` - Empty data messages
- `Badge` - Status badges
- `Pagination` - Paginated lists
- `MatchCard` - Match display with auth features

**Example:**
```typescript
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';

if (loading) return <LoadingState />;
if (error) return <ErrorState message={error} onRetry={fetchData} />;
if (items.length === 0) return <EmptyState message="No items found" />;
```

### Form Components

**Use Formik + Yup:**
```typescript
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../components/ui/form/InputText';
import ButtonPrimary from '../components/ui/form/ButtonPrimary';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});

<Formik
  initialValues={{ name: '', email: '' }}
  validationSchema={validationSchema}
  onSubmit={async (values, { setSubmitting, setErrors }) => {
    try {
      await apiClient.post('/endpoint', values);
      router.push('/success');
    } catch (error) {
      const apiError = parseApiError(error);
      if (apiError.field) {
        setErrors({ [apiError.field]: apiError.message });
      }
    } finally {
      setSubmitting(false);
    }
  }}
>
  {({ isSubmitting }) => (
    <Form>
      <InputText name="name" label="Name" />
      <InputText name="email" type="email" label="Email" />
      <ButtonPrimary type="submit" label="Submit" isLoading={isSubmitting} />
    </Form>
  )}
</Formik>
```

---

## Code Quality Standards

### TypeScript

**Strict mode enabled:**
- No `any` types (use proper interfaces)
- All functions must have return types
- All props must be typed

**Example:**
```typescript
// ✅ DO
interface PlayerProps {
  player: PlayerValues;
  onUpdate: (player: PlayerValues) => Promise<void>;
}

const PlayerCard: React.FC<PlayerProps> = ({ player, onUpdate }) => {
  // ...
};

// ❌ DON'T
const PlayerCard = ({ player, onUpdate }: any) => { // ❌ NO
  // ...
};
```

### Import Order

```typescript
// 1. React/Next
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

// 2. External libraries
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

// 3. Internal utilities
import apiClient from '../lib/apiClient';
import { getErrorMessage } from '../lib/errorHandler';

// 4. Hooks
import useAuth from '../hooks/useAuth';
import usePermissions from '../hooks/usePermissions';

// 5. Components
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';

// 6. Types
import { MatchValues } from '../types/MatchValues';
```

### File Organization

```
components/
  ui/              # Reusable UI components
  admin/           # Admin-specific components
  matchcenter/     # Feature-specific components
  
hooks/             # Custom React hooks
lib/               # Utility functions & clients
types/             # TypeScript interfaces
pages/             # Next.js pages
  admin/           # Admin routes (client-side auth)
  api/             # API routes
  tournaments/     # Public routes (SSG)
```

### Naming Conventions

- **Components**: PascalCase (`MatchCard`, `LoadingState`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `usePermissions`)
- **Utilities**: camelCase (`apiClient`, `getErrorMessage`)
- **Types**: PascalCase (`MatchValues`, `UserRole`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_RETRIES`)

---

## Quick Reference

### Authentication Checklist
- [ ] Use `useAuth()` for auth state
- [ ] Use `usePermissions()` for permission checks
- [ ] Add auth guard `useEffect` for protected pages
- [ ] Show `LoadingState` while checking auth
- [ ] Don't use `getServerSideProps` for auth
- [ ] Don't pass `jwt` as props

### API Integration Checklist
- [ ] Use `apiClient` (not axios or fetch)
- [ ] Don't manually add auth headers
- [ ] Use `getErrorMessage()` for errors
- [ ] Show loading/error states
- [ ] Handle pagination if applicable

### Security Checklist
- [ ] Sanitize all user input
- [ ] Use server-side permission validation for API routes
- [ ] Check permissions before showing UI elements
- [ ] Use CSRF tokens (automatic with apiClient)
- [ ] Never expose sensitive data in client code

### Data Fetching Checklist
- [ ] Public pages: Use SSG + ISR
- [ ] Admin pages: Client-side with auth guards
- [ ] Set appropriate revalidation times
- [ ] Handle errors gracefully
- [ ] Use `fallback: 'blocking'` for dynamic routes

---

## Additional Resources

- **Token Refresh:** `spec/token-refresh-implementation.md`
- **API Standards:** `spec/api-response-standards.md`
- **Client Auth Migration:** `spec/client-side-auth-migration.md`
- **Testing Strategy:** `spec/testing-strategy.md`
- **Refactoring Roadmap:** `spec/refactoring-roadmap.md`

---

**Document Maintained By:** Development Team  
**Last Review:** 2025-02-02  
**Next Review:** As needed with major architecture changes
