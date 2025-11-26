/**
 * URL Fetcher Types
 *
 * Type definitions for fetching and resolving HTML from URLs.
 */

/**
 * Result from fetching and resolving HTML from a URL
 */
export interface FetchResult {
  /** Original HTML fetched from the URL */
  html: string;

  /** Base URL extracted from the fetch URL (everything up to last /) */
  baseUrl: string;

  /** HTML with all relative URLs resolved to absolute */
  resolvedHtml: string;

  /** The original URL that was fetched */
  sourceUrl: string;

  /** Timestamp when the fetch occurred */
  fetchedAt: Date;
}

/**
 * Options for fetching HTML from a URL
 */
export interface FetchOptions {
  /** Maximum time to wait for the request in milliseconds */
  timeout?: number;

  /** Whether to follow redirects (default: true) */
  followRedirects?: boolean;

  /** Maximum number of redirects to follow (default: 5) */
  maxRedirects?: number;

  /** Custom headers to include in the request */
  headers?: Record<string, string>;

  /** Whether to resolve relative URLs (default: true) */
  resolveUrls?: boolean;
}

/**
 * Error thrown when URL fetching fails
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Error thrown when URL resolution fails
 */
export class UrlResolutionError extends Error {
  constructor(
    message: string,
    public readonly baseUrl: string,
    public readonly relativeUrl?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'UrlResolutionError';
  }
}
