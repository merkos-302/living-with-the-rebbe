/**
 * URL Resolver
 *
 * Resolves relative URLs in HTML to absolute URLs based on a base URL.
 */

import * as cheerio from 'cheerio';
import { URL } from 'url';
import { UrlResolutionError } from '@/types/fetcher';

/**
 * Checks if a URL is absolute
 */
function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a URL should be skipped (data URIs, hash links, etc.)
 */
function shouldSkipUrl(url: string): boolean {
  if (!url || url.trim() === '') return true;

  const trimmed = url.trim();

  // Skip data URIs
  if (trimmed.startsWith('data:')) return true;

  // Skip hash-only links
  if (trimmed.startsWith('#')) return true;

  // Skip mailto and tel links
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return true;

  // Skip javascript: links
  if (trimmed.startsWith('javascript:')) return true;

  return false;
}

/**
 * Resolves a single URL against a base URL
 */
function resolveUrl(relativeUrl: string, baseUrl: string): string {
  // Skip URLs that shouldn't be resolved
  if (shouldSkipUrl(relativeUrl)) {
    return relativeUrl;
  }

  // If already absolute, return as-is
  if (isAbsoluteUrl(relativeUrl)) {
    return relativeUrl;
  }

  try {
    // Handle protocol-relative URLs (//domain.com/path)
    if (relativeUrl.startsWith('//')) {
      const baseUrlObj = new URL(baseUrl);
      return `${baseUrlObj.protocol}${relativeUrl}`;
    }

    // Resolve relative URL against base
    const resolved = new URL(relativeUrl, baseUrl);
    return resolved.href;
  } catch (error) {
    throw new UrlResolutionError(
      `Failed to resolve URL: ${relativeUrl} against base: ${baseUrl}`,
      baseUrl,
      relativeUrl,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Resolves all relative URLs in CSS to absolute URLs
 */
function resolveCssUrls(css: string, baseUrl: string): string {
  // Match url() in CSS (handles quotes, no quotes, and various formats)
  const urlRegex = /url\s*\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

  return css.replace(urlRegex, (match, quote, url) => {
    try {
      const resolvedUrl = resolveUrl(url, baseUrl);
      return `url(${quote}${resolvedUrl}${quote})`;
    } catch {
      // If resolution fails, keep original
      return match;
    }
  });
}

/**
 * Resolves all relative URLs in HTML to absolute URLs
 *
 * @param html - The HTML string to process
 * @param baseUrl - The base URL to resolve relative URLs against
 * @returns HTML with all relative URLs resolved to absolute
 *
 * @example
 * ```typescript
 * const html = '<img src="../image.png">';
 * const baseUrl = 'https://example.com/pages/';
 * const resolved = resolveAllUrls(html, baseUrl);
 * // Result: '<img src="https://example.com/image.png">'
 * ```
 */
export function resolveAllUrls(html: string, baseUrl: string): string {
  try {
    // Validate base URL
    new URL(baseUrl);
  } catch (error) {
    throw new UrlResolutionError(
      `Invalid base URL: ${baseUrl}`,
      baseUrl,
      undefined,
      error instanceof Error ? error : undefined
    );
  }

  // Parse HTML with Cheerio
  const $ = cheerio.load(html, {
    decodeEntities: false, // Preserve HTML entities
    xmlMode: false, // Parse as HTML, not XML
  });

  try {
    // Resolve href attributes (anchor tags, link tags, etc.)
    $('[href]').each((_, element) => {
      const $element = $(element);
      const href = $element.attr('href');
      if (href) {
        try {
          const resolvedHref = resolveUrl(href, baseUrl);
          $element.attr('href', resolvedHref);
        } catch {
          // Keep original href if resolution fails
        }
      }
    });

    // Resolve src attributes (images, scripts, iframes, etc.)
    $('[src]').each((_, element) => {
      const $element = $(element);
      const src = $element.attr('src');
      if (src) {
        try {
          const resolvedSrc = resolveUrl(src, baseUrl);
          $element.attr('src', resolvedSrc);
        } catch {
          // Keep original src if resolution fails
        }
      }
    });

    // Resolve srcset attributes (responsive images)
    $('[srcset]').each((_, element) => {
      const $element = $(element);
      const srcset = $element.attr('srcset');
      if (srcset) {
        try {
          // srcset format: "url1 descriptor1, url2 descriptor2, ..."
          const resolvedSrcset = srcset
            .split(',')
            .map((part) => {
              const [url, ...descriptors] = part.trim().split(/\s+/);
              if (!url) return part.trim();
              try {
                const resolvedUrl = resolveUrl(url, baseUrl);
                return [resolvedUrl, ...descriptors].join(' ');
              } catch {
                return part.trim();
              }
            })
            .join(', ');
          $element.attr('srcset', resolvedSrcset);
        } catch {
          // Keep original srcset if resolution fails
        }
      }
    });

    // Resolve poster attributes (video elements)
    $('[poster]').each((_, element) => {
      const $element = $(element);
      const poster = $element.attr('poster');
      if (poster) {
        try {
          const resolvedPoster = resolveUrl(poster, baseUrl);
          $element.attr('poster', resolvedPoster);
        } catch {
          // Keep original poster if resolution fails
        }
      }
    });

    // Resolve data attributes that contain URLs
    $('[data-src], [data-background], [data-href]').each((_, element) => {
      const $element = $(element);

      ['data-src', 'data-background', 'data-href'].forEach((attr) => {
        const value = $element.attr(attr);
        if (value) {
          try {
            const resolvedValue = resolveUrl(value, baseUrl);
            $element.attr(attr, resolvedValue);
          } catch {
            // Keep original value if resolution fails
          }
        }
      });
    });

    // Resolve inline styles with url()
    $('[style]').each((_, element) => {
      const $element = $(element);
      const style = $element.attr('style');
      if (style) {
        try {
          const resolvedStyle = resolveCssUrls(style, baseUrl);
          $element.attr('style', resolvedStyle);
        } catch {
          // Keep original style if resolution fails
        }
      }
    });

    // Resolve style tags
    $('style').each((_, element) => {
      const $element = $(element);
      const css = $element.html();
      if (css) {
        try {
          const resolvedCss = resolveCssUrls(css, baseUrl);
          $element.html(resolvedCss);
        } catch {
          // Keep original CSS if resolution fails
        }
      }
    });

    // Return the resolved HTML
    return $.html();
  } catch (error) {
    throw new UrlResolutionError(
      `Failed to resolve URLs in HTML`,
      baseUrl,
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Extracts the base URL from a full URL (everything up to the last /)
 *
 * @param url - The full URL
 * @returns The base URL
 *
 * @example
 * ```typescript
 * const url = 'https://example.com/path/to/page.html';
 * const base = extractBaseUrl(url);
 * // Result: 'https://example.com/path/to/'
 * ```
 */
export function extractBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Remove the last part (filename)
    pathParts.pop();

    // If pathname was just '/', we'll have ['', ''], which is fine
    // If pathname had directories, we'll have the directory path
    const basePath = pathParts.join('/') + '/';

    return `${urlObj.protocol}//${urlObj.host}${basePath}`;
  } catch (error) {
    throw new UrlResolutionError(
      `Failed to extract base URL from: ${url}`,
      url,
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}
