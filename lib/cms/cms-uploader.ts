/**
 * CMS Uploader
 *
 * Uploads resources to ChabadUniverse CMS using Valu API v1.1.1 Service Intents.
 * Handles file upload, deduplication, retry logic, and public URL generation.
 */

import type { ValuApi } from '@arkeytyp/valu-api';
import type {
  DownloadResult,
  UploadResult,
  BatchUploadResult,
  UploadOptions,
  UploadError,
  ValuResourceUploadResponse,
  ValuResourceSearchResponse,
  ValuPublicUrlResponse,
  FileMetadata,
} from './types';
import { arrayBufferToFile, filesToFileList, validateFile } from './file-converter';
import { logger } from '@/utils/logger';

// Import Intent class from Valu API
// Note: Valu API v1.1.1 exports Intent as a named export
import { Intent } from '@arkeytyp/valu-api';

/**
 * Default upload options
 */
const DEFAULT_OPTIONS: Required<UploadOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 60000,
  checkDuplicates: true,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  continueOnError: true,
};

/**
 * Upload a single downloaded resource to CMS
 *
 * @param download - Downloaded resource with file data
 * @param valuApi - Valu API instance
 * @param options - Upload options
 * @returns Upload result with CMS URL
 */
export async function uploadToCMS(
  download: DownloadResult,
  valuApi: ValuApi,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  logger.info('Starting CMS upload', {
    url: download.resource.normalizedUrl,
    filename: download.filename,
    size: download.size,
    mimeType: download.mimeType,
  });

  try {
    // Convert ArrayBuffer to File
    const file = arrayBufferToFile(download.data, download.filename, download.mimeType);

    // Validate file
    const validation = validateFile(file, opts.maxFileSize);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check for duplicates if enabled
    let existingResource: { id: string; url?: string } | null = null;
    if (opts.checkDuplicates) {
      existingResource = await findExistingResource(valuApi, {
        filename: download.filename,
        size: download.size,
        mimeType: download.mimeType,
      });

      if (existingResource) {
        logger.info('Found existing resource, using it instead', {
          resourceId: existingResource.id,
          filename: download.filename,
        });

        // Get public URL for existing resource
        const publicUrl = await generatePublicUrl(valuApi, existingResource.id);

        return {
          success: true,
          resource: download.resource,
          resourceId: existingResource.id,
          originalUrl: download.resource.normalizedUrl,
          cmsUrl: publicUrl,
          isDuplicate: true,
          fileSize: download.size,
          uploadedAt: new Date(),
        };
      }
    }

    // Upload file with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        const uploadResult = await uploadFileWithTimeout(valuApi, file, opts.timeout);

        // Log the response for debugging
        logger.debug('[CMS Upload] Valu API response received', {
          filename: download.filename,
          attempt,
          resultKeys: uploadResult ? Object.keys(uploadResult) : [],
        });

        // Valu API returns { resolved: [...], rejected: [...] } format
        // Extract the uploaded resource from the resolved array
        const resolvedResource = uploadResult?.resolved?.[0];
        const rejectedResource = uploadResult?.rejected?.[0];

        if (rejectedResource) {
          throw new Error(`Upload rejected: ${JSON.stringify(rejectedResource)}`);
        }

        if (!resolvedResource || !resolvedResource.id) {
          // Fallback: check old format just in case
          if (uploadResult?.data?.resources?.[0]) {
            const resource = uploadResult.data.resources[0];
            const publicUrl = await generatePublicUrl(valuApi, resource.id);
            return {
              success: true,
              resource: download.resource,
              resourceId: resource.id,
              originalUrl: download.resource.normalizedUrl,
              cmsUrl: publicUrl,
              thumbnailUrl: resource.thumbnailUrl || null,
              fileSize: resource.size || download.size,
              uploadedAt: new Date(),
              isDuplicate: false,
            };
          }
          throw new Error(uploadResult?.error || 'Upload failed - no resource returned');
        }

        // Successfully got a resolved resource
        const resourceId = resolvedResource.uuid || resolvedResource.id;
        const metadata = resolvedResource.metadata || {};

        logger.info('File uploaded successfully', {
          resourceId,
          filename: metadata.fileName || download.filename,
          size: metadata.fileSize || download.size,
          attempt,
          duration: Date.now() - startTime,
        });

        // Generate public URL using the resource ID
        const publicUrl = await generatePublicUrl(valuApi, resourceId);

        return {
          success: true,
          resource: download.resource,
          resourceId,
          originalUrl: download.resource.normalizedUrl,
          cmsUrl: publicUrl,
          thumbnailUrl: resolvedResource.thumbnail || null,
          fileSize: metadata.fileSize || download.size,
          uploadedAt: new Date(),
          isDuplicate: false,
        };
      } catch (error: any) {
        lastError = error;
        logger.warn('Upload attempt failed', {
          filename: download.filename,
          attempt,
          maxRetries: opts.maxRetries,
          error: error.message,
        });

        // Wait before retrying (exponential backoff)
        if (attempt < opts.maxRetries) {
          const delay = opts.retryDelay * attempt;
          logger.debug('Waiting before retry', { delay });
          await sleep(delay);
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Upload failed after all retries');
  } catch (error: any) {
    logger.error('CMS upload failed', {
      url: download.resource.normalizedUrl,
      filename: download.filename,
      error: error.message,
      duration: Date.now() - startTime,
    });

    return {
      success: false,
      resource: download.resource,
      resourceId: null,
      originalUrl: download.resource.normalizedUrl,
      cmsUrl: null,
      error: error.message,
      fileSize: download.size,
      uploadedAt: new Date(),
    };
  }
}

/**
 * Upload multiple resources to CMS in sequence
 *
 * @param downloads - Array of downloaded resources
 * @param valuApi - Valu API instance
 * @param options - Upload options
 * @returns Batch upload result with URL mappings
 */
export async function uploadResources(
  downloads: DownloadResult[],
  valuApi: ValuApi,
  options: UploadOptions = {}
): Promise<BatchUploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  logger.info('Starting batch upload', {
    totalResources: downloads.length,
    checkDuplicates: opts.checkDuplicates,
    continueOnError: opts.continueOnError,
  });

  const results: UploadResult[] = [];
  const errors: UploadError[] = [];
  const urlMappings: Record<string, string> = {};

  // Upload sequentially to avoid overwhelming the API
  for (let i = 0; i < downloads.length; i++) {
    const download = downloads[i];

    logger.debug('Processing upload', {
      progress: `${i + 1}/${downloads.length}`,
      filename: download?.filename,
    });

    try {
      if (download) {
        const result = await uploadToCMS(download, valuApi, options);
        results.push(result);

        // Add to URL mappings if successful
        if (result.success && result.cmsUrl) {
          urlMappings[result.originalUrl] = result.cmsUrl;
        } else if (!opts.continueOnError) {
          throw new Error(result.error || 'Upload failed');
        }

        if (!result.success) {
          errors.push({
            url: result.originalUrl,
            message: result.error || 'Upload failed',
            type: 'upload',
          });
        }
      }
    } catch (error: any) {
      if (download) {
        logger.error('Failed to upload resource', {
          url: download.resource.normalizedUrl,
          error: error.message,
        });

        errors.push({
          url: download.resource.normalizedUrl,
          message: error.message,
          type: 'upload',
        });

        // Add failed result
        results.push({
          success: false,
          resource: download.resource,
          resourceId: null,
          originalUrl: download.resource.normalizedUrl,
          cmsUrl: null,
          error: error.message,
          uploadedAt: new Date(),
        });
      }

      if (!opts.continueOnError) {
        logger.error('Stopping batch upload due to error', {
          processed: i + 1,
          total: downloads.length,
        });
        break;
      }
    }
  }

  const processingTime = Date.now() - startTime;

  // Calculate summary statistics
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const duplicates = results.filter((r) => r.isDuplicate).length;
  const totalBytes = results.reduce((sum, r) => sum + (r.fileSize || 0), 0);

  logger.info('Batch upload complete', {
    total: results.length,
    successful,
    failed,
    duplicates,
    totalBytes,
    processingTime,
  });

  return {
    results,
    urlMappings,
    summary: {
      total: results.length,
      successful,
      failed,
      duplicates,
      totalBytes,
    },
    processingTime,
    errors,
  };
}

/**
 * Upload file using Valu Service Intent with timeout
 */
async function uploadFileWithTimeout(
  valuApi: ValuApi,
  file: File,
  timeout: number
): Promise<ValuResourceUploadResponse> {
  logger.debug('Uploading file via Valu Service Intent', {
    filename: file.name,
    size: file.size,
    type: file.type,
    timeout,
  });

  // Create FileList for upload
  const fileList = filesToFileList([file]);

  // Create upload intent
  const intent = new Intent('ApplicationStorage', 'resource-upload', {
    files: fileList,
  });

  // Upload with timeout
  const uploadPromise = valuApi.callService(intent);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Upload timeout')), timeout)
  );

  const result = await Promise.race([uploadPromise, timeoutPromise]);

  logger.debug('Upload intent result', { result });

  return result as ValuResourceUploadResponse;
}

/**
 * Find existing resource by metadata to avoid duplicates
 */
async function findExistingResource(
  valuApi: ValuApi,
  metadata: FileMetadata
): Promise<{ id: string; url?: string } | null> {
  logger.debug('Searching for existing resource', metadata as any);

  try {
    // Create search intent
    const intent = new Intent('ApplicationStorage', 'resource-search', {
      size: 50, // Max results
    });

    const result = (await valuApi.callService(intent)) as ValuResourceSearchResponse;

    if (!result.success || !result.data?.resources) {
      logger.debug('No resources found in search');
      return null;
    }

    // Find resource with matching filename and size
    const match = result.data.resources.find(
      (resource) =>
        resource.name === metadata.filename &&
        resource.size === metadata.size &&
        resource.mimeType === metadata.mimeType
    );

    if (match) {
      logger.debug('Found matching resource', {
        id: match.id,
        name: match.name,
      });
      return { id: match.id, url: match.url };
    }

    logger.debug('No matching resource found');
    return null;
  } catch (error: any) {
    logger.warn('Resource search failed', { error: error.message });
    return null;
  }
}

/**
 * Generate public URL for a resource using Valu Service Intent
 */
async function generatePublicUrl(valuApi: ValuApi, resourceId: string): Promise<string> {
  logger.debug('Generating public URL for resource', { resourceId });

  try {
    // Create public URL intent
    const intent = new Intent('Resources', 'generate-public-url', {
      resourceId,
    });

    const result = await valuApi.callService(intent);

    logger.debug('[CMS Upload] generate-public-url response', {
      resourceId,
      resultType: typeof result,
      result: typeof result === 'string' ? result : JSON.stringify(result),
    });

    // Valu API returns URL directly as a string
    if (typeof result === 'string' && result.startsWith('http')) {
      logger.debug('Public URL generated (string format)', { resourceId, publicUrl: result });
      return result;
    }

    // Fallback: check object format (legacy or alternative response)
    const typedResult = result as ValuPublicUrlResponse;
    if (typedResult?.data?.publicUrl || typedResult?.data?.url) {
      const publicUrl = typedResult.data.publicUrl || typedResult.data.url;
      logger.debug('Public URL generated (object format)', { resourceId, publicUrl });
      return publicUrl!;
    }

    // If result looks like a URL object with success field
    if (typedResult?.success && typeof typedResult === 'object') {
      throw new Error('No public URL in response object');
    }

    throw new Error(`Unexpected response format: ${typeof result}`);
  } catch (error: any) {
    logger.error('Failed to generate public URL', {
      resourceId,
      error: error.message,
    });

    // Fallback to a constructed URL if generation fails
    // Uses the Roomful API pattern that Valu returns
    const fallbackUrl = `https://api.roomful.net/api/v0/resource/${resourceId}`;
    logger.warn('Using fallback URL', { resourceId, fallbackUrl });
    return fallbackUrl;
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate Valu API is available and ready
 */
export function validateValuApi(valuApi: ValuApi | null): void {
  if (!valuApi) {
    throw new Error('Valu API instance is required');
  }

  // Check if API has required methods
  if (typeof valuApi.callService !== 'function') {
    throw new Error('Valu API does not have callService method');
  }

  logger.debug('Valu API validation passed');
}

/**
 * Get upload progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Format upload statistics for display
 */
export function formatUploadStats(result: BatchUploadResult): string {
  const { summary, processingTime } = result;
  const successRate = summary.total > 0 ? (summary.successful / summary.total) * 100 : 0;

  return `Uploaded ${summary.successful}/${summary.total} resources (${successRate.toFixed(1)}%) in ${(processingTime / 1000).toFixed(2)}s`;
}
