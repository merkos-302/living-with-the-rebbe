ב״ה
# Valu API Authentication Reference

**Source**: Universe Portal Implementation Analysis
**Valu API Version**: @arkeytyp/valu-api ^1.1.0
**Last Updated**: 2025-11-24

This document provides a comprehensive reference for implementing Valu API authentication in the Living with the Rebbe admin tool, based on the proven patterns from the universe-portal project.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Provider Hierarchy](#provider-hierarchy)
3. [Core Implementation Files](#core-implementation-files)
4. [Authentication Flow](#authentication-flow)
5. [Key Components & Hooks](#key-components--hooks)
6. [Iframe Detection & Validation](#iframe-detection--validation)
7. [Security Measures](#security-measures)
8. [Development & Testing](#development--testing)
9. [Code Examples](#code-examples)

---

## Architecture Overview

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Living with Rebbe App                     │
│                  (iframe within Valu Social)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Provider Hierarchy                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ValuApiProvider (Connection & API Methods)           │  │
│  │  ├─ useValuApi() - Low-level API access              │  │
│  │  └─ Singleton pattern for API instance               │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  AuthProvider (User State & Authentication)           │  │
│  │  ├─ useValuAuth() - Authentication hook              │  │
│  │  └─ User data mapping & session management           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Iframe Communication Layer                      │
│  ├─ postMessage to parent (Valu Social)                    │
│  ├─ Origin validation                                       │
│  └─ Health monitoring                                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Iframe-Only Operation**: The app ONLY functions within Valu Social iframe
2. **Admin Authentication**: Only channel admins can access the tool
3. **Singleton API Instance**: One shared ValuApi instance across the app
4. **Progressive Enhancement**: Cache-first loading with API verification
5. **Graceful Degradation**: Fallback UI for non-iframe access

---

## Provider Hierarchy

### Application Root Layout (Next.js 15 App Router)

```typescript
// app/layout.tsx
import { ValuApiProvider } from '@/contexts/ValuApiContext'
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ValuApiProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ValuApiProvider>
      </body>
    </html>
  )
}
```

**Key Points**:
- ValuApiProvider wraps everything (provides API connection)
- AuthProvider sits inside (uses API connection for authentication)
- This mirrors the universe-portal pattern exactly

---

## Core Implementation Files

### File Structure

```
/lib
  ├── valu-api-singleton.ts         # Singleton API instance manager
  └── loggers.ts                    # Logging utilities

/hooks
  ├── useValuApi.ts                 # Low-level API connection hook
  ├── useValuAuth.ts                # Authentication state hook
  └── useIframeMessaging.ts         # Parent-child communication

/contexts
  ├── ValuApiContext.tsx            # API provider & context
  └── AuthContext.tsx               # Auth state management

/components
  └── valu
      ├── ValuFrameGuard.tsx        # Iframe-only enforcement
      └── AccessDenied.tsx          # Non-authenticated UI

/utils
  └── valuAuthCookie.ts             # User cache for fast loading
```

---

## Authentication Flow

### Complete Authentication Sequence

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Page Load                                                 │
│    ├─ Detect if in iframe (window !== window.parent)       │
│    └─ If not in iframe → Show "Access via ChabadUniverse"  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ValuApiProvider Initialization                           │
│    ├─ Initialize singleton API instance                     │
│    ├─ Subscribe to connection events                        │
│    ├─ Start health monitoring                               │
│    └─ Expose API methods via context                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Check Cached User (Fast Loading)                         │
│    ├─ Read valuAuthCookie                                   │
│    ├─ If valid cache exists → Set user immediately         │
│    └─ Continue to API verification in background           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. API Authentication (useValuAuth)                         │
│    ├─ Wait for API connection (isReady = true)             │
│    ├─ Call getApi('users').run('current')                  │
│    ├─ Map Valu user → Portal user format                   │
│    ├─ Store in AuthContext                                  │
│    └─ Cache user data for next session                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Admin Permission Verification                            │
│    ├─ Check user.roles for 'channel_admin'                 │
│    ├─ Check user.permissions for 'admin'                   │
│    ├─ If admin → Grant access                              │
│    └─ If not admin → Show "Admin access required"          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Render Admin Dashboard                                   │
│    └─ User authenticated and authorized                     │
└─────────────────────────────────────────────────────────────┘
```

### Timeline

- **0-100ms**: Iframe detection, cache check
- **100-500ms**: Cached user loaded (if exists)
- **500-2000ms**: API connection established
- **2000-3000ms**: User authentication complete
- **3000ms+**: Admin dashboard rendered

---

## Key Components & Hooks

### 1. useValuApi Hook

**Purpose**: Low-level connection to Valu API
**File**: `/hooks/useValuApi.ts`

**Key Features**:
- Singleton pattern for API instance
- Connection state tracking (isConnected, isReady)
- Health monitoring with adaptive intervals
- Command execution via runConsoleCommand()

**Usage**:
```typescript
const {
  isConnected,     // Is API connected to parent
  isReady,         // Is API ready for commands
  isInIframe,      // Running in iframe
  getApi,          // Get specific API (users, network, etc)
  runConsoleCommand, // Run console commands
  connectionHealth  // Health status
} = useValuApi()
```

**Implementation Pattern** (from universe-portal):
```typescript
import { valuApiSingleton } from '@/lib/valu-api-singleton'

export function useValuApi() {
  const [isConnected, setIsConnected] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isInIframe, setIsInIframe] = useState(false)
  const valuApiRef = useRef<any>(null)

  useEffect(() => {
    // Check iframe status
    setIsInIframe(window !== window.parent)

    if (window === window.parent) return

    // Subscribe to singleton
    const unsubscribe = valuApiSingleton.subscribe((api) => {
      if (api) {
        valuApiRef.current = api
        setIsConnected(true)
        setIsReady(true)
      }
    })

    // Start health monitoring
    valuApiSingleton.startHealthMonitoring()

    return () => {
      unsubscribe()
      valuApiSingleton.stopHealthMonitoring()
    }
  }, [])

  const getApi = useCallback(async (apiName: string) => {
    if (!valuApiRef.current || !isReady) {
      throw new Error('API not ready')
    }
    return await valuApiRef.current.getApi(apiName)
  }, [isReady])

  const runConsoleCommand = useCallback(async (command: string) => {
    if (!valuApiRef.current || !isReady) return null
    return await valuApiRef.current.runConsoleCommand(command)
  }, [isReady])

  return { isConnected, isReady, isInIframe, getApi, runConsoleCommand }
}
```

---

### 2. useValuAuth Hook

**Purpose**: User authentication and state management
**File**: `/hooks/useValuAuth.ts`

**Key Features**:
- Multi-strategy user fetching (API methods + console commands)
- User data mapping (Valu format → Portal format)
- Cookie caching for fast subsequent loads
- Automatic retry on failure
- Icon fetching with caching

**Usage**:
```typescript
const {
  isLoading,        // Loading state
  isAuthenticated,  // Is user authenticated
  user,             // User data object
  error,            // Error message if any
  isValuConnected,  // Is connected to Valu
  login,            // Manual login trigger
  logout,           // Clear auth state
  refreshUser,      // Re-fetch user data
  getUserIcon       // Get user avatar
} = useValuAuth()
```

**Authentication Methods** (in order of preference):
1. `getApi('users').run('current')` - Primary method
2. `getApi('auth').run('current')` - Auth API fallback
3. `runConsoleCommand('users current')` - Console command
4. 6 other console command variations
5. Cached user data (for fast loading)

**User Mapping Example**:
```typescript
// Valu user format (from API)
interface ValuUser {
  id: string
  name: string
  email?: string
  avatar?: string
  roles?: string[]
  permissions?: string[]
  profile?: {
    displayName?: string
    profileImage?: string
  }
}

// Portal user format (mapped)
interface PortalUser {
  id: string              // 'valu_' + valuUser.id
  valuUserId: string      // Original Valu ID
  email?: string
  name: string
  displayName: string
  profileImage?: string
  roles: string[]         // Mapped roles
  permissions: string[]
  isValuAuthenticated: true
  metadata: {
    authMethod: 'valu'
    originalValuData: ValuUser
  }
}
```

---

### 3. ValuApiContext Provider

**Purpose**: Expose API connection to all components
**File**: `/contexts/ValuApiContext.tsx`

**Provides**:
```typescript
interface ValuApiContextValue {
  // Connection state
  isInIframe: boolean
  isConnected: boolean
  isReady: boolean
  error: string | null

  // API access
  getApiPointer: (apiName: string) => Promise<any>
  runConsoleCommand: (command: string) => Promise<any>

  // Quick actions (for convenience)
  getCurrentUser: () => Promise<any>
  getUsersApi: () => Promise<any>

  // Health monitoring
  connectionHealth: 'healthy' | 'degraded' | 'disconnected'
  lastSuccessfulOperation: number | null

  // Raw API (if needed)
  valuApi: any
}
```

**Implementation**:
```typescript
export function ValuApiProvider({ children }: { children: ReactNode }) {
  const valuApiData = useValuApi()

  const contextValue = {
    ...valuApiData,
    getCurrentUser: async () => {
      const usersApi = await valuApiData.getApi('users')
      return await usersApi.run('current')
    }
  }

  return (
    <ValuApiContext.Provider value={contextValue}>
      {children}
    </ValuApiContext.Provider>
  )
}
```

---

### 4. ValuFrameGuard Component

**Purpose**: Enforce iframe-only access
**File**: `/components/valu/ValuFrameGuard.tsx`

**Behavior**:
- Checks `window !== window.parent`
- Shows informative message if NOT in iframe
- Renders children if IN iframe
- Prevents "flash" during check

**Usage**:
```typescript
// Wrap any page that requires Valu iframe
export default function AdminDashboard() {
  return (
    <ValuFrameGuard>
      {/* Your admin content here */}
    </ValuFrameGuard>
  )
}
```

**Implementation**:
```typescript
export function ValuFrameGuard({ children }: { children: ReactNode }) {
  const [isInFrame, setIsInFrame] = useState<boolean | null>(null)

  useEffect(() => {
    setIsInFrame(window !== window.parent)
  }, [])

  // Prevent flash
  if (isInFrame === null) return null

  if (!isInFrame) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1>Access via ChabadUniverse</h1>
          <p>This tool must be accessed through ChabadUniverse platform</p>
          <a href="https://chabaduniverse.com">Go to ChabadUniverse</a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

---

## Iframe Detection & Validation

### Multiple Detection Layers

**1. Window Comparison**
```typescript
const isInIframe = window !== window.parent
```

**2. Origin Validation**
```typescript
// Check message origin
if (!event.origin.includes('chabaduniverse.com')) {
  console.warn('Invalid origin:', event.origin)
  return
}
```

**3. Parent PostMessage Availability**
```typescript
if (!window.parent || typeof window.parent.postMessage !== 'function') {
  console.error('Parent window not available')
  return
}
```

**4. API Connection Verification**
```typescript
// Wait for API_READY event from parent
const waitForApiReady = () => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('API connection timeout'))
    }, 10000)

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'API_READY') {
        clearTimeout(timeout)
        resolve(event.data.api)
      }
    }

    window.addEventListener('message', handleMessage)
  })
}
```

---

## Security Measures

### 1. Origin Validation

**Allowed Origins**:
- `https://chabaduniverse.com`
- `https://valu.social`
- `https://iframe_network_board_chabad.onl.lat`

**Implementation**:
```typescript
const ALLOWED_ORIGINS = [
  'https://chabaduniverse.com',
  'https://valu.social',
  'https://iframe_network_board_chabad.onl.lat'
]

window.addEventListener('message', (event) => {
  if (!ALLOWED_ORIGINS.some(origin => event.origin.includes(origin))) {
    console.warn('Rejected message from:', event.origin)
    return
  }
  // Process message
})
```

### 2. Admin Permission Verification

```typescript
const verifyAdminAccess = (user: PortalUser): boolean => {
  // Check role-based access
  if (user.roles?.includes('channel_admin')) return true
  if (user.roles?.includes('admin')) return true

  // Check permission-based access
  if (user.permissions?.includes('admin')) return true
  if (user.permissions?.includes('channel_admin')) return true

  return false
}
```

### 3. Token-Free Authentication

**Key Insight**: Valu handles authentication via iframe context. No API keys or tokens needed in the frontend.

```typescript
// ❌ DON'T DO THIS (not needed with Valu)
const headers = {
  'Authorization': 'Bearer xxx' // Not needed!
}

// ✅ DO THIS (Valu handles auth)
const currentUser = await usersApi.run('current')
// User is already authenticated by parent frame
```

### 4. HTTPS-Only Communication

All postMessage communication is done over HTTPS. The parent (ChabadUniverse) enforces HTTPS.

---

## Development & Testing

### Local Development Without Valu

**Option 1: Valu Parent Simulator** (Recommended)

Universe-portal includes a development tool:
```bash
# In universe-portal project
npm run dev:simulator  # Starts simulator on port 3001
npm run dev            # Starts app on port 3000
```

The simulator creates a parent frame that mimics Valu Social behavior.

**Option 2: Mock Authentication**

```typescript
// For development/testing
const MOCK_USER: ValuUser = {
  id: 'mock_admin_1',
  name: 'Test Admin',
  email: 'admin@test.com',
  roles: ['channel_admin'],
  permissions: ['admin'],
  profile: {
    displayName: 'Test Admin'
  }
}

// In development mode
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
  return MOCK_USER
}
```

### Testing Strategy

**1. Unit Tests** - Mock Valu API
```typescript
jest.mock('@arkeytyp/valu-api', () => ({
  ValuApi: jest.fn().mockImplementation(() => ({
    getApi: jest.fn().mockResolvedValue({
      run: jest.fn().mockResolvedValue(MOCK_USER)
    })
  }))
}))
```

**2. Integration Tests** - Use simulator
```typescript
describe('Authentication Flow', () => {
  it('authenticates admin user in iframe', async () => {
    // Start simulator
    const simulator = await startValuSimulator()

    // Load app in iframe
    const { getByText } = render(<App />)

    // Verify admin access granted
    await waitFor(() => {
      expect(getByText('Admin Dashboard')).toBeInTheDocument()
    })
  })
})
```

**3. E2E Tests** - Test in actual ChabadUniverse iframe
```typescript
describe('Production Flow', () => {
  it('works in ChabadUniverse iframe', async () => {
    // Navigate to ChabadUniverse
    await page.goto('https://chabaduniverse.com')

    // Open Living with Rebbe tool
    await page.click('[data-testid="living-with-rebbe"]')

    // Verify admin dashboard loads
    const iframe = await page.frameLocator('iframe[name="living-with-rebbe"]')
    await expect(iframe.getByText('Admin Dashboard')).toBeVisible()
  })
})
```

---

## Code Examples

### Complete Authentication Hook (Simplified)

```typescript
// hooks/useValuAuth.ts
import { useState, useEffect, useCallback } from 'react'
import { useValuApi } from './useValuApi'
import { getValuUser, setValuUser, clearValuUser } from '@/utils/valuAuthCookie'

interface ValuUser {
  id: string
  name: string
  email?: string
  roles?: string[]
  permissions?: string[]
}

interface PortalUser {
  id: string
  valuUserId: string
  name: string
  displayName: string
  roles: string[]
  permissions: string[]
  isValuAuthenticated: boolean
}

export function useValuAuth() {
  const { getApi, runConsoleCommand, isReady, isInIframe } = useValuApi()
  const [user, setUser] = useState<PortalUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Try to get user from Valu API
  const fetchUser = useCallback(async (): Promise<ValuUser | null> => {
    if (!isReady) return null

    try {
      // Method 1: Users API
      const usersApi = await getApi('users')
      const result = await usersApi.run('current')
      if (result?.id) return result

      // Method 2: Console command
      const cmdResult = await runConsoleCommand('users current')
      if (cmdResult?.id) return cmdResult

      return null
    } catch (err) {
      console.error('Failed to fetch user:', err)
      return null
    }
  }, [getApi, runConsoleCommand, isReady])

  // Map Valu user to portal format
  const mapUser = (valuUser: ValuUser): PortalUser => ({
    id: `valu_${valuUser.id}`,
    valuUserId: valuUser.id,
    name: valuUser.name,
    displayName: valuUser.name,
    roles: valuUser.roles || ['user'],
    permissions: valuUser.permissions || [],
    isValuAuthenticated: true
  })

  // Initialize auth
  useEffect(() => {
    if (!isInIframe) {
      setIsLoading(false)
      return
    }

    const init = async () => {
      setIsLoading(true)

      // Check cache first (fast loading)
      const cachedUser = getValuUser()
      if (cachedUser) {
        setUser(mapUser(cachedUser))
      }

      // Verify with API
      if (isReady) {
        const valuUser = await fetchUser()
        if (valuUser) {
          const portalUser = mapUser(valuUser)
          setUser(portalUser)
          setValuUser(valuUser) // Cache for next time
        } else {
          setError('Authentication failed')
        }
      }

      setIsLoading(false)
    }

    init()
  }, [isInIframe, isReady, fetchUser])

  const logout = useCallback(() => {
    setUser(null)
    clearValuUser()
  }, [])

  return {
    isLoading,
    isAuthenticated: !!user,
    user,
    error,
    logout
  }
}
```

### Complete Admin Dashboard Page

```typescript
// app/page.tsx (Next.js 15 App Router)
'use client'

import { useValuAuth } from '@/hooks/useValuAuth'
import { ValuFrameGuard } from '@/components/valu/ValuFrameGuard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { AccessDenied } from '@/components/AccessDenied'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default function HomePage() {
  const { isLoading, isAuthenticated, user, error } = useValuAuth()

  if (isLoading) {
    return (
      <LoadingSpinner message="Authenticating with ChabadUniverse..." />
    )
  }

  if (error) {
    return (
      <AccessDenied message={error} />
    )
  }

  if (!isAuthenticated) {
    return (
      <AccessDenied message="Authentication required" />
    )
  }

  // Verify admin permissions
  const isAdmin = user.roles?.includes('channel_admin') ||
                  user.permissions?.includes('admin')

  if (!isAdmin) {
    return (
      <AccessDenied message="Admin access required to use this tool" />
    )
  }

  return (
    <ValuFrameGuard>
      <AdminDashboard user={user} />
    </ValuFrameGuard>
  )
}
```

### Iframe Height Auto-Adjustment

```typescript
// hooks/useAutoHeight.ts
import { useEffect } from 'react'

export function useAutoHeight() {
  useEffect(() => {
    const isInIframe = window !== window.parent

    if (!isInIframe) return

    const updateHeight = () => {
      const height = document.documentElement.scrollHeight

      window.parent.postMessage(
        {
          type: 'resize',
          height,
          timestamp: Date.now()
        },
        'https://chabaduniverse.com'
      )
    }

    // Initial height
    updateHeight()

    // Watch for DOM changes
    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(document.body)

    const mutationObserver = new MutationObserver(updateHeight)
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [])
}

// Usage in layout
export default function RootLayout({ children }) {
  useAutoHeight()

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
NEXT_PUBLIC_VALU_SOCIAL_URL=https://valu.social

# Development only
NEXT_PUBLIC_MOCK_AUTH=false  # Set to 'true' for local dev without iframe
```

---

## Troubleshooting

### "API not ready" errors

**Cause**: Trying to call API before connection established
**Solution**: Always check `isReady` before calling API methods

```typescript
const { isReady, getApi } = useValuApi()

if (!isReady) {
  return <LoadingSpinner />
}
```

### "Parent window not available" errors

**Cause**: App not running in iframe
**Solution**: Use ValuFrameGuard component

```typescript
<ValuFrameGuard>
  {/* Your content */}
</ValuFrameGuard>
```

### Authentication never completes

**Cause**: Multiple possible reasons
**Solutions**:
1. Check console for errors
2. Verify iframe is from correct origin
3. Check health monitoring status
4. Try manual refresh:

```typescript
const { refreshUser } = useValuAuth()

// Manual retry button
<button onClick={refreshUser}>
  Retry Authentication
</button>
```

### User data not cached

**Cause**: Cookie utilities not working
**Solution**: Check valuAuthCookie implementation

```typescript
import { getValuUser, setValuUser } from '@/utils/valuAuthCookie'

// Test cache
const cached = getValuUser()
console.log('Cached user:', cached)
```

---

## Key Takeaways

1. **Iframe-Only**: The app does NOT work standalone
2. **Singleton Pattern**: One ValuApi instance shared across app
3. **Provider Hierarchy**: ValuApiProvider → AuthProvider → App
4. **Cache-First**: Load cached user immediately, verify with API
5. **Admin-Only**: Check roles/permissions before granting access
6. **Origin Validation**: Always validate postMessage origins
7. **Health Monitoring**: Track connection health continuously
8. **Graceful Errors**: Show user-friendly messages for all failures

---

## Related Files in Universe Portal

For reference, here are the exact file paths in universe-portal:

- `/pages/_app.tsx` - Provider hierarchy setup
- `/contexts/ValuApiContext.tsx` - API provider implementation
- `/hooks/useValuApi.ts` - Low-level API hook
- `/hooks/useValuAuth.ts` - Authentication hook (900+ lines)
- `/lib/valu-api-singleton.ts` - Singleton instance manager
- `/components/valu/ValuFrameGuard.tsx` - Iframe guard component
- `/components/AuthenticationGuard.tsx` - Dual auth guard
- `/utils/valuAuthCookie.ts` - User caching utilities
- `/.claude/agents/valu-api-specialist.md` - Valu API expert guide

---

**End of Reference Document**

For questions or issues, refer to the universe-portal implementation or the Valu API documentation at:
https://github.com/Roomful/valu-api
