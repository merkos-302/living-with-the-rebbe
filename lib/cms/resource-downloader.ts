/**
 * Resource Downloader
 *
 * Downloads resources from external URLs for upload to CMS.
 * Handles parallel downloads with proper error handling and retry logic.
 */

import type { ParsedResource } from '@/types/parser';
import type { DownloadResult } from './types';
import { logger } from '@/utils/logger';
import { extractFilename, sanitizeFilename } from './file-converter';

/**
 * Download options
 */
export interface DownloadOptions {
  /** Maximum retries for failed downloads */
  maxRetries?: number;

  /** Retry delay in milliseconds */
  retryDelay?: number;

  /** Download timeout in milliseconds */
  timeout?: number;

  /** Maximum concurrent downloads */
  maxConcurrent?: number;

  /** User agent string for requests */
  userAgent?: string;
}

/**
 * Default download options
 */
const DEFAULT_OPTIONS: Required<DownloadOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  maxConcurrent: 5,
  userAgent: 'Living-with-the-Rebbe/1.0',
};

/**
 * Download a single resource from its URL
 *
 * @param resource - Parsed resource to download
 * @param options - Download options
 * @returns Download result with file data
 */
export async function downloadResource(
  resource: ParsedResource,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const url = resource.normalizedUrl;

  logger.info('Downloading resource', {
    url,
    type: resource.type,
    extension: resource.extension,
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await downloadWithTimeout(url, opts.timeout, opts.userAgent);

      logger.info('Resource downloaded successfully', {
        url,
        size: result.data.byteLength,
        mimeType: result.mimeType,
        attempt,
      });

      return {
        resource,
        data: result.data,
        size: result.data.byteLength,
        mimeType: result.mimeType,
        filename: result.filename,
        downloadedAt: new Date(),
      };
    } catch (error: any) {
      lastError = error;
      logger.warn('Download attempt failed', {
        url,
        attempt,
        maxRetries: opts.maxRetries,
        error: error.message,
      });

      // Don't retry on certain errors
      if (error.message.includes('404') || error.message.includes('403')) {
        logger.error('Permanent download error, not retrying', {
          url,
          error: error.message,
        });
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < opts.maxRetries) {
        const delay = opts.retryDelay * attempt;
        logger.debug('Waiting before retry', { url, delay });
        await sleep(delay);
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || 'Unknown download error';
  logger.error('Resource download failed after all retries', {
    url,
    attempts: opts.maxRetries,
    error: errorMessage,
  });

  throw new Error(`Failed to download resource: ${errorMessage}`);
}

/**
 * Download multiple resources in parallel with concurrency control
 *
 * @param resources - Array of parsed resources to download
 * @param options - Download options
 * @returns Array of download results (successful downloads only)
 */
export async function downloadResources(
  resources: ParsedResource[],
  options: DownloadOptions = {}
): Promise<DownloadResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  logger.info('Starting batch download', {
    totalResources: resources.length,
    maxConcurrent: opts.maxConcurrent,
  });

  const results: DownloadResult[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  // Download in batches to limit concurrency
  for (let i = 0; i < resources.length; i += opts.maxConcurrent) {
    const batch = resources.slice(i, i + opts.maxConcurrent);

    logger.debug('Processing download batch', {
      batchNumber: Math.floor(i / opts.maxConcurrent) + 1,
      batchSize: batch.length,
      progress: `${i}/${resources.length}`,
    });

    // Download batch in parallel
    const batchPromises = batch.map(async (resource) => {
      try {
        const result = await downloadResource(resource, options);
        return { success: true, result };
      } catch (error: any) {
        logger.error('Failed to download resource', {
          url: resource.normalizedUrl,
          error: error.message,
        });
        return {
          success: false,
          error: {
            url: resource.normalizedUrl,
            error: error.message,
          },
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Collect successful downloads and errors
    for (const item of batchResults) {
      if (item.success && 'result' in item && item.result) {
        results.push(item.result);
      } else if ('error' in item && item.error) {
        errors.push(item.error);
      }
    }
  }

  logger.info('Batch download complete', {
    totalResources: resources.length,
    successful: results.length,
    failed: errors.length,
  });

  if (errors.length > 0) {
    logger.warn('Some downloads failed', {
      failedUrls: errors.map((e) => e.url),
    });
  }

  return results;
}

/**
 * Download with timeout and proper headers
 */
async function downloadWithTimeout(
  url: string,
  timeout: number,
  userAgent: string
): Promise<{ data: ArrayBuffer; mimeType: string; filename: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get content type
    const mimeType = response.headers.get('content-type') || 'application/octet-stream';

    // Get filename from content-disposition or URL
    let filename = '';
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    if (!filename) {
      filename = extractFilename(url);
    }

    filename = sanitizeFilename(filename);

    // Download file data
    const data = await response.arrayBuffer();

    return { data, mimeType, filename };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`Download timeout after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate URL before download
 */
export function isValidDownloadUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Estimate download time based on file size and connection speed
 */
export function estimateDownloadTime(
  fileSize: number,
  speedBytesPerSecond: number = 1_000_000
): number {
  return Math.ceil((fileSize / speedBytesPerSecond) * 1000); // in milliseconds
}
