/**
 * useValuAuth Hook
 *
 * Comprehensive Valu API authentication hook for Living with the Rebbe admin tool.
 * Handles user authentication through Valu Social with admin verification.
 *
 * Authentication Flow:
 * 1. Check if running in Valu Social iframe
 * 2. Wait for Valu API connection to be established
 * 3. Call getCurrentUser() from Valu API when connected
 * 4. Map Valu user data to portal format
 * 5. Verify admin permissions
 * 6. Cache user data for fast loading
 * 7. Handle authentication state changes
 *
 * Features:
 * - Automatic user authentication when Valu API connects
 * - Cookie-based caching for fast subsequent loads
 * - Multiple fallback methods for fetching user data
 * - Retry logic with exponential backoff
 * - Admin permission verification
 * - Error handling with graceful degradation
 * - Performance optimized with proper memoization
 *
 * Based on proven universe-portal implementation.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useValuApi } from './useValuApi';
import {
  getValuUser,
  setValuUser,
  clearValuUser,
  hasValuUser,
  refreshValuCache,
} from '@/utils/valuAuthCookie';
import type { ValuUserCache } from '@/utils/valuAuthCookie';
import { logger } from '@/utils/logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Valu user data structure (from Valu API)
 */
export interface ValuUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  userRoles?: Array<{
    // ChabadUniverse format
    id: string;
    roleName: string;
    targetType?: string;
    permissions?: string[];
    targetId?: string;
  }>;
  permissions?: string[] | Record<string, boolean>; // Can be array or object format
  profile?: {
    displayName?: string;
    profileImage?: string;
    bio?: string;
  };
  network?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Portal user data structure (mapped from Valu user)
 */
export interface PortalUser {
  id: string;
  valuUserId: string;
  email?: string;
  name: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  roles: string[];
  permissions: string[];
  isValuAuthenticated: boolean;
  network?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
  createdAt?: string;
  lastLoginAt?: string;
}

/**
 * Authentication state
 */
interface ValuAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: PortalUser | null;
  error: string | null;
  isValuConnected: boolean;
  authMethod: 'valu' | null;
}

/**
 * Hook return interface
 */
export interface UseValuAuthReturn extends ValuAuthState {
  login: () => Promise<PortalUser | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<PortalUser | null>;
  clearError: () => void;
}

// ============================================================================
// User Data Mapping
// ============================================================================

/**
 * Map Valu roles to portal roles (handles both string array and userRoles object array)
 */
const mapValuRolesToPortalRoles = (
  valuRoles?: string[],
  userRoles?: Array<{ id: string; roleName: string }>
): string[] => {
  const roleMapping: Record<string, string> = {
    admin: 'admin',
    administrator: 'admin',
    super_admin: 'admin',
    networkadmin: 'admin', // ChabadUniverse format
    network_admin: 'admin',
    channel_admin: 'channel_admin',
    moderator: 'moderator',
    mod: 'moderator',
    community_manager: 'moderator',
    member: 'user',
    user: 'user',
    basic: 'user',
    premium: 'user',
    verified: 'user',
  };

  let rolesToMap: string[] = [];

  // Handle string array format (standard Valu)
  if (valuRoles && Array.isArray(valuRoles)) {
    rolesToMap = valuRoles;
  }

  // Handle userRoles object array format (ChabadUniverse)
  if (userRoles && Array.isArray(userRoles)) {
    const extractedRoles = userRoles.map((role) => role.id || role.roleName);
    rolesToMap = [...rolesToMap, ...extractedRoles];
  }

  const mappedRoles = rolesToMap
    .map((role) => roleMapping[role.toLowerCase()] || 'user')
    .filter((role, index, array) => array.indexOf(role) === index); // Remove duplicates

  // Ensure at least 'user' role
  if (mappedRoles.length === 0) {
    mappedRoles.push('user');
  }

  return mappedRoles;
};

/**
 * Map Valu user data to portal user format
 */
const mapValuUserToPortalUser = (valuUser: ValuUser): PortalUser => {
  const displayName =
    valuUser.profile?.displayName ||
    valuUser.name ||
    `${valuUser.firstName || ''} ${valuUser.lastName || ''}`.trim() ||
    'Valu User';

  // Convert permissions object to array if needed
  let permissions: string[] = [];
  if (valuUser.permissions) {
    if (Array.isArray(valuUser.permissions)) {
      permissions = valuUser.permissions;
    } else if (typeof valuUser.permissions === 'object') {
      // Convert object format {admin: true, ...} to array ['admin', ...]
      permissions = Object.entries(valuUser.permissions)
        .filter(([_, value]) => value === true)
        .map(([key, _]) => key);
    }
  }

  const portalUser: PortalUser = {
    id: `valu_${valuUser.id}`,
    valuUserId: valuUser.id,
    email: valuUser.email,
    name: valuUser.name || displayName,
    displayName,
    firstName: valuUser.firstName,
    lastName: valuUser.lastName,
    profileImage: valuUser.profile?.profileImage || valuUser.avatar,
    roles: mapValuRolesToPortalRoles(valuUser.roles, valuUser.userRoles),
    permissions,
    isValuAuthenticated: true,
    network: valuUser.network,
    metadata: {
      ...valuUser.metadata,
      authMethod: 'valu',
      originalValuData: valuUser,
    },
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  return portalUser;
};

/**
 * Map PortalUser to ValuUserCache format for cookie storage
 */
const mapPortalUserToCache = (user: PortalUser): ValuUserCache => {
  return {
    id: user.id,
    name: user.name,
    valuUserId: user.valuUserId,
    cachedAt: new Date().toISOString(),
    displayName: user.displayName,
    email: user.email,
    profileImage: user.profileImage,
    roles: user.roles,
    network: user.network,
  };
};

/**
 * Map ValuUserCache to PortalUser format
 */
const mapCacheToPortalUser = (cachedUser: ValuUserCache): PortalUser => {
  return {
    id: cachedUser.id,
    valuUserId: cachedUser.valuUserId,
    email: cachedUser.email,
    name: cachedUser.name,
    displayName: cachedUser.displayName || cachedUser.name,
    profileImage: cachedUser.profileImage,
    roles: cachedUser.roles || ['user'],
    permissions: [], // Not cached, will be refreshed on API call
    isValuAuthenticated: true,
    network: cachedUser.network,
    metadata: {
      authMethod: 'valu',
      fromCache: true,
      cachedAt: cachedUser.cachedAt,
    },
    createdAt: cachedUser.cachedAt,
    lastLoginAt: cachedUser.cachedAt,
  };
};

/**
 * Check if user has admin access for this tool
 */
const checkAdminAccess = (user: PortalUser): boolean => {
  // Check roles
  if (user.roles.includes('channel_admin')) return true;
  if (user.roles.includes('admin')) return true;

  // Check permissions
  if (user.permissions.includes('admin')) return true;
  if (user.permissions.includes('channel_admin')) return true;

  return false;
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * useValuAuth Hook
 *
 * Provides comprehensive Valu API authentication with admin verification
 */
export function useValuAuth(): UseValuAuthReturn {
  // Get Valu API connection state and methods
  const valuApi = useValuApi();
  const {
    isConnected: isValuConnected,
    isReady: isValuReady,
    isInIframe,
    isNavigatingApp,
    getApi,
    runConsoleCommand,
  } = valuApi;

  // Local state
  const [user, setUser] = useState<PortalUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isInIframe);
  const [error, setError] = useState<string | null>(null);

  // Track authentication state and retry behavior
  const authAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheInitializedRef = useRef(false);

  /**
   * Get current user from Valu API using multiple fallback approaches
   * Based on universe-portal's comprehensive method
   */
  const getValuCurrentUser = useCallback(async (): Promise<ValuUser | null> => {
    if (!getApi || typeof getApi !== 'function') {
      logger.debug('Valu API getApi not available');
      return null;
    }

    try {
      // Method 1: Try the recommended getApi approach first
      logger.debug('Attempting getApi("users") approach');
      try {
        const usersApi = await getApi('users');
        if (usersApi && typeof usersApi.run === 'function') {
          logger.debug('Calling usersApi.run("current")');
          const result = await usersApi.run('current');
          logger.debug('usersApi.run("current") result:', result);

          if (result && (result.id || result.userId)) {
            return result as ValuUser;
          }
        }
      } catch (apiError: any) {
        logger.warn('getApi approach failed, trying console command fallbacks', apiError);
      }

      // Method 1.5: Try auth-related APIs if users API fails
      try {
        const authApi = await getApi('auth');
        if (authApi && typeof authApi.run === 'function') {
          logger.debug('Calling authApi.run("status") or authApi.run("current")');

          // Try different auth API methods
          const authMethods = ['current', 'status', 'user', 'me'];
          for (const method of authMethods) {
            try {
              const result = await authApi.run(method);
              logger.debug(`authApi.run("${method}") result:`, result);

              if (result && (result.id || result.userId || result.user)) {
                // Handle nested user object
                const userData = result.user || result;
                if (userData && (userData.id || userData.userId)) {
                  return userData as ValuUser;
                }
              }
            } catch (methodError: any) {
              logger.debug(`authApi.run("${method}") failed:`, methodError.message);
            }
          }
        }
      } catch (authApiError: any) {
        logger.debug('Auth API approach failed:', authApiError.message);
      }

      // Method 2: Try multiple console command approaches
      if (runConsoleCommand && typeof runConsoleCommand === 'function') {
        const commands = [
          'users current',
          'user current',
          'user me',
          'auth user',
          'auth status',
          'auth current',
          'me',
          'whoami',
        ];

        for (const command of commands) {
          try {
            logger.debug(`Trying console command: "${command}"`);
            const result = await runConsoleCommand(command);
            logger.debug(`Command "${command}" result:`, result);

            if (result === null || result === undefined) {
              logger.debug(`Command "${command}" returned null/undefined, trying next`);
              continue;
            }

            // Handle case where result is a string (JSON) that needs parsing
            let parsedResult = result;
            if (typeof result === 'string') {
              try {
                parsedResult = JSON.parse(result);
                logger.debug(`Parsed JSON result from "${command}":`, parsedResult);
              } catch {
                logger.debug(`Command "${command}" result not JSON, using as-is:`, { result });
                parsedResult = result as unknown as ValuUser;
              }
            }

            // Check if this looks like valid user data
            if (
              parsedResult &&
              (parsedResult.id || parsedResult.userId || parsedResult.name || parsedResult.email)
            ) {
              logger.info(`Successfully got user data with command: "${command}"`);
              return parsedResult as ValuUser;
            }

            logger.debug(`Command "${command}" didn't return valid user data, trying next`);
          } catch (commandError: any) {
            logger.debug(`Command "${command}" failed:`, commandError.message);
            // Continue to next command
          }
        }

        logger.warn('All console commands failed to return valid user data');
      }

      logger.warn('No available methods to get current user');
      return null;
    } catch (error: any) {
      logger.error('Failed to get current user from Valu API', error);
      return null;
    }
  }, [getApi, runConsoleCommand]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initialize authentication from cache on mount
   */
  useEffect(() => {
    if (cacheInitializedRef.current) return;
    cacheInitializedRef.current = true;

    // Only initialize cache if not already authenticated and we're in an iframe
    if (user || !isInIframe) {
      logger.debug('Skipping cache initialization', {
        hasUser: !!user,
        isInIframe,
      });
      return;
    }

    // Check for cached user data
    if (hasValuUser()) {
      const cachedUser = getValuUser();
      if (cachedUser) {
        logger.info('Found cached Valu user, initializing auth state', {
          userId: cachedUser.id,
          name: cachedUser.name,
          cachedAt: cachedUser.cachedAt,
        });

        // Convert cached data to portal user format
        const portalUser = mapCacheToPortalUser(cachedUser);
        setUser(portalUser);

        // Set loading to false since we have cached data
        setIsLoading(false);
      }
    }
  }, [user, isInIframe]);

  /**
   * Authenticate user with Valu API
   * Simplified approach following the working manual refresh pattern
   */
  const authenticateWithValu = useCallback(async (): Promise<PortalUser | null> => {
    try {
      logger.info('Attempting Valu API authentication', {
        isConnected: isValuConnected,
        isReady: isValuReady,
        isInIframe,
        isNavigatingApp,
      });

      // Don't try to authenticate if we're navigating to another app
      if (isNavigatingApp) {
        logger.debug('Skipping authentication - app navigation in progress');
        return null;
      }

      setIsLoading(true);
      setError(null);

      // Check if Valu API is ready
      if (!isValuConnected || !isValuReady) {
        throw new Error('Valu API not connected or ready');
      }

      // Small delay to ensure API is fully ready (Valu API best practice)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get current user from Valu API
      const valuUser = await getValuCurrentUser();

      if (!valuUser) {
        throw new Error('No user data received from Valu API');
      }

      // Map Valu user to portal format
      const portalUser = mapValuUserToPortalUser(valuUser);

      // Verify admin access
      const isAdmin = checkAdminAccess(portalUser);
      if (!isAdmin) {
        throw new Error('Admin access required for this tool');
      }

      // Set user state
      setUser(portalUser);

      // Cache user data for future sessions
      try {
        const cacheData = mapPortalUserToCache(portalUser);
        setValuUser(cacheData);
        logger.debug('User data cached successfully', {
          userId: portalUser.id,
          valuUserId: portalUser.valuUserId,
        });
      } catch (cacheError) {
        logger.warn(
          'Failed to cache user data',
          cacheError instanceof Error
            ? { error: cacheError.message }
            : { error: String(cacheError) }
        );
        // Don't fail authentication if caching fails
      }

      // Update local loading state
      setIsLoading(false);
      setError(null);

      logger.info('Valu authentication successful', {
        userId: portalUser.id,
        valuUserId: portalUser.valuUserId,
        displayName: portalUser.displayName,
        roles: portalUser.roles,
        isAdmin,
      });

      return portalUser;
    } catch (error: any) {
      logger.error('Valu authentication failed', error);
      setIsLoading(false);
      setError(error.message || 'Valu authentication failed');
      return null;
    }
  }, [isValuConnected, isValuReady, isInIframe, isNavigatingApp, getValuCurrentUser]);

  /**
   * Clear authentication retry timeout
   */
  const clearAuthRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
      logger.debug('Cleared authentication retry timeout');
    }
  }, []);

  /**
   * Login function - attempts Valu authentication
   */
  const login = useCallback(async (): Promise<PortalUser | null> => {
    return await authenticateWithValu();
  }, [authenticateWithValu]);

  /**
   * Refresh user data from Valu API
   */
  const refreshUser = useCallback(async (): Promise<PortalUser | null> => {
    logger.info('Refreshing user data from Valu API');

    // Stop any active retry timeout during manual refresh
    clearAuthRetryTimeout();

    // Reset authentication attempt flag to allow refresh
    authAttemptedRef.current = false;

    const result = await login();

    // If successful, also refresh the cache timestamp to extend validity
    if (result) {
      try {
        refreshValuCache();
        logger.debug('Cache timestamp refreshed after successful API refresh');
      } catch (cacheError) {
        logger.warn(
          'Failed to refresh cache timestamp',
          cacheError instanceof Error
            ? { error: cacheError.message }
            : { error: String(cacheError) }
        );
        // Don't fail the refresh if cache update fails
      }
    }

    return result;
  }, [login, clearAuthRetryTimeout]);

  /**
   * Logout function - clears user data
   */
  const logout = useCallback(async (): Promise<void> => {
    logger.info('Logging out Valu user', {
      userId: user?.id,
      wasAuthenticated: !!user,
    });

    try {
      // Stop any active retry timeout
      clearAuthRetryTimeout();

      // Clear local state first
      setIsLoading(false);
      setError(null);
      setUser(null);

      // Reset authentication attempt flag to prevent immediate re-authentication
      authAttemptedRef.current = false;

      // Clear cached user data
      try {
        clearValuUser();
        logger.debug('User cache cleared successfully');
      } catch (cacheError) {
        logger.warn(
          'Failed to clear user cache',
          cacheError instanceof Error
            ? { error: cacheError.message }
            : { error: String(cacheError) }
        );
        // Don't fail logout if cache clearing fails
      }

      logger.info('Valu logout completed');
    } catch (error: any) {
      logger.error('Error during Valu logout', error);

      // Even if logout fails, ensure local state is cleared
      clearAuthRetryTimeout();
      setIsLoading(false);
      setError(null);
      setUser(null);
    }
  }, [user, clearAuthRetryTimeout]);

  /**
   * Auto-authentication when API becomes ready
   */
  useEffect(() => {
    if (!isInIframe) {
      setIsLoading(false);
      return;
    }

    // If already authenticated (either from cache or API), don't try again
    if (user) {
      setIsLoading(false);
      return;
    }

    // Wait for cache initialization to complete first
    if (!cacheInitializedRef.current) {
      return;
    }

    // Wait for API to be ready before attempting authentication
    const timer = setTimeout(async () => {
      // Double-check that we're connected and ready
      if (!isValuConnected || !isValuReady) {
        logger.debug('API not ready, skipping auto-authentication');
        setIsLoading(false);
        return;
      }

      // Don't try to authenticate if we're navigating to another app
      if (isNavigatingApp) {
        logger.debug('App navigation in progress, skipping auto-authentication');
        setIsLoading(false);
        return;
      }

      logger.debug('Attempting API authentication after cache check');

      try {
        const portalUser = await authenticateWithValu();
        if (portalUser) {
          logger.info('API authentication successful', {
            displayName: portalUser.displayName,
            fromCache: !!portalUser.metadata?.fromCache,
          });
        } else {
          logger.debug('No user found via API');
        }
      } catch (error) {
        logger.debug(
          'API authentication attempt failed',
          error instanceof Error ? { error: error.message } : { error: String(error) }
        );
      }

      setIsLoading(false);
    }, 1000); // Reduced to 1 second for faster authentication

    // Fallback timeout: Stop loading after 5 seconds no matter what
    const fallbackTimer = setTimeout(() => {
      logger.warn('Authentication timeout reached after 5 seconds - stopping loading state');
      setIsLoading(false);
      if (!user) {
        setError('Authentication timeout - please try refreshing the page');
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [isInIframe, user, authenticateWithValu, isValuConnected, isValuReady, isNavigatingApp]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearAuthRetryTimeout();
      logger.debug('useValuAuth unmounting, all resources cleaned up');
    };
  }, [clearAuthRetryTimeout]);

  /**
   * Memoized return object to prevent unnecessary re-renders
   */
  const returnValue = useMemo<UseValuAuthReturn>(
    () => ({
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user ? checkAdminAccess(user) : false,
      user,
      error,
      isValuConnected,
      authMethod: user ? 'valu' : null,
      // Actions
      login,
      logout,
      refreshUser,
      clearError,
    }),
    [isLoading, user, error, isValuConnected, login, logout, refreshUser, clearError]
  );

  return returnValue;
}

export default useValuAuth;
