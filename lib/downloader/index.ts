/**
 * Resource Downloader Module
 *
 * Public API for downloading resources from external URLs.
 *
 * @module lib/downloader
 */

export { downloadResource, downloadResources, downloadFromUrl } from './resource-downloader';

export type {
  DownloadResult,
  BatchDownloadResult,
  DownloadOptions,
  DownloadFailure,
  DownloadProgress,
  RetryConfig,
} from './types';

export { DownloadError } from './types';
