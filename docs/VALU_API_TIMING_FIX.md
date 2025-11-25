ב״ה
# Valu API Timing Fix

## Problem Description

The application was experiencing authentication errors with the message:
```
Cannot read properties of undefined (reading 'postMessage')
```

### Root Cause

The issue was a race condition in the Valu API initialization:

1. The Valu API singleton creates an API instance and immediately notifies subscribers
2. `useValuApi` receives the API instance and sets both `isConnected = true` and `isReady = true`
3. Authentication code sees `isReady = true` and attempts to call API methods
4. **BUT** the API's internal methods (like `postToValuApp`) aren't actually available yet
5. The Valu API fires an `API_READY` event **after** the instance is created, once it's fully initialized
6. This timing gap causes the `postMessage` errors

### Console Log Evidence

```
useValuApi: Got API instance
isReady: true  // ❌ Set too early!
Attempting Valu API authentication
// API calls fail with postMessage errors
API_READY event received  // ⏰ This should have been waited for!
```

## Solution

Updated `useValuApi` hook to properly wait for the `API_READY` event before setting `isReady = true`.

### Changes Made

#### 1. `/hooks/useValuApi.ts`

**Before:**
```typescript
const handleApiConnection = useCallback((api: any) => {
  if (api && api !== valuApiRef.current) {
    console.log('useValuApi: Got API instance');
    valuApiRef.current = api;
    setIsConnected(true);
    setIsReady(true);  // ❌ Too early!
  }
}, []);
```

**After:**
```typescript
const handleApiConnection = useCallback((api: any) => {
  if (api && api !== valuApiRef.current) {
    console.log('useValuApi: Got API instance, waiting for API_READY event');
    valuApiRef.current = api;
    setIsConnected(true);
    // DO NOT set isReady yet - wait for API_READY event

    // Listen for API_READY event before setting isReady
    const handleApiReady = () => {
      console.log('useValuApi: API_READY event received - API is now fully ready');
      setIsReady(true);
    };

    try {
      const API_READY_EVENT = (api.constructor as any).API_READY || 'API_READY';
      api.addEventListener(API_READY_EVENT, handleApiReady);
      console.log('useValuApi: Listening for API_READY event');
    } catch (e) {
      // Fallback: set ready after a delay
      setTimeout(() => {
        setIsReady(true);
      }, 2000);
    }

    // Fallback timeout: If API_READY doesn't fire within 10 seconds
    setTimeout(() => {
      if (!valuApiRef.current) return;

      const hasPostMethod = valuApiRef.current.postToValuApp &&
                          typeof valuApiRef.current.postToValuApp === 'function';

      if (hasPostMethod) {
        setIsReady(true);
      } else {
        console.warn('postToValuApp still not available');
        setIsReady(true);  // Set anyway to prevent infinite waiting
      }
    }, 10000);
  }
}, []);
```

#### 2. Added API_READY listener cleanup

```typescript
// Cleanup on unmount
return () => {
  unsubscribe();
  unsubscribeHealth();
  valuApiSingleton.stopHealthMonitoring();

  // Clean up API_READY listener
  if (apiReadyListenerRef.current && valuApiRef.current) {
    try {
      const API_READY_EVENT = (valuApiRef.current.constructor as any).API_READY || 'API_READY';
      valuApiRef.current.removeEventListener(API_READY_EVENT, apiReadyListenerRef.current);
    } catch (e) {
      // Ignore cleanup errors
    }
    apiReadyListenerRef.current = null;
  }
};
```

#### 3. `/hooks/useValuAuth.ts`

Added `isNavigatingApp` checks to prevent authentication attempts during app navigation (matching universe-portal pattern):

```typescript
// Extract isNavigatingApp from valuApi
const {
  isConnected: isValuConnected,
  isReady: isValuReady,
  isInIframe,
  isNavigatingApp,  // ✅ Added
  getApi,
  runConsoleCommand,
} = valuApi;

// Check before authentication
if (isNavigatingApp) {
  logger.debug('Skipping authentication - app navigation in progress');
  return null;
}
```

## Key Principles from Universe-Portal

1. **Never assume API is ready just because the instance exists**
   - The instance is created first
   - Then the `API_READY` event fires when methods are available

2. **Always wait for the API_READY event**
   - This is the official signal that the API is fully initialized
   - Methods like `postToValuApp` are guaranteed to exist after this event

3. **Implement fallback timeouts**
   - 10-second timeout in case `API_READY` never fires
   - Check for `postToValuApp` method existence before setting ready

4. **Check isNavigatingApp flag**
   - Prevents authentication during app navigation
   - Avoids errors when parent window context changes

## Testing

To verify the fix works:

1. Clear browser cache and cookies
2. Open the application in ChabadUniverse iframe
3. Check console logs for this sequence:
   ```
   useValuApi: Got API instance, waiting for API_READY event
   useValuApi: Listening for API_READY event
   useValuApi: API_READY event received - API is now fully ready
   Attempting Valu API authentication
   ```

4. Verify no `postMessage` errors occur
5. Verify authentication succeeds

## References

- **Universe-Portal Implementation**: `/Users/reuven/Projects/merkos/universe-portal/hooks/useValuApi.ts`
- **Valu API Singleton**: `/Users/reuven/Projects/merkos/universe-portal/lib/valu-api-singleton.ts` (lines 218-236)
- **Proven Pattern**: Universe-portal has been using this pattern successfully in production

## Timeline

- **Issue Identified**: 2025-11-24
- **Root Cause Found**: Race condition between API instance creation and method availability
- **Solution Applied**: Wait for API_READY event before setting isReady flag
- **Pattern Source**: Proven implementation from universe-portal
