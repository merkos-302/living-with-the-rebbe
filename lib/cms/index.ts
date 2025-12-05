/**
 * CMS Upload Module
 *
 * Provides functionality for downloading external resources and uploading them
 * to ChabadUniverse CMS via Valu API v1.1.1 Service Intents.
 *
 * Features:
 * - Resource downloading with retry logic and parallel processing
 * - File upload to CMS via Valu Service Intents
 * - Automatic deduplication to avoid re-uploading existing files
 * - Public URL generation with auth redirect handling
 * - Comprehensive error handling and logging
 *
 * @example Basic usage
 * ```typescript
 * import { uploadResources, downloadResources } from '@/lib/cms';
 * import { useValuApi } from '@/hooks/useValuApi';
 *
 * // In your component
 * const { api } = useValuApi();
 *
 * // Download resources
 * const downloads = await downloadResources(parsedResources);
 *
 * // Upload to CMS
 * const result = await uploadResources(downloads, api);
 *
 * // Use URL mappings to replace in HTML
 * const { urlMappings } = result;
 * ```
 *
 * @example With options
 * ```typescript
 * import { uploadResources, downloadResources } from '@/lib/cms';
 *
 * // Download with custom options
 * const downloads = await downloadResources(parsedResources, {
 *   maxConcurrent: 3,
 *   maxRetries: 5,
 *   timeout: 60000,
 * });
 *
 * // Upload with custom options
 * const result = await uploadResources(downloads, api, {
 *   checkDuplicates: true,
 *   continueOnError: true,
 *   maxRetries: 3,
 * });
 * ```
 */

// Core upload functionality
export { uploadToCMS, uploadResources, validateValuApi } from './cms-uploader';

// Resource downloading
export {
  downloadResource,
  downloadResources,
  isValidDownloadUrl,
  estimateDownloadTime,
} from './resource-downloader';

// File conversion utilities
export {
  arrayBufferToFile,
  filesToFileList,
  validateFile,
  formatBytes,
  extractFilename,
  sanitizeFilename,
  makeUniqueFilename,
  blobToArrayBuffer,
  dataUrlToFile,
} from './file-converter';

// Utility functions
export { calculateProgress, formatUploadStats } from './cms-uploader';

// Types
export type {
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

export type { DownloadOptions } from './resource-downloader';
