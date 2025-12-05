/**
 * Type definitions for URL replacement in HTML
 */

/**
 * URL mapping from original to CMS URL
 */
export interface UrlMapping {
  /** Original URL found in the HTML */
  originalUrl: string;

  /** New CMS URL to replace it with */
  cmsUrl: string;
}

/**
 * Result of URL replacement operation
 */
export interface ReplacementResult {
  /** Modified HTML with replaced URLs */
  html: string;

  /** Number of URLs successfully replaced */
  replacementCount: number;

  /** URLs that were in the map but not found in HTML */
  unreplacedUrls: string[];

  /** Statistics about the replacement operation */
  statistics: ReplacementStatistics;

  /** Any warnings or issues encountered */
  warnings: ReplacementWarning[];
}

/**
 * Statistics about the replacement operation
 */
export interface ReplacementStatistics {
  /** Total URLs in the mapping */
  totalMappings: number;

  /** URLs successfully replaced */
  successfulReplacements: number;

  /** URLs in map but not found in HTML */
  unmatchedMappings: number;

  /** Total number of href attributes modified */
  modifiedElements: number;

  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Warning or issue encountered during replacement
 */
export interface ReplacementWarning {
  /** Warning message */
  message: string;

  /** Type of warning */
  type: 'url-not-found' | 'duplicate-url' | 'malformed-url' | 'encoding-issue';

  /** Context information */
  context?: {
    url?: string;
    element?: string;
    position?: number;
  };
}

/**
 * Options for URL replacement
 */
export interface ReplacementOptions {
  /**
   * Whether to match URLs case-sensitively
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Whether to normalize URLs before matching (remove fragments, decode)
   * @default true
   */
  normalizeUrls?: boolean;

  /**
   * Whether to match query parameters exactly
   * If false, URLs with different query params are considered the same
   * @default true
   */
  matchQueryParams?: boolean;

  /**
   * Whether to match URL fragments (hash)
   * @default false
   */
  matchFragments?: boolean;

  /**
   * Preserve original HTML formatting (whitespace, indentation)
   * @default true
   */
  preserveFormatting?: boolean;
}

/**
 * Internal URL match information
 */
export interface UrlMatch {
  /** Original URL as found in HTML */
  originalUrl: string;

  /** Normalized URL for matching */
  normalizedUrl: string;

  /** Element index in the document */
  elementIndex: number;

  /** Tag name (usually 'a') */
  tagName: string;
}
