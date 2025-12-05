/**
 * Resource Downloader Types
 *
 * Type definitions for downloading resources from external URLs.
 */

import { ParsedResource } from '@/types/parser';

/**
 * Result from downloading a single resource
 */
export interface DownloadResult {
  /** Downloaded file data as ArrayBuffer */
  buffer: ArrayBuffer;

  /** Original parsed resource information */
  originalResource: ParsedResource;

  /** Generated filename for the downloaded resource */
  filename: string;

  /** MIME type detected from the response */
  mimeType: string;

  /** Size of the downloaded file in bytes */
  size: number;

  /** Download duration in milliseconds */
  downloadTime: number;

  /** Timestamp when the download completed */
  downloadedAt: Date;

  /** SHA-256 hash of the file content (for integrity) */
  hash?: string;
}

/**
 * Result from downloading multiple resources
 */
export interface BatchDownloadResult {
  /** Successfully downloaded resources */
  successful: DownloadResult[];

  /** Failed downloads with error information */
  failed: DownloadFailure[];

  /** Summary statistics */
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalSize: number;
    totalTime: number;
  };
}

/**
 * Information about a failed download
 */
export interface DownloadFailure {
  /** The resource that failed to download */
  resource: ParsedResource;

  /** Error message */
  error: string;

  /** Error code (if available) */
  errorCode?: string;

  /** HTTP status code (if available) */
  statusCode?: number;

  /** Number of retry attempts made */
  retryAttempts: number;

  /** Timestamp when the failure occurred */
  failedAt: Date;
}

/**
 * Options for downloading resources
 */
export interface DownloadOptions {
  /** Maximum time to wait for a single download in milliseconds (default: 30000) */
  timeout?: number;

  /** Maximum number of retry attempts for failed downloads (default: 3) */
  maxRetries?: number;

  /** Base delay for exponential backoff in milliseconds (default: 1000) */
  retryDelay?: number;

  /** Maximum number of concurrent downloads (default: 3) */
  concurrency?: number;

  /** Maximum file size to download in bytes (default: 50MB) */
  maxFileSize?: number;

  /** Custom headers to include in requests */
  headers?: Record<string, string>;

  /** Whether to calculate SHA-256 hash for downloaded files (default: false) */
  calculateHash?: boolean;

  /** Progress callback for tracking download progress */
  onProgress?: (progress: DownloadProgress) => void;

  /** Callback for individual download completion */
  onDownloadComplete?: (result: DownloadResult) => void;

  /** Callback for individual download failure */
  onDownloadFail?: (failure: DownloadFailure) => void;
}

/**
 * Progress information for batch downloads
 */
export interface DownloadProgress {
  /** Total number of resources to download */
  total: number;

  /** Number of completed downloads (successful + failed) */
  completed: number;

  /** Number of successful downloads */
  successful: number;

  /** Number of failed downloads */
  failed: number;

  /** Number of downloads currently in progress */
  inProgress: number;

  /** Current resource being downloaded (if any) */
  currentResource?: ParsedResource;

  /** Total bytes downloaded so far */
  totalBytes: number;

  /** Percentage complete (0-100) */
  percentComplete: number;
}

/**
 * Error thrown when resource download fails
 */
export class DownloadError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DownloadError';
  }
}

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Base delay in milliseconds */
  baseDelay: number;

  /** Maximum delay in milliseconds */
  maxDelay: number;

  /** Exponential backoff factor */
  backoffFactor: number;
}
