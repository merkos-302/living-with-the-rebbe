/**
 * Resource Downloader
 *
 * Downloads resources (PDFs, images, documents) from external URLs with
 * retry logic, concurrency control, and progress tracking.
 */

import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { ParsedResource } from '@/types/parser';
import {
  DownloadResult,
  BatchDownloadResult,
  DownloadOptions,
  DownloadError,
  DownloadFailure,
  DownloadProgress,
  RetryConfig,
} from './types';

/**
 * Default download options
 */
const DEFAULT_OPTIONS: Required<
  Omit<DownloadOptions, 'headers' | 'onProgress' | 'onDownloadComplete' | 'onDownloadFail'>
> = {
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  concurrency: 3,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  calculateHash: false,
};

/**
 * Generates a filename from the resource URL
 */
function generateFilename(resource: ParsedResource): string {
  try {
    // Extract filename from URL
    const url = new URL(resource.normalizedUrl);
    const pathname = url.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    // Remove query parameters from filename
    const cleanFilename = lastSegment?.split('?')[0];

    if (cleanFilename && cleanFilename.length > 0) {
      // Ensure it has the correct extension
      if (!cleanFilename.endsWith(resource.extension) && resource.extension) {
        return `${cleanFilename}${resource.extension}`;
      }
      return cleanFilename;
    }

    // Fallback: generate filename from URL hash
    const urlHash = crypto.createHash('md5').update(resource.normalizedUrl).digest('hex');
    return `resource_${urlHash}${resource.extension}`;
  } catch {
    // If URL parsing fails, use hash-based filename
    const urlHash = crypto.createHash('md5').update(resource.normalizedUrl).digest('hex');
    return `resource_${urlHash}${resource.extension}`;
  }
}

/**
 * Calculates SHA-256 hash of a buffer
 */
function calculateFileHash(buffer: ArrayBuffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}

/**
 * Calculates exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleeps for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  // Network errors are retryable
  if (!error.response) {
    return true;
  }

  // Retry on specific status codes
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  return retryableStatusCodes.includes(error.response.status);
}

/**
 * Creates a DownloadError from an Axios error
 */
function createDownloadError(error: AxiosError, url: string): DownloadError {
  if (error.response) {
    return new DownloadError(
      `Failed to download resource (HTTP ${error.response.status}): ${error.message}`,
      url,
      error.response.status,
      error
    );
  } else if (error.request) {
    if (error.code === 'ECONNABORTED') {
      return new DownloadError(`Download timeout for resource`, url, undefined, error);
    } else if (error.code === 'ENOTFOUND') {
      return new DownloadError(`DNS lookup failed for resource`, url, undefined, error);
    } else if (error.code === 'ECONNREFUSED') {
      return new DownloadError(`Connection refused for resource`, url, undefined, error);
    }
    return new DownloadError(
      `Network error while downloading resource: ${error.message}`,
      url,
      undefined,
      error
    );
  }
  return new DownloadError(`Error downloading resource: ${error.message}`, url, undefined, error);
}

/**
 * Downloads a single resource with retry logic
 *
 * @param resource - The resource to download
 * @param options - Download options
 * @returns Promise resolving to DownloadResult
 * @throws {DownloadError} If download fails after all retries
 */
export async function downloadResource(
  resource: ParsedResource,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const retryConfig: RetryConfig = {
    maxRetries: opts.maxRetries,
    baseDelay: opts.retryDelay,
    maxDelay: 10000,
    backoffFactor: 2,
  };

  let lastError: DownloadError | null = null;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Build axios configuration
      const axiosConfig: AxiosRequestConfig = {
        timeout: opts.timeout,
        responseType: 'arraybuffer',
        maxContentLength: opts.maxFileSize,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; LivingWithRebbe/1.0; +https://chabaduniverse.com)',
          Accept: '*/*',
          ...opts.headers,
        },
        validateStatus: (status) => status >= 200 && status < 300,
      };

      // Download the resource
      const response = await axios.get(resource.normalizedUrl, axiosConfig);

      // Validate response
      if (
        !response.data ||
        !(response.data instanceof ArrayBuffer || Buffer.isBuffer(response.data))
      ) {
        throw new DownloadError(`Invalid response data type for resource`, resource.normalizedUrl);
      }

      // Convert to ArrayBuffer if needed
      let buffer: ArrayBuffer;
      if (Buffer.isBuffer(response.data)) {
        const nodeBuffer = response.data.buffer.slice(
          response.data.byteOffset,
          response.data.byteOffset + response.data.byteLength
        );
        // Ensure we have an ArrayBuffer, not SharedArrayBuffer
        if (nodeBuffer instanceof SharedArrayBuffer) {
          // Convert SharedArrayBuffer to ArrayBuffer
          buffer = new ArrayBuffer(nodeBuffer.byteLength);
          new Uint8Array(buffer).set(new Uint8Array(nodeBuffer));
        } else {
          buffer = nodeBuffer;
        }
      } else {
        buffer = response.data;
      }

      // Get MIME type from response
      const mimeType = response.headers['content-type'] || 'application/octet-stream';

      // Generate filename
      const filename = generateFilename(resource);

      // Calculate hash if requested
      const hash = opts.calculateHash ? calculateFileHash(buffer) : undefined;

      const downloadTime = Date.now() - startTime;

      return {
        buffer,
        originalResource: resource,
        filename,
        mimeType,
        size: buffer.byteLength,
        downloadTime,
        downloadedAt: new Date(),
        hash,
      };
    } catch (error) {
      // Convert to DownloadError
      if (axios.isAxiosError(error)) {
        lastError = createDownloadError(error, resource.normalizedUrl);

        // Check if we should retry
        if (attempt < retryConfig.maxRetries && isRetryableError(error)) {
          const delay = calculateBackoffDelay(attempt, retryConfig);
          console.log(
            `Download attempt ${attempt + 1} failed for ${resource.normalizedUrl}. Retrying in ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }

        // Not retryable or exhausted retries - break out
        break;
      } else if (error instanceof DownloadError) {
        lastError = error;
        break;
      } else {
        lastError = new DownloadError(
          `Unexpected error downloading resource: ${error instanceof Error ? error.message : String(error)}`,
          resource.normalizedUrl,
          undefined,
          error instanceof Error ? error : undefined
        );
        break;
      }
    }
  }

  // All retries exhausted
  throw lastError || new DownloadError('Download failed', resource.normalizedUrl);
}

/**
 * Downloads multiple resources with concurrency control and progress tracking
 *
 * @param resources - Array of resources to download
 * @param options - Download options
 * @returns Promise resolving to BatchDownloadResult with successful and failed downloads
 */
export async function downloadResources(
  resources: ParsedResource[],
  options: DownloadOptions = {}
): Promise<BatchDownloadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const successful: DownloadResult[] = [];
  const failed: DownloadFailure[] = [];
  let totalSize = 0;
  const startTime = Date.now();

  // Progress tracking
  const progress: DownloadProgress = {
    total: resources.length,
    completed: 0,
    successful: 0,
    failed: 0,
    inProgress: 0,
    totalBytes: 0,
    percentComplete: 0,
  };

  // Emit initial progress
  if (opts.onProgress) {
    opts.onProgress({ ...progress });
  }

  // Process resources in batches for concurrency control
  const batches: ParsedResource[][] = [];
  for (let i = 0; i < resources.length; i += opts.concurrency) {
    batches.push(resources.slice(i, i + opts.concurrency));
  }

  // Process each batch
  for (const batch of batches) {
    progress.inProgress = batch.length;

    const promises = batch.map(async (resource) => {
      progress.currentResource = resource;

      try {
        const result = await downloadResource(resource, {
          ...options,
          // Don't pass callbacks to individual downloads
          onProgress: undefined,
          onDownloadComplete: undefined,
          onDownloadFail: undefined,
        });

        successful.push(result);
        totalSize += result.size;
        progress.successful++;
        progress.totalBytes += result.size;

        // Notify completion
        if (opts.onDownloadComplete) {
          opts.onDownloadComplete(result);
        }

        return { success: true, result };
      } catch (error) {
        const failure: DownloadFailure = {
          resource,
          error: error instanceof Error ? error.message : String(error),
          errorCode:
            error instanceof DownloadError && error.originalError
              ? (error.originalError as any).code
              : undefined,
          statusCode: error instanceof DownloadError ? error.statusCode : undefined,
          retryAttempts: opts.maxRetries,
          failedAt: new Date(),
        };

        failed.push(failure);
        progress.failed++;

        // Notify failure
        if (opts.onDownloadFail) {
          opts.onDownloadFail(failure);
        }

        return { success: false, failure };
      }
    });

    // Wait for batch to complete
    await Promise.all(promises);

    // Update progress
    progress.completed += batch.length;
    progress.inProgress = 0;
    progress.percentComplete = Math.round((progress.completed / progress.total) * 100);

    // Emit progress update
    if (opts.onProgress) {
      opts.onProgress({ ...progress });
    }
  }

  const totalTime = Date.now() - startTime;

  return {
    successful,
    failed,
    summary: {
      total: resources.length,
      successful: successful.length,
      failed: failed.length,
      totalSize,
      totalTime,
    },
  };
}

/**
 * Downloads a resource from a URL string (convenience method)
 *
 * @param url - URL to download from
 * @param options - Download options
 * @returns Promise resolving to DownloadResult
 */
export async function downloadFromUrl(
  url: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const { ResourceType } = await import('@/types/parser');

  // Create a minimal ParsedResource from URL
  const resource: ParsedResource = {
    url,
    normalizedUrl: url,
    type: ResourceType.UNKNOWN,
    extension: '',
    element: {
      tag: 'a',
      attribute: 'href',
      outerHTML: '',
    },
    isExternal: true,
  };

  return downloadResource(resource, options);
}
