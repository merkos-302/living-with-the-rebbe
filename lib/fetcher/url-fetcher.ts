/**
 * URL Fetcher
 *
 * Fetches HTML from URLs and resolves all relative URLs to absolute.
 */

import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { FetchResult, FetchOptions, FetchError } from '@/types/fetcher';
import { resolveAllUrls, extractBaseUrl } from '@/lib/parser/url-resolver';

/**
 * Default fetch options
 */
const DEFAULT_OPTIONS: Required<Omit<FetchOptions, 'headers'>> = {
  timeout: 30000, // 30 seconds
  followRedirects: true,
  maxRedirects: 5,
  resolveUrls: true,
};

/**
 * Validates that a URL is well-formed and uses http/https protocol
 */
function validateUrl(url: string): void {
  try {
    const urlObj = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new FetchError(
        `Invalid protocol: ${urlObj.protocol}. Only http and https are supported.`,
        url
      );
    }
  } catch (error) {
    if (error instanceof FetchError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new FetchError(`Invalid URL format: ${url}`, url);
    }
    throw new FetchError(
      `Invalid URL: ${error instanceof Error ? error.message : String(error)}`,
      url
    );
  }
}

/**
 * Converts FetchOptions to Axios configuration
 */
function buildAxiosConfig(options: FetchOptions): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    timeout: options.timeout ?? DEFAULT_OPTIONS.timeout,
    maxRedirects: options.followRedirects
      ? (options.maxRedirects ?? DEFAULT_OPTIONS.maxRedirects)
      : 0,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LivingWithRebbe/1.0; +https://chabaduniverse.com)',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
      ...options.headers,
    },
    validateStatus: (status) => status >= 200 && status < 300,
    responseType: 'text',
  };

  return config;
}

/**
 * Creates a FetchError from an Axios error
 */
function createFetchError(error: AxiosError, url: string): FetchError {
  if (error.response) {
    // Server responded with error status
    return new FetchError(
      `Failed to fetch URL (HTTP ${error.response.status}): ${error.message}`,
      url,
      error.response.status,
      error
    );
  } else if (error.request) {
    // Request made but no response received
    if (error.code === 'ECONNABORTED') {
      return new FetchError(`Request timeout while fetching URL`, url, undefined, error);
    } else if (error.code === 'ENOTFOUND') {
      return new FetchError(`DNS lookup failed for URL`, url, undefined, error);
    } else if (error.code === 'ECONNREFUSED') {
      return new FetchError(`Connection refused for URL`, url, undefined, error);
    }
    return new FetchError(
      `Network error while fetching URL: ${error.message}`,
      url,
      undefined,
      error
    );
  } else {
    // Error setting up the request
    return new FetchError(`Error setting up request: ${error.message}`, url, undefined, error);
  }
}

/**
 * Fetches HTML from a URL and resolves all relative URLs to absolute
 *
 * @param url - The URL to fetch HTML from
 * @param options - Optional fetch configuration
 * @returns Promise resolving to FetchResult with original and resolved HTML
 *
 * @throws {FetchError} If the URL is invalid or fetch fails
 *
 * @example
 * ```typescript
 * const result = await fetchAndResolveHtml(
 *   'https://merkos-living.s3.us-west-2.amazonaws.com/Email85/48KiSavo1.html'
 * );
 * console.log(result.resolvedHtml); // HTML with absolute URLs
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * const result = await fetchAndResolveHtml(
 *   'https://merkos302.com/living/newsletter.html',
 *   {
 *     timeout: 60000,
 *     headers: { 'Authorization': 'Bearer token' }
 *   }
 * );
 * ```
 */
export async function fetchAndResolveHtml(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  // Validate URL format
  validateUrl(url);

  // Merge options with defaults
  const fetchOptions: FetchOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  try {
    // Build axios configuration
    const axiosConfig = buildAxiosConfig(fetchOptions);

    // Fetch HTML from URL
    const response = await axios.get(url, axiosConfig);

    // Verify we got HTML content
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new FetchError(
        `URL did not return HTML content. Content-Type: ${contentType}`,
        url,
        response.status
      );
    }

    const html = response.data;

    // Verify we got non-empty HTML
    if (!html || typeof html !== 'string') {
      throw new FetchError(
        `URL returned invalid HTML content (not a string or empty)`,
        url,
        response.status
      );
    }

    if (html.trim().length === 0) {
      throw new FetchError(`URL returned empty HTML content`, url, response.status);
    }

    // Extract base URL from the fetch URL
    const baseUrl = extractBaseUrl(url);

    // Validate baseUrl was extracted successfully
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new FetchError(`Failed to extract base URL from: ${url}`, url, response.status);
    }

    // Resolve URLs if enabled
    let resolvedHtml: string;
    try {
      resolvedHtml = fetchOptions.resolveUrls !== false ? resolveAllUrls(html, baseUrl) : html;
    } catch (error) {
      // If URL resolution fails, fall back to original HTML
      console.error('URL resolution failed, using original HTML:', error);
      resolvedHtml = html;
    }

    // Final validation before returning
    if (!resolvedHtml || typeof resolvedHtml !== 'string') {
      throw new FetchError(`URL resolution produced invalid result`, url, response.status);
    }

    return {
      html,
      baseUrl,
      resolvedHtml,
      sourceUrl: url,
      fetchedAt: new Date(),
    };
  } catch (error) {
    // If already a FetchError, re-throw
    if (error instanceof FetchError) {
      throw error;
    }

    // Convert Axios errors to FetchError
    if (axios.isAxiosError(error)) {
      throw createFetchError(error, url);
    }

    // Handle other errors
    throw new FetchError(
      `Unexpected error while fetching URL: ${error instanceof Error ? error.message : String(error)}`,
      url,
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Fetches HTML from a URL without resolving relative URLs
 *
 * @param url - The URL to fetch HTML from
 * @param options - Optional fetch configuration
 * @returns Promise resolving to the raw HTML string
 *
 * @throws {FetchError} If the URL is invalid or fetch fails
 */
export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const result = await fetchAndResolveHtml(url, {
    ...options,
    resolveUrls: false,
  });
  return result.html;
}

/**
 * Tests if a URL is reachable and returns HTML
 *
 * @param url - The URL to test
 * @param options - Optional fetch configuration
 * @returns Promise resolving to true if URL is reachable, false otherwise
 */
export async function isUrlReachable(url: string, options: FetchOptions = {}): Promise<boolean> {
  try {
    await fetchHtml(url, {
      ...options,
      timeout: options.timeout ?? 10000, // Shorter timeout for testing
    });
    return true;
  } catch {
    return false;
  }
}
