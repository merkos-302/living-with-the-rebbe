/**
 * HTML parsing and resource extraction
 * Extracts all external resources (images, PDFs, documents) from newsletter HTML
 */

import * as cheerio from 'cheerio';
import {
  ParsedResource,
  ParserResult,
  ParserOptions,
  ParserError,
  ResourceType,
} from '@/types/parser';
import {
  identifyResourceType,
  validateUrl,
  shouldProcessResourceType,
} from './resource-identifier';

/**
 * Default parser options
 */
const DEFAULT_OPTIONS: Required<ParserOptions> = {
  baseUrl: '',
  externalOnly: true,
  includeBackgrounds: true,
  maxUrlLength: 2048,
  customTypeDetector: () => null,
};

/**
 * Parses HTML and extracts LINKED downloadable resources (PDFs, documents)
 *
 * IMPORTANT: This parser only extracts resources that are linked for download,
 * NOT inline/referenced media like images that are displayed in the email.
 *
 * - ✅ Extracts: PDFs, Word docs, etc. linked via <a> tags
 * - ❌ Skips: Images in <img> tags, CSS backgrounds, embedded media
 *
 * This is because linked documents need to be uploaded to CMS and have their
 * URLs replaced, while inline images should remain as-is in the email content.
 */
export function parseHtml(html: string, options: ParserOptions = {}): ParserResult {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const resources: ParsedResource[] = [];
  const errors: ParserError[] = [];

  try {
    // Load HTML with cheerio
    const $ = cheerio.load(html, {
      decodeEntities: false, // Preserve HTML entities
      xmlMode: false, // Parse as HTML, not XML
    });

    // SKIP <img> tags - these are referenced/inline media that don't need CMS upload
    // Images displayed in the email content itself should remain as-is

    // ONLY extract LINKED resources from <a> tags (PDFs, Word docs, spreadsheets, etc.)
    // These are downloadable files that users click to access - they need CMS hosting
    $('a').each((index, element) => {
      const $el = $(element);
      const href = $el.attr('href');

      if (href) {
        // Try to identify if this is a document link
        const identification = identifyResourceType(href);

        // Only include if it's a PDF or document
        if (
          identification.type === ResourceType.PDF ||
          identification.type === ResourceType.DOCUMENT
        ) {
          const resource = extractResource({
            url: href,
            tag: 'a',
            attribute: 'href',
            element: $el,
            position: index,
            options: opts,
            errors,
          });

          if (resource) {
            resources.push(resource);
          }
        }
      }
    });

    // SKIP <embed>, <object>, <source> tags - these are typically for inline media
    // We only want to process linked documents (PDFs, DOCs) from anchor tags

    // SKIP CSS background images - these are referenced media for display
    // Background images are part of the email's visual design, not downloadable resources
  } catch (error) {
    errors.push({
      message: `Failed to parse HTML: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'parsing',
    });
  }

  // Remove duplicates (same URL)
  const uniqueResources = deduplicateResources(resources);

  // Generate summary
  const summary = generateSummary(uniqueResources);

  return {
    resources: uniqueResources,
    byType: groupByType(uniqueResources),
    summary,
    errors,
    metadata: {
      parseTime: Date.now() - startTime,
      htmlLength: html.length,
      options: opts,
    },
  };
}

/**
 * Extracts a single resource from an element
 */
interface ExtractResourceParams {
  url: string;
  tag: string;
  attribute: string;
  element: cheerio.Cheerio;
  position: number;
  options: Required<ParserOptions>;
  errors: ParserError[];
}

function extractResource(params: ExtractResourceParams): ParsedResource | null {
  const { url, tag, attribute, element, position, options, errors } = params;

  // Validate URL
  const validation = validateUrl(url, options.baseUrl);

  if (!validation.isValid) {
    errors.push({
      message: `Invalid URL: ${validation.errors.join(', ')}`,
      type: 'validation',
      context: {
        url,
        element: `<${tag}>`,
      },
    });
    return null;
  }

  // Check if URL is too long
  if (validation.normalizedUrl.length > options.maxUrlLength) {
    errors.push({
      message: `URL exceeds maximum length of ${options.maxUrlLength}`,
      type: 'validation',
      context: {
        url: validation.normalizedUrl,
      },
    });
    return null;
  }

  // Check if external only
  if (options.externalOnly && !validation.isExternal) {
    return null;
  }

  // Identify resource type
  const identification = identifyResourceType(validation.normalizedUrl);

  // Try custom detector if provided and type is unknown
  if (identification.type === ResourceType.UNKNOWN && options.customTypeDetector) {
    const customType = options.customTypeDetector(validation.normalizedUrl);
    if (customType) {
      identification.type = customType;
    }
  }

  // Skip if we shouldn't process this type
  if (!shouldProcessResourceType(identification.type)) {
    return null;
  }

  // Extract context information
  const context = {
    altText: element.attr('alt'),
    title: element.attr('title'),
    ariaLabel: element.attr('aria-label'),
  };

  return {
    url,
    normalizedUrl: validation.normalizedUrl,
    type: identification.type,
    extension: identification.extension,
    element: {
      tag,
      attribute,
      outerHTML: element.toString(),
    },
    context,
    isExternal: validation.isExternal,
    position,
  };
}

/**
 * Removes duplicate resources (same normalized URL)
 */
function deduplicateResources(resources: ParsedResource[]): ParsedResource[] {
  const seen = new Set<string>();
  const unique: ParsedResource[] = [];

  for (const resource of resources) {
    if (!seen.has(resource.normalizedUrl)) {
      seen.add(resource.normalizedUrl);
      unique.push(resource);
    }
  }

  return unique;
}

/**
 * Groups resources by type
 */
function groupByType(resources: ParsedResource[]): ParserResult['byType'] {
  const grouped: ParserResult['byType'] = {
    [ResourceType.PDF]: [],
    [ResourceType.IMAGE]: [],
    [ResourceType.DOCUMENT]: [],
    [ResourceType.UNKNOWN]: [],
  };

  for (const resource of resources) {
    grouped[resource.type].push(resource);
  }

  return grouped;
}

/**
 * Generates summary statistics
 */
function generateSummary(resources: ParsedResource[]): ParserResult['summary'] {
  const byType = {
    [ResourceType.PDF]: 0,
    [ResourceType.IMAGE]: 0,
    [ResourceType.DOCUMENT]: 0,
    [ResourceType.UNKNOWN]: 0,
  };

  let externalCount = 0;

  for (const resource of resources) {
    byType[resource.type]++;
    if (resource.isExternal) {
      externalCount++;
    }
  }

  return {
    totalResources: resources.length,
    externalResources: externalCount,
    byType,
  };
}

/**
 * Helper function to extract all resources of a specific type
 */
export function extractResourcesByType(result: ParserResult, type: ResourceType): ParsedResource[] {
  return result.byType[type];
}

/**
 * Helper function to get all unique URLs from parser result
 */
export function getAllUrls(result: ParserResult): string[] {
  return result.resources.map((r) => r.normalizedUrl);
}

/**
 * Helper function to check if parsing was successful
 */
export function hasErrors(result: ParserResult): boolean {
  return result.errors.length > 0;
}

/**
 * Helper function to get error messages
 */
export function getErrorMessages(result: ParserResult): string[] {
  return result.errors.map((e) => e.message);
}
