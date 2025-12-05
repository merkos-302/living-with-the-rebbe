/**
 * URL Replacer Module
 *
 * Replaces original resource URLs with CMS URLs in HTML content.
 *
 * @module lib/replacer
 *
 * @example
 * ```typescript
 * import { replaceUrls } from '@/lib/replacer';
 *
 * const urlMap = new Map([
 *   ['https://example.com/file.pdf', 'https://cms.chabaduniverse.com/api/resource/abc123']
 * ]);
 *
 * const result = replaceUrls(html, urlMap);
 * console.log(result.replacementCount); // Number of URLs replaced
 * console.log(result.unreplacedUrls); // URLs that weren't found
 * ```
 */

// Main replacement function
export { replaceUrls } from './url-replacer';

// Helper functions
export { createUrlMap, validateUrlMap, extractHrefUrls, previewReplacements } from './url-replacer';

// Type exports
export type {
  UrlMapping,
  ReplacementResult,
  ReplacementOptions,
  ReplacementStatistics,
  ReplacementWarning,
  UrlMatch,
} from './types';
