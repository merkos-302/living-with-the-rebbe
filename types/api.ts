/**
 * API request and response types for the Living with the Rebbe application
 */

/**
 * Request body for fetching HTML from a URL
 */
export interface FetchHtmlRequest {
  url: string;
}

/**
 * Metadata about the HTML fetch operation
 */
export interface FetchHtmlMetadata {
  fetchTime: number; // Time taken to fetch in milliseconds
  htmlLength: number; // Length of the original HTML
  resolvedLength: number; // Length of the resolved HTML with absolute URLs
}

/**
 * Successful response data for HTML fetch
 */
export interface FetchHtmlData {
  html: string; // Original HTML content
  baseUrl: string; // Base URL used for resolution
  resolvedHtml: string; // HTML with relative URLs resolved to absolute
  metadata: FetchHtmlMetadata;
}

/**
 * Success response for fetch-html endpoint
 */
export interface FetchHtmlSuccessResponse {
  success: true;
  data: FetchHtmlData;
}

/**
 * Error response for fetch-html endpoint
 */
export interface FetchHtmlErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * Combined response type for fetch-html endpoint
 */
export type FetchHtmlResponse = FetchHtmlSuccessResponse | FetchHtmlErrorResponse;

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

/**
 * Generic API success response wrapper
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Generic API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
