/**
 * CMS Upload Types
 *
 * Type definitions for uploading resources to ChabadUniverse CMS via Valu API.
 */

import type { ParsedResource } from '@/types/parser';

/**
 * Resource download result
 */
export interface DownloadResult {
  /** The parsed resource metadata */
  resource: ParsedResource;

  /** Downloaded file data as ArrayBuffer */
  data: ArrayBuffer;

  /** File size in bytes */
  size: number;

  /** MIME type of the downloaded file */
  mimeType: string;

  /** Suggested filename for the file */
  filename: string;

  /** Download timestamp */
  downloadedAt: Date;
}

/**
 * Upload result from CMS
 */
export interface UploadResult {
  /** Success status */
  success: boolean;

  /** Original resource that was uploaded */
  resource: ParsedResource;

  /** Valu resource ID */
  resourceId: string | null;

  /** Original URL from the HTML */
  originalUrl: string;

  /** Public CMS URL with auth redirect handling */
  cmsUrl: string | null;

  /** Thumbnail URL (if available) */
  thumbnailUrl?: string | null;

  /** Upload timestamp */
  uploadedAt: Date;

  /** Error message if upload failed */
  error?: string;

  /** Whether this was a deduplicated upload */
  isDuplicate?: boolean;

  /** File size in bytes */
  fileSize?: number;
}

/**
 * Batch upload result with summary
 */
export interface BatchUploadResult {
  /** Individual upload results */
  results: UploadResult[];

  /** URL mappings for HTML replacement */
  urlMappings: Record<string, string>;

  /** Summary statistics */
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
    totalBytes: number;
  };

  /** Processing time in milliseconds */
  processingTime: number;

  /** Any errors encountered */
  errors: UploadError[];
}

/**
 * Upload error with context
 */
export interface UploadError {
  /** Original URL that failed */
  url: string;

  /** Error message */
  message: string;

  /** Error type */
  type: 'download' | 'upload' | 'conversion' | 'validation';

  /** Retry attempt number (if applicable) */
  attempt?: number;

  /** Original error details */
  details?: unknown;
}

/**
 * Upload configuration options
 */
export interface UploadOptions {
  /** Maximum retries for failed uploads */
  maxRetries?: number;

  /** Retry delay in milliseconds (will be multiplied by attempt number) */
  retryDelay?: number;

  /** Upload timeout in milliseconds */
  timeout?: number;

  /** Whether to check for duplicates before uploading */
  checkDuplicates?: boolean;

  /** Maximum file size in bytes (default: 50MB) */
  maxFileSize?: number;

  /** Whether to continue on individual failures */
  continueOnError?: boolean;
}

/**
 * Valu Service Intent response for resource upload
 *
 * Actual format from Valu API: { resolved: [...], rejected: [...] }
 */
export interface ValuResourceUploadResponse {
  /** Successfully uploaded resources */
  resolved?: Array<{
    /** Resource ID (internal) */
    id: string;
    /** Resource UUID (for public URL) */
    uuid: string;
    /** File metadata */
    metadata: {
      fileName: string;
      fileSize: number;
      fileDate: string;
      contentType: string;
      behaviourType?: string;
      link?: string;
      origin?: {
        type?: string;
        device?: string;
        deviceName?: string;
        path?: string;
      };
      geolocation?: {
        latitude?: number;
        longitude?: number;
      };
      dimensions?: {
        width?: number;
        height?: number;
        orientation?: number;
      };
    };
    /** Thumbnail URL (empty string if not available) */
    thumbnail: string;
    /** Upload progress (100 = complete) */
    progressUpload: number;
    /** Status code (4 = complete) */
    status: number;
    /** File object (usually empty after upload) */
    file: object;
  }>;
  /** Rejected/failed uploads */
  rejected?: Array<{
    error?: string;
    [key: string]: unknown;
  }>;
  /** Legacy format support */
  success?: boolean;
  data?: {
    resources?: Array<{
      id: string;
      name: string;
      url?: string;
      thumbnailUrl?: string;
      size?: number;
      mimeType?: string;
    }>;
  };
  error?: string;
}

/**
 * Valu Service Intent response for resource search
 */
export interface ValuResourceSearchResponse {
  success: boolean;
  data?: {
    resources?: Array<{
      id: string;
      name: string;
      url?: string;
      size?: number;
      mimeType?: string;
    }>;
  };
  error?: string;
}

/**
 * Valu Service Intent response for public URL generation
 */
export interface ValuPublicUrlResponse {
  success: boolean;
  data?: {
    publicUrl?: string;
    url?: string;
  };
  error?: string;
}

/**
 * File metadata for deduplication
 */
export interface FileMetadata {
  filename: string;
  size: number;
  mimeType: string;
}
