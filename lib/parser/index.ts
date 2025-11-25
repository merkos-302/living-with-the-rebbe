/**
 * HTML Parser Module
 * Main entry point for parsing newsletter HTML and extracting resources
 */

// Import for use in helper functions
import { parseHtml as parseHtmlInternal } from './html-parser';
import { ResourceType } from '@/types/parser';

// Export main parsing functions
export {
  parseHtml,
  extractResourcesByType,
  getAllUrls,
  hasErrors,
  getErrorMessages,
} from './html-parser';

// Export resource identification utilities
export {
  identifyResourceType,
  validateUrl,
  isExternalUrl,
  shouldProcessResourceType,
  getResourceTypeDescription,
  getSupportedExtensions,
  getExtensionFromUrl,
} from './resource-identifier';

// Re-export types for convenience
export type {
  ParsedResource,
  ParserResult,
  ParserOptions,
  ParserError,
  ResourceIdentification,
  URLValidation,
} from '@/types/parser';

export { ResourceType } from '@/types/parser';

/**
 * Quick start example:
 *
 * ```typescript
 * import { parseHtml, ResourceType } from '@/lib/parser';
 *
 * const html = '<img src="https://example.com/image.jpg" />';
 * const result = parseHtml(html, {
 *   externalOnly: true,
 *   includeBackgrounds: true
 * });
 *
 * console.log(result.summary.totalResources); // Number of resources found
 * console.log(result.byType[ResourceType.IMAGE]); // All images
 * console.log(result.errors); // Any parsing errors
 * ```
 */

/**
 * Simple helper to parse HTML and get just the resource URLs
 */
export function extractResourceUrls(html: string): string[] {
  const result = parseHtmlInternal(html);
  return result.resources.map((r) => r.normalizedUrl);
}

/**
 * Parse HTML and filter by resource type
 */
export function extractResourceUrlsByType(html: string, type: ResourceType): string[] {
  const result = parseHtmlInternal(html);
  return result.byType[type].map((r) => r.normalizedUrl);
}

/**
 * Quick validation: does HTML contain any external resources?
 */
export function hasExternalResources(html: string): boolean {
  const result = parseHtmlInternal(html);
  return result.summary.externalResources > 0;
}

/**
 * Get a summary of resources in HTML without full parsing
 */
export function getResourceSummary(html: string): {
  total: number;
  external: number;
  byType: Record<ResourceType, number>;
} {
  const result = parseHtmlInternal(html);
  return {
    total: result.summary.totalResources,
    external: result.summary.externalResources,
    byType: result.summary.byType,
  };
}
