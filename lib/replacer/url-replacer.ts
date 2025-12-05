/**
 * URL replacement engine for Living with the Rebbe
 * Replaces original resource URLs with CMS URLs in HTML
 */

import * as cheerio from 'cheerio';
import { ReplacementResult, ReplacementOptions, ReplacementWarning } from './types';

/**
 * Default replacement options
 */
const DEFAULT_OPTIONS: Required<ReplacementOptions> = {
  caseSensitive: false,
  normalizeUrls: true,
  matchQueryParams: true,
  matchFragments: false,
  preserveFormatting: true,
};

/**
 * Replaces URLs in HTML with CMS URLs
 *
 * Takes HTML and a mapping of original URLs to CMS URLs, and returns
 * modified HTML with all matching URLs replaced.
 *
 * @param html - The HTML content to process
 * @param urlMap - Map of original URLs to CMS URLs
 * @param options - Replacement options
 * @returns ReplacementResult with modified HTML and statistics
 *
 * @example
 * ```typescript
 * const urlMap = new Map([
 *   ['https://example.com/file.pdf', 'https://cms.chabaduniverse.com/api/resource/abc123']
 * ]);
 * const result = replaceUrls(html, urlMap);
 * console.log(result.replacementCount); // 1
 * ```
 */
export function replaceUrls(
  html: string,
  urlMap: Map<string, string>,
  options: ReplacementOptions = {}
): ReplacementResult {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: ReplacementWarning[] = [];
  const replacedUrls = new Set<string>();

  // Validate inputs
  if (!html || html.trim().length === 0) {
    return createEmptyResult('Empty HTML provided', startTime);
  }

  if (urlMap.size === 0) {
    return createEmptyResult('Empty URL mapping provided', startTime);
  }

  try {
    // Load HTML with cheerio
    const $ = cheerio.load(html, {
      decodeEntities: false, // Preserve HTML entities
      xmlMode: false, // Parse as HTML
      _useHtmlParser2: true, // Use html-parser2 for better preservation
    });

    // Build normalized URL map for matching
    const normalizedMap = buildNormalizedUrlMap(urlMap, opts);

    // Track statistics
    let modifiedElements = 0;

    // Process all <a> tags (where resources are linked)
    $('a').each((_index, element) => {
      const $el = $(element);
      const href = $el.attr('href');

      if (!href) {
        return; // Skip elements without href
      }

      // Normalize the href for matching
      const normalizedHref = normalizeUrl(href, opts);

      // Check if this URL is in our mapping
      const cmsUrl = normalizedMap.get(normalizedHref);

      if (cmsUrl) {
        // Replace the href with CMS URL
        $el.attr('href', cmsUrl);
        replacedUrls.add(normalizedHref);
        modifiedElements++;
      }
    });

    // Find URLs that were in the map but not found in HTML
    const unreplacedUrls: string[] = [];
    Array.from(urlMap.entries()).forEach(([originalUrl]) => {
      const normalized = normalizeUrl(originalUrl, opts);
      if (!replacedUrls.has(normalized)) {
        unreplacedUrls.push(originalUrl);
        warnings.push({
          message: `URL not found in HTML: ${originalUrl}`,
          type: 'url-not-found',
          context: { url: originalUrl },
        });
      }
    });

    // Generate modified HTML
    const modifiedHtml = opts.preserveFormatting ? $.html() : $.html({ decodeEntities: false });

    // Build result
    const result: ReplacementResult = {
      html: modifiedHtml,
      replacementCount: replacedUrls.size,
      unreplacedUrls,
      statistics: {
        totalMappings: urlMap.size,
        successfulReplacements: replacedUrls.size,
        unmatchedMappings: unreplacedUrls.length,
        modifiedElements,
        processingTime: Date.now() - startTime,
      },
      warnings,
    };

    return result;
  } catch (error) {
    // Handle parsing errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    warnings.push({
      message: `Failed to parse HTML: ${errorMessage}`,
      type: 'malformed-url',
    });

    return {
      html,
      replacementCount: 0,
      unreplacedUrls: Array.from(urlMap.keys()),
      statistics: {
        totalMappings: urlMap.size,
        successfulReplacements: 0,
        unmatchedMappings: urlMap.size,
        modifiedElements: 0,
        processingTime: Date.now() - startTime,
      },
      warnings,
    };
  }
}

/**
 * Builds a normalized URL map for efficient matching
 */
function buildNormalizedUrlMap(
  urlMap: Map<string, string>,
  options: Required<ReplacementOptions>
): Map<string, string> {
  const normalized = new Map<string, string>();

  Array.from(urlMap.entries()).forEach(([originalUrl, cmsUrl]) => {
    const normalizedKey = normalizeUrl(originalUrl, options);
    normalized.set(normalizedKey, cmsUrl);
  });

  return normalized;
}

/**
 * Normalizes a URL for consistent matching
 */
function normalizeUrl(url: string, options: Required<ReplacementOptions>): string {
  if (!options.normalizeUrls) {
    return options.caseSensitive ? url : url.toLowerCase();
  }

  try {
    let normalized = url.trim();

    // Decode URL-encoded characters for consistent matching
    try {
      normalized = decodeURIComponent(normalized);
    } catch {
      // If decoding fails, use original
    }

    // Parse URL to handle components
    let urlObj: URL;
    try {
      urlObj = new URL(normalized);
    } catch {
      // Not a valid absolute URL, treat as relative
      return options.caseSensitive ? normalized : normalized.toLowerCase();
    }

    // Remove fragment (hash) if not matching fragments
    if (!options.matchFragments) {
      urlObj.hash = '';
    }

    // Remove query parameters if not matching them
    if (!options.matchQueryParams) {
      urlObj.search = '';
    }

    // Rebuild URL
    normalized = urlObj.toString();

    // Remove trailing slash for consistency
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    // Apply case sensitivity
    return options.caseSensitive ? normalized : normalized.toLowerCase();
  } catch {
    // Fallback for malformed URLs
    return options.caseSensitive ? url : url.toLowerCase();
  }
}

/**
 * Creates an empty result for error cases
 */
function createEmptyResult(warningMessage: string, startTime: number): ReplacementResult {
  return {
    html: '',
    replacementCount: 0,
    unreplacedUrls: [],
    statistics: {
      totalMappings: 0,
      successfulReplacements: 0,
      unmatchedMappings: 0,
      modifiedElements: 0,
      processingTime: Date.now() - startTime,
    },
    warnings: [
      {
        message: warningMessage,
        type: 'malformed-url',
      },
    ],
  };
}

/**
 * Helper function to create a URL map from arrays
 */
export function createUrlMap(originalUrls: string[], cmsUrls: string[]): Map<string, string> {
  if (originalUrls.length !== cmsUrls.length) {
    throw new Error('Original URLs and CMS URLs arrays must have the same length');
  }

  const map = new Map<string, string>();
  for (let i = 0; i < originalUrls.length; i++) {
    const originalUrl = originalUrls[i];
    const cmsUrl = cmsUrls[i];
    if (originalUrl && cmsUrl) {
      map.set(originalUrl, cmsUrl);
    }
  }

  return map;
}

/**
 * Helper function to validate a URL map
 */
export function validateUrlMap(urlMap: Map<string, string>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (urlMap.size === 0) {
    errors.push('URL map is empty');
  }

  Array.from(urlMap.entries()).forEach(([originalUrl, cmsUrl]) => {
    if (!originalUrl || originalUrl.trim().length === 0) {
      errors.push('Original URL cannot be empty');
    }

    if (!cmsUrl || cmsUrl.trim().length === 0) {
      errors.push(`CMS URL for "${originalUrl}" cannot be empty`);
    }

    // Basic URL validation
    try {
      new URL(cmsUrl);
    } catch {
      errors.push(`Invalid CMS URL: "${cmsUrl}"`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function to extract all href URLs from HTML
 * Useful for debugging and validation
 */
export function extractHrefUrls(html: string): string[] {
  try {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        urls.push(href);
      }
    });

    return urls;
  } catch {
    return [];
  }
}

/**
 * Helper function to preview what would be replaced
 * without actually modifying the HTML
 */
export function previewReplacements(
  html: string,
  urlMap: Map<string, string>,
  options: ReplacementOptions = {}
): {
  matches: Array<{ originalUrl: string; cmsUrl: string; count: number }>;
  totalReplacements: number;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const $ = cheerio.load(html);
  const normalizedMap = buildNormalizedUrlMap(urlMap, opts);
  const matches = new Map<string, { originalUrl: string; cmsUrl: string; count: number }>();

  $('a').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    const normalizedHref = normalizeUrl(href, opts);
    const cmsUrl = normalizedMap.get(normalizedHref);

    if (cmsUrl) {
      const existing = matches.get(normalizedHref);
      if (existing) {
        existing.count++;
      } else {
        matches.set(normalizedHref, {
          originalUrl: href,
          cmsUrl,
          count: 1,
        });
      }
    }
  });

  const matchesArray = Array.from(matches.values());
  const totalReplacements = matchesArray.reduce((sum, match) => sum + match.count, 0);

  return {
    matches: matchesArray,
    totalReplacements,
  };
}
