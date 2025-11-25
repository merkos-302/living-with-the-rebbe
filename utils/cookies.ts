/**
 * Cookie utility functions for managing browser cookies
 * with support for cross-subdomain and secure environments
 */

interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Set a cookie with options
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof document === 'undefined') return;

  const {
    days = 7,
    path = '/',
    domain,
    secure = window.location.protocol === 'https:',
    sameSite = 'Lax'
  } = options;

  let cookieString = `${name}=${encodeURIComponent(value)}`;

  // Add expiration
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    cookieString += `; expires=${date.toUTCString()}`;
  }

  // Add path
  cookieString += `; path=${path}`;

  // Add domain - auto-detect for chabaduniverse.com
  const cookieDomain = domain || getCookieDomain();
  if (cookieDomain) {
    cookieString += `; domain=${cookieDomain}`;
  }

  // Add secure flag
  if (secure) {
    cookieString += '; Secure';
  }

  // Add SameSite
  cookieString += `; SameSite=${sameSite}`;

  // For cross-origin iframes, we need SameSite=None and Secure
  if (isInIframe() && sameSite === 'None' && !secure) {
    console.warn('SameSite=None requires Secure flag');
    return;
  }

  document.cookie = cookieString;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, options: Omit<CookieOptions, 'days'> = {}): void {
  setCookie(name, '', { ...options, days: -1 });
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(';');

  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  }

  return cookies;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Get the appropriate cookie domain for the current environment
 */
function getCookieDomain(): string {
  if (typeof window === 'undefined') return '';

  const hostname = window.location.hostname.toLowerCase();

  // For chabaduniverse.com domains, use cross-subdomain cookie
  if (hostname.includes('chabaduniverse.com')) {
    return '.chabaduniverse.com';
  }

  // For localhost, don't set domain
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '';
  }

  // For other domains, use the current hostname
  return hostname;
}

/**
 * Check if the current page is in an iframe
 */
function isInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    // If accessing window.top throws an error, we're likely in a cross-origin iframe
    return true;
  }
}
