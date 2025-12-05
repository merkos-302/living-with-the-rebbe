/**
 * Type definitions for newsletter processing pipeline
 *
 * Defines types for orchestrating the full processing flow:
 * Parse → Download → Upload → Replace
 */

import type { ParsedResource, ParserResult } from '@/types/parser';
import type { DownloadResult } from '@/lib/downloader/types';
import type { UploadResult } from '@/lib/cms/types';
import type { ReplacementResult } from '@/lib/replacer/types';

/**
 * Processing stage in the pipeline
 */
export enum ProcessingStage {
  IDLE = 'idle',
  PARSING = 'parsing',
  DOWNLOADING = 'downloading',
  UPLOADING = 'uploading',
  REPLACING = 'replacing',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

/**
 * Processing progress for UI updates
 */
export interface ProcessingProgress {
  /** Current stage of processing */
  stage: ProcessingStage;

  /** Overall progress percentage (0-100) */
  percentComplete: number;

  /** Resources processed so far */
  processedCount: number;

  /** Total resources to process */
  totalCount: number;

  /** Current resource being processed */
  currentResource?: ParsedResource;

  /** Stage-specific progress (e.g., download progress) */
  stageProgress?: {
    /** Current stage percentage (0-100) */
    percent: number;

    /** Stage-specific message */
    message: string;

    /** Additional stage data */
    data?: unknown;
  };

  /** Elapsed time in milliseconds */
  elapsedTime: number;

  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
}

/**
 * Resource with complete processing information
 */
export interface ProcessedResource {
  /** Original parsed resource */
  original: ParsedResource;

  /** Download result (if successful) */
  download?: DownloadResult;

  /** Upload result (if attempted) */
  upload?: UploadResult;

  /** Processing status */
  status: 'pending' | 'downloading' | 'uploading' | 'completed' | 'failed';

  /** Error information (if failed) */
  error?: {
    stage: ProcessingStage;
    message: string;
    details?: unknown;
  };

  /** Processing timestamps */
  timestamps: {
    started?: Date;
    downloaded?: Date;
    uploaded?: Date;
    completed?: Date;
  };
}

/**
 * Options for the processing pipeline
 */
export interface ProcessingOptions {
  /**
   * Maximum number of concurrent downloads
   * @default 3
   */
  downloadConcurrency?: number;

  /**
   * Maximum number of concurrent uploads
   * @default 2
   */
  uploadConcurrency?: number;

  /**
   * Maximum retry attempts for failed operations
   * @default 3
   */
  maxRetries?: number;

  /**
   * Timeout for downloads in milliseconds
   * @default 30000
   */
  downloadTimeout?: number;

  /**
   * Timeout for uploads in milliseconds
   * @default 60000
   */
  uploadTimeout?: number;

  /**
   * Whether to continue processing if individual resources fail
   * @default true
   */
  continueOnError?: boolean;

  /**
   * Whether to check for duplicate files before uploading
   * @default true
   */
  checkDuplicates?: boolean;

  /**
   * Progress callback for UI updates
   */
  onProgress?: (progress: ProcessingProgress) => void;

  /**
   * Callback when a resource completes processing
   */
  onResourceComplete?: (resource: ProcessedResource) => void;

  /**
   * Callback when a resource fails
   */
  onResourceFail?: (resource: ProcessedResource) => void;

  /**
   * Callback when a stage starts
   */
  onStageStart?: (stage: ProcessingStage) => void;

  /**
   * Callback when a stage completes
   */
  onStageComplete?: (stage: ProcessingStage) => void;
}

/**
 * Statistics for the entire processing operation
 */
export interface ProcessingStatistics {
  /** Total resources found in HTML */
  totalResources: number;

  /** Resources successfully processed */
  successful: number;

  /** Resources that failed processing */
  failed: number;

  /** Resources skipped (duplicates, etc.) */
  skipped: number;

  /** Total bytes downloaded */
  totalBytesDownloaded: number;

  /** Total bytes uploaded */
  totalBytesUploaded: number;

  /** Time spent in each stage (milliseconds) */
  stageTimes: {
    parsing: number;
    downloading: number;
    uploading: number;
    replacing: number;
  };

  /** Total processing time (milliseconds) */
  totalTime: number;

  /** Average processing time per resource (milliseconds) */
  averageTimePerResource: number;

  /** Breakdown by resource type */
  byType: {
    pdf: { total: number; successful: number; failed: number };
    image: { total: number; successful: number; failed: number };
    document: { total: number; successful: number; failed: number };
    unknown: { total: number; successful: number; failed: number };
  };
}

/**
 * Complete result of newsletter processing
 */
export interface ProcessingResult {
  /** Processing success status */
  success: boolean;

  /** Original HTML input */
  originalHtml: string;

  /** Processed HTML with replaced URLs */
  processedHtml: string;

  /** All processed resources with full details */
  resources: ProcessedResource[];

  /** URL mappings used for replacement */
  urlMappings: Map<string, string>;

  /** Parser result from initial parsing */
  parserResult: ParserResult;

  /** Replacement result from final stage */
  replacementResult: ReplacementResult;

  /** Processing statistics */
  statistics: ProcessingStatistics;

  /** All errors encountered during processing */
  errors: ProcessingError[];

  /** All warnings from all stages */
  warnings: ProcessingWarning[];

  /** Processing metadata */
  metadata: {
    /** When processing started */
    startedAt: Date;

    /** When processing completed */
    completedAt: Date;

    /** Total processing time in milliseconds */
    processingTime: number;

    /** Options used for processing */
    options: ProcessingOptions;
  };
}

/**
 * Error encountered during processing
 */
export interface ProcessingError {
  /** Error message */
  message: string;

  /** Stage where error occurred */
  stage: ProcessingStage;

  /** Error type */
  type:
    | 'parsing'
    | 'download'
    | 'upload'
    | 'replacement'
    | 'validation'
    | 'network'
    | 'timeout'
    | 'unknown';

  /** Resource that caused the error (if applicable) */
  resource?: ParsedResource;

  /** Original error details */
  details?: unknown;

  /** Whether processing can continue */
  recoverable: boolean;

  /** Timestamp when error occurred */
  timestamp: Date;
}

/**
 * Warning encountered during processing
 */
export interface ProcessingWarning {
  /** Warning message */
  message: string;

  /** Stage where warning occurred */
  stage: ProcessingStage;

  /** Warning type */
  type: 'duplicate' | 'skipped' | 'partial' | 'validation' | 'performance';

  /** Resource related to warning (if applicable) */
  resource?: ParsedResource;

  /** Additional context */
  context?: unknown;
}

/**
 * Stage completion result
 */
export interface StageResult<T = unknown> {
  /** Stage that was executed */
  stage: ProcessingStage;

  /** Whether stage completed successfully */
  success: boolean;

  /** Stage execution time (milliseconds) */
  duration: number;

  /** Stage-specific data */
  data?: T;

  /** Errors from this stage */
  errors: ProcessingError[];

  /** Warnings from this stage */
  warnings: ProcessingWarning[];
}

/**
 * Internal pipeline state
 */
export interface PipelineState {
  /** Current stage */
  currentStage: ProcessingStage;

  /** Start time */
  startTime: number;

  /** Stage start times */
  stageTimes: Map<ProcessingStage, number>;

  /** Processed resources */
  resources: ProcessedResource[];

  /** Accumulated errors */
  errors: ProcessingError[];

  /** Accumulated warnings */
  warnings: ProcessingWarning[];

  /** Download results */
  downloadResults: Map<string, DownloadResult>;

  /** Upload results */
  uploadResults: Map<string, UploadResult>;

  /** Whether processing should stop */
  shouldStop: boolean;
}
