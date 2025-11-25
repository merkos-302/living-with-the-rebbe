/**
 * Valu Authentication Cookie Management
 *
 * Secure cookie-based caching system for Valu user authentication data.
 * Provides efficient client-side persistence for Valu authentication state
 * across browser sessions while maintaining security best practices.
 *
 * Key Features:
 * - Secure cookie storage optimized for iframe environments
 * - 4-hour cache expiration to balance performance and security
 * - Graceful handling of corrupted or invalid data
 * - JSON serialization with type safety
 * - Cross-subdomain support for chabaduniverse.com
 * - HttpOnly disabled for JavaScript access requirements
 *
 * Security Considerations:
 * - Uses SameSite=None for iframe compatibility (requires Secure=true)
 * - Short 4-hour expiration reduces exposure window
 * - Only caches essential user data, not sensitive tokens
 * - Validates data integrity on retrieval
 * - Sanitizes data before storage to prevent XSS
 *
 * Usage:
 * ```typescript
 * import { getValuUser, setValuUser, clearValuUser, hasValuUser } from '@/utils/valuAuthCookie';
 *
 * // Check if user is cached
 * if (hasValuUser()) {
 *   const user = getValuUser();
 *   if (user) {
 *     console.log('Cached user:', user.displayName);
 *   }
 * }
 *
 * // Cache user data after authentication
 * setValuUser({
 *   id: 'valu_123',
 *   name: 'John Doe',
 *   valuUserId: '123',
 *   cachedAt: new Date().toISOString()
 * });
 *
 * // Clear cache on logout
 * clearValuUser();
 * ```
 */

import { getCookie, setCookie, deleteCookie, hasCookie } from './cookies';
import { logger } from './logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Cached Valu user data structure
 *
 * Minimal user data cached in cookies for performance optimization.
 * Contains only essential information needed for immediate UI updates
 * and authentication state persistence.
 */
export interface ValuUserCache {
  /** Portal user ID (prefixed with 'valu_') */
  id: string;

  /** Display name for UI rendering */
  name: string;

  /** Original Valu user ID from Valu API */
  valuUserId: string;

  /** Timestamp when data was cached (ISO string) */
  cachedAt: string;

  /** Optional display name (falls back to name if not provided) */
  displayName?: string;

  /** Optional user email */
  email?: string;

  /** Optional profile image URL */
  profileImage?: string;

  /** User roles in portal format */
  roles?: string[];

  /** Network information if available */
  network?: {
    id: string;
    name: string;
    role: string;
  };
}

/**
 * Cookie configuration for Valu user cache
 *
 * Optimized for iframe environments with security considerations:
 * - 4 hour expiration balances performance and security
 * - SameSite=None required for cross-origin iframe communication
 * - Secure=true required when using SameSite=None
 * - HttpOnly=false allows JavaScript access for client-side auth
 */
const VALU_COOKIE_CONFIG = {
  name: 'valu_user_cache',
  // Convert 4 hours to days for cookie utility (4 hours / 24 hours = 0.167 days)
  days: 4 / 24,
  sameSite: 'None' as const,
  secure: true,
  httpOnly: false, // Must be false for JavaScript access
  path: '/'
} as const;

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate cached user data structure
 *
 * Ensures the retrieved data has the required fields and valid structure.
 * Prevents runtime errors from corrupted or malformed cookie data.
 *
 * @param data - Raw data from cookie parsing
 * @returns True if data is valid ValuUserCache structure
 */
function isValidValuUserCache(data: any): data is ValuUserCache {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['id', 'name', 'valuUserId', 'cachedAt'];
  for (const field of requiredFields) {
    if (!data[field] || typeof data[field] !== 'string') {
      return false;
    }
  }

  // Validate ID format (should start with 'valu_')
  if (!data.id.startsWith('valu_')) {
    return false;
  }

  // Validate timestamp format (should be valid ISO string)
  const cachedAt = new Date(data.cachedAt);
  if (isNaN(cachedAt.getTime())) {
    return false;
  }

  // Check expiration (4 hours)
  const fourHoursAgo = new Date(Date.now() - (4 * 60 * 60 * 1000));
  if (cachedAt < fourHoursAgo) {
    logger.debug('Cached user data expired', {
      cachedAt: data.cachedAt,
      expirationThreshold: fourHoursAgo.toISOString()
    });
    return false;
  }

  // Validate optional fields if present
  if (data.roles && !Array.isArray(data.roles)) {
    return false;
  }

  if (data.network && typeof data.network !== 'object') {
    return false;
  }

  return true;
}

/**
 * Sanitize user data before storage
 *
 * Removes potentially dangerous content and ensures data is safe for storage.
 * Prevents XSS attacks through malicious user data injection.
 *
 * @param data - User data to sanitize
 * @returns Sanitized user data safe for storage
 */
function sanitizeUserData(data: Partial<ValuUserCache>): Partial<ValuUserCache> {
  const sanitized: Partial<ValuUserCache> = {};

  // Sanitize string fields
  const stringFields = ['id', 'name', 'valuUserId', 'cachedAt', 'displayName', 'email', 'profileImage'] as const;

  for (const field of stringFields) {
    if (data[field] && typeof data[field] === 'string') {
      // Basic XSS prevention: remove script tags and dangerous characters
      sanitized[field] = (data[field] as string)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .substring(0, 500); // Limit length
    }
  }

  // Sanitize roles array
  if (data.roles && Array.isArray(data.roles)) {
    sanitized.roles = data.roles
      .filter(role => typeof role === 'string')
      .map(role => role.substring(0, 50)) // Limit role length
      .slice(0, 10); // Limit array size
  }

  // Sanitize network object
  if (data.network && typeof data.network === 'object') {
    const { id, name, role } = data.network;
    if (typeof id === 'string' && typeof name === 'string' && typeof role === 'string') {
      sanitized.network = {
        id: id.substring(0, 100),
        name: name.substring(0, 200),
        role: role.substring(0, 50)
      };
    }
  }

  return sanitized;
}

// ============================================================================
// Core Cookie Management Functions
// ============================================================================

/**
 * Retrieve cached Valu user data from cookie
 *
 * Safely retrieves and validates cached user authentication data.
 * Handles corrupted data gracefully and automatically cleans up expired cache.
 *
 * @returns Cached user data if valid and not expired, null otherwise
 *
 * @example
 * ```typescript
 * const cachedUser = getValuUser();
 * if (cachedUser) {
 *   console.log(`Welcome back, ${cachedUser.name}!`);
 *   // Use cached data for immediate UI updates
 * } else {
 *   // Need to authenticate with Valu API
 *   await authenticateWithValu();
 * }
 * ```
 */
export function getValuUser(): ValuUserCache | null {
  try {
    const cookieValue = getCookie(VALU_COOKIE_CONFIG.name);

    if (!cookieValue) {
      logger.debug('No Valu user cache cookie found');
      return null;
    }

    // Parse JSON data
    let parsedData: any;
    try {
      parsedData = JSON.parse(cookieValue);
    } catch (parseError) {
      logger.warn('Failed to parse Valu user cache cookie JSON', {
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        cookieLength: cookieValue.length
      });

      // Clear corrupted cookie
      clearValuUser();
      return null;
    }

    // Validate data structure and expiration
    if (!isValidValuUserCache(parsedData)) {
      logger.warn('Invalid or expired Valu user cache data found', {
        hasId: !!parsedData?.id,
        hasName: !!parsedData?.name,
        hasValuUserId: !!parsedData?.valuUserId,
        hasCachedAt: !!parsedData?.cachedAt,
        cachedAt: parsedData?.cachedAt
      });

      // Clear invalid cookie
      clearValuUser();
      return null;
    }

    logger.debug('Successfully retrieved Valu user cache', {
      userId: parsedData.id,
      name: parsedData.name,
      cachedAt: parsedData.cachedAt,
      hasRoles: !!parsedData.roles,
      hasNetwork: !!parsedData.network
    });

    return parsedData;

  } catch (error) {
    logger.error('Unexpected error retrieving Valu user cache', error);

    // Clear potentially corrupted cookie on any error
    clearValuUser();
    return null;
  }
}

/**
 * Cache Valu user data in secure cookie
 *
 * Stores essential user data for quick access and authentication persistence.
 * Automatically sets expiration and applies security configurations for iframe environments.
 *
 * @param userData - User data to cache (only essential fields)
 *
 * @example
 * ```typescript
 * // After successful Valu authentication
 * const portalUser = await authenticateWithValu();
 * if (portalUser) {
 *   setValuUser({
 *     id: portalUser.id,
 *     name: portalUser.displayName,
 *     valuUserId: portalUser.valuUserId,
 *     cachedAt: new Date().toISOString(),
 *     displayName: portalUser.displayName,
 *     email: portalUser.email,
 *     profileImage: portalUser.profileImage,
 *     roles: portalUser.roles,
 *     network: portalUser.network
 *   });
 * }
 * ```
 */
export function setValuUser(userData: ValuUserCache): void {
  try {
    // Sanitize data before storage
    const sanitizedData = sanitizeUserData(userData);

    // Ensure required fields are present after sanitization
    if (!sanitizedData.id || !sanitizedData.name || !sanitizedData.valuUserId) {
      logger.error('Cannot cache Valu user: missing required fields after sanitization', {
        hasId: !!sanitizedData.id,
        hasName: !!sanitizedData.name,
        hasValuUserId: !!sanitizedData.valuUserId
      });
      return;
    }

    // Add current timestamp if not provided
    if (!sanitizedData.cachedAt) {
      sanitizedData.cachedAt = new Date().toISOString();
    }

    // Serialize to JSON
    const jsonData = JSON.stringify(sanitizedData);

    // Check cookie size (browsers typically limit to 4KB)
    if (jsonData.length > 3500) { // Leave some buffer
      logger.warn('Valu user cache data is large, may be truncated by browser', {
        dataSize: jsonData.length,
        userId: sanitizedData.id
      });
    }

    // Set cookie with security configuration
    setCookie(VALU_COOKIE_CONFIG.name, jsonData, {
      days: VALU_COOKIE_CONFIG.days,
      sameSite: VALU_COOKIE_CONFIG.sameSite,
      secure: VALU_COOKIE_CONFIG.secure,
      path: VALU_COOKIE_CONFIG.path
    });

    logger.info('Valu user cache stored successfully', {
      userId: sanitizedData.id,
      name: sanitizedData.name,
      cachedAt: sanitizedData.cachedAt,
      dataSize: jsonData.length,
      expiresInHours: 4
    });

  } catch (error) {
    logger.error('Failed to cache Valu user data', error, {
      userId: userData?.id,
      hasName: !!userData?.name
    });
  }
}

/**
 * Clear cached Valu user data
 *
 * Removes all cached authentication data from cookies.
 * Should be called on logout or when authentication state becomes invalid.
 *
 * @example
 * ```typescript
 * // On user logout
 * const logout = async () => {
 *   await clearValuUser();
 *   // Clear other authentication state...
 * };
 *
 * // On authentication error
 * if (authError) {
 *   clearValuUser();
 *   showLoginPrompt();
 * }
 * ```
 */
export function clearValuUser(): void {
  try {
    deleteCookie(VALU_COOKIE_CONFIG.name, {
      path: VALU_COOKIE_CONFIG.path
    });

    logger.debug('Valu user cache cleared successfully');

  } catch (error) {
    logger.error('Failed to clear Valu user cache', error);
  }
}

/**
 * Check if Valu user cache exists and is valid
 *
 * Efficiently checks for cached authentication data without parsing full content.
 * Useful for quick authentication state checks and conditional UI rendering.
 *
 * @returns True if valid cache exists, false otherwise
 *
 * @example
 * ```typescript
 * // Quick authentication check
 * const showWelcome = hasValuUser();
 *
 * // Conditional authentication flow
 * if (hasValuUser()) {
 *   // Show cached UI immediately
 *   renderUserInterface(getValuUser());
 * } else {
 *   // Start authentication process
 *   initiateValuAuthentication();
 * }
 *
 * // Loading state management
 * const isLoading = !hasValuUser() && isAuthenticating;
 * ```
 */
export function hasValuUser(): boolean {
  try {
    // First check if cookie exists at all
    if (!hasCookie(VALU_COOKIE_CONFIG.name)) {
      return false;
    }

    // Get and validate the cached data
    const cachedUser = getValuUser();
    return cachedUser !== null;

  } catch (error) {
    logger.debug('Error checking Valu user cache existence', error instanceof Error ? { error: error.message } : { error: String(error) });
    return false;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get cache metadata without retrieving full user data
 *
 * Returns cache timing information for debugging and monitoring purposes.
 * Useful for cache performance analysis and expiration tracking.
 *
 * @returns Cache metadata or null if no valid cache exists
 */
export function getValuCacheMetadata(): { cachedAt: string; expiresAt: string; isExpired: boolean } | null {
  try {
    const cookieValue = getCookie(VALU_COOKIE_CONFIG.name);
    if (!cookieValue) return null;

    const parsedData = JSON.parse(cookieValue);
    if (!parsedData?.cachedAt) return null;

    const cachedAt = new Date(parsedData.cachedAt);
    const expiresAt = new Date(cachedAt.getTime() + (4 * 60 * 60 * 1000)); // 4 hours
    const isExpired = new Date() > expiresAt;

    return {
      cachedAt: cachedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isExpired
    };

  } catch (error) {
    logger.debug('Error getting cache metadata', error instanceof Error ? { error: error.message } : { error: String(error) });
    return null;
  }
}

/**
 * Refresh cache expiration time
 *
 * Updates the cached timestamp to extend cache validity.
 * Useful for active sessions to maintain cache without full re-authentication.
 *
 * @returns True if refresh was successful, false otherwise
 */
export function refreshValuCache(): boolean {
  try {
    const currentUser = getValuUser();
    if (!currentUser) {
      return false;
    }

    // Update cached timestamp
    const refreshedUser: ValuUserCache = {
      ...currentUser,
      cachedAt: new Date().toISOString()
    };

    setValuUser(refreshedUser);
    return true;

  } catch (error) {
    logger.error('Failed to refresh Valu cache', error);
    return false;
  }
}

// ============================================================================
// Type Exports
// ============================================================================

// ValuUserCache is already exported at the top of the file

/**
 * Default export object with all functions for convenient importing
 */
export default {
  getValuUser,
  setValuUser,
  clearValuUser,
  hasValuUser,
  getValuCacheMetadata,
  refreshValuCache
} as const;
