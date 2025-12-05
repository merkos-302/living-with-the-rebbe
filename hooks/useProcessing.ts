/**
 * useProcessing Hook
 *
 * Comprehensive hook for managing newsletter processing state and coordinating
 * the full pipeline: Parse → Download → Upload → Replace
 *
 * Features:
 * - Server-side parsing and downloading via API route
 * - Client-side upload to Valu CMS via Valu API
 * - Client-side URL replacement in HTML
 * - Real-time progress tracking for all stages
 * - Error handling with recovery options
 * - Cancellation support
 * - Performance monitoring
 *
 * @example
 * ```typescript
 * const { api } = useValuApi();
 * const {
 *   stage,
 *   progress,
 *   isProcessing,
 *   result,
 *   error,
 *   processNewsletter,
 *   reset,
 *   cancel
 * } = useProcessing(api);
 *
 * // Process newsletter
 * const result = await processNewsletter(html, baseUrl);
 * console.log(result.processedHtml);
 * console.log(result.statistics);
 * ```
 */

'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import type { ValuApi } from '@arkeytyp/valu-api';
import {
  ProcessingStage,
  type ProcessingResult,
  type ProcessedResource,
  type ProcessingStatistics,
  type ProcessingError,
  type ProcessingWarning,
} from '@/lib/processor/types';
import { ResourceType, type ParsedResource, type ParserResult } from '@/types/parser';
import type { BatchUploadResult, DownloadResult as CmsDownloadResult } from '@/lib/cms/types';
import { uploadResources } from '@/lib/cms';
import { replaceUrls, type ReplacementResult } from '@/lib/replacer';
import { logger } from '@/utils/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Hook state
 */
interface ProcessingState {
  /** Current processing stage */
  stage: ProcessingStage;

  /** Progress percentage (0-100) */
  progress: number;

  /** Whether processing is active */
  isProcessing: boolean;

  /** Error message (if any) */
  error: string | null;

  /** Complete processing result (when done) */
  result: ProcessingResult | null;

  /** Processing start time */
  startTime: number | null;

  /** Processed resources with full details */
  resources: ProcessedResource[];

  /** Accumulated errors */
  errors: ProcessingError[];

  /** Accumulated warnings */
  warnings: ProcessingWarning[];
}

/**
 * Hook return interface
 */
export interface UseProcessingReturn {
  // State
  stage: ProcessingStage;
  progress: number;
  isProcessing: boolean;
  error: string | null;
  result: ProcessingResult | null;

  // Actions
  processNewsletter: (html: string, baseUrl?: string) => Promise<ProcessingResult | null>;
  reset: () => void;
  cancel: () => void;
}

/**
 * API response from /api/process endpoint
 */
interface ProcessApiResponse {
  success: boolean;
  data?: {
    resources: ParsedResource[];
    downloads: Array<{
      url: string;
      data: string; // base64 encoded
      filename: string;
      mimeType: string;
      size: number;
    }>;
    errors: Array<{
      url: string;
      error: string;
    }>;
  };
  error?: string;
  details?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Calculate overall progress based on stage and stage progress
 */
function calculateOverallProgress(
  stage: ProcessingStage,
  stageProgress: number,
  totalResources: number,
  processedCount: number
): number {
  // Stage weights (total = 100)
  const weights = {
    [ProcessingStage.IDLE]: 0,
    [ProcessingStage.PARSING]: 15, // 0-15%
    [ProcessingStage.DOWNLOADING]: 30, // 15-45%
    [ProcessingStage.UPLOADING]: 40, // 45-85%
    [ProcessingStage.REPLACING]: 15, // 85-100%
    [ProcessingStage.COMPLETE]: 0,
    [ProcessingStage.FAILED]: 0,
  };

  // Base progress for completed stages
  const baseProgress = {
    [ProcessingStage.IDLE]: 0,
    [ProcessingStage.PARSING]: 0,
    [ProcessingStage.DOWNLOADING]: 15,
    [ProcessingStage.UPLOADING]: 45,
    [ProcessingStage.REPLACING]: 85,
    [ProcessingStage.COMPLETE]: 100,
    [ProcessingStage.FAILED]: 0,
  };

  if (stage === ProcessingStage.IDLE) return 0;
  if (stage === ProcessingStage.COMPLETE) return 100;
  if (stage === ProcessingStage.FAILED) return 0;

  const base = baseProgress[stage];
  const weight = weights[stage];

  // For stages with resources, use processedCount
  if (
    totalResources > 0 &&
    (stage === ProcessingStage.UPLOADING || stage === ProcessingStage.DOWNLOADING)
  ) {
    const resourceProgress = (processedCount / totalResources) * 100;
    return Math.min(100, base + (weight * resourceProgress) / 100);
  }

  // Otherwise use stageProgress
  return Math.min(100, base + (weight * stageProgress) / 100);
}

/**
 * Calculate processing statistics
 */
function calculateStatistics(
  resources: ProcessedResource[],
  startTime: number,
  stageTimes: Map<ProcessingStage, number>
): ProcessingStatistics {
  const endTime = Date.now();
  const totalTime = endTime - startTime;

  const successful = resources.filter((r) => r.status === 'completed').length;
  const failed = resources.filter((r) => r.status === 'failed').length;
  const skipped = resources.filter((r) => r.upload?.isDuplicate).length;

  const totalBytesDownloaded = resources.reduce((sum, r) => sum + (r.download?.size || 0), 0);
  const totalBytesUploaded = resources.reduce((sum, r) => sum + (r.upload?.fileSize || 0), 0);

  // Group by type
  const byType = {
    pdf: { total: 0, successful: 0, failed: 0 },
    image: { total: 0, successful: 0, failed: 0 },
    document: { total: 0, successful: 0, failed: 0 },
    unknown: { total: 0, successful: 0, failed: 0 },
  };

  resources.forEach((resource) => {
    const type = resource.original.type;
    const category =
      type === 'pdf'
        ? 'pdf'
        : type === 'image'
          ? 'image'
          : type === 'document'
            ? 'document'
            : 'unknown';

    byType[category].total++;
    if (resource.status === 'completed') {
      byType[category].successful++;
    } else if (resource.status === 'failed') {
      byType[category].failed++;
    }
  });

  return {
    totalResources: resources.length,
    successful,
    failed,
    skipped,
    totalBytesDownloaded,
    totalBytesUploaded,
    stageTimes: {
      parsing: stageTimes.get(ProcessingStage.PARSING) || 0,
      downloading: stageTimes.get(ProcessingStage.DOWNLOADING) || 0,
      uploading: stageTimes.get(ProcessingStage.UPLOADING) || 0,
      replacing: stageTimes.get(ProcessingStage.REPLACING) || 0,
    },
    totalTime,
    averageTimePerResource: resources.length > 0 ? totalTime / resources.length : 0,
    byType,
  };
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useProcessing Hook
 *
 * Manages newsletter processing state and orchestrates the pipeline
 */
export function useProcessing(valuApi: ValuApi | null): UseProcessingReturn {
  // State
  const [state, setState] = useState<ProcessingState>({
    stage: ProcessingStage.IDLE,
    progress: 0,
    isProcessing: false,
    error: null,
    result: null,
    startTime: null,
    resources: [],
    errors: [],
    warnings: [],
  });

  // Refs for cancellation and timing
  const abortControllerRef = useRef<AbortController | null>(null);
  const stageTimesRef = useRef<Map<ProcessingStage, number>>(new Map());
  const stageStartTimeRef = useRef<number>(0);

  /**
   * Update progress with automatic overall calculation
   */
  const updateProgress = useCallback((updates: Partial<ProcessingState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };

      // Auto-calculate overall progress if stage changed
      if (updates.stage !== undefined && updates.stage !== prev.stage) {
        const processedCount = newState.resources.filter(
          (r) => r.status === 'completed' || r.status === 'failed'
        ).length;
        const totalCount = newState.resources.length || 1;

        newState.progress = calculateOverallProgress(newState.stage, 0, totalCount, processedCount);

        // Record stage timing
        if (prev.stage !== ProcessingStage.PARSING) {
          const stageTime = Date.now() - stageStartTimeRef.current;
          stageTimesRef.current.set(prev.stage, stageTime);
        }
        stageStartTimeRef.current = Date.now();
      }

      return newState;
    });
  }, []);

  /**
   * Stage 1: Parse and Download via API route
   */
  const parseAndDownload = useCallback(
    async (
      html: string,
      baseUrl?: string
    ): Promise<{ resources: ParsedResource[]; downloads: CmsDownloadResult[] }> => {
      logger.info('Stage 1: Parsing and downloading resources', {
        htmlLength: html.length,
        baseUrl,
      });

      updateProgress({ stage: ProcessingStage.PARSING });

      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html, baseUrl }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const apiResponse: ProcessApiResponse = await response.json();

        if (!apiResponse.success || !apiResponse.data) {
          throw new Error(
            apiResponse.error || apiResponse.details || 'Failed to parse and download resources'
          );
        }

        const { resources, downloads, errors } = apiResponse.data;

        // Log any download errors
        if (errors.length > 0) {
          logger.warn('Some resources failed to download', {
            errorCount: errors.length,
            errors: errors.map((e) => `${e.url}: ${e.error}`),
          });
        }

        // Convert base64-encoded downloads to CmsDownloadResult format
        const cmsDownloads: CmsDownloadResult[] = downloads.map((download) => {
          // Find the matching parsed resource
          const resource = resources.find((r) => r.normalizedUrl === download.url);
          if (!resource) {
            throw new Error(`Could not find parsed resource for ${download.url}`);
          }

          return {
            resource,
            data: base64ToArrayBuffer(download.data),
            size: download.size,
            mimeType: download.mimeType,
            filename: download.filename,
            downloadedAt: new Date(),
          };
        });

        logger.info('Parse and download complete', {
          resourceCount: resources.length,
          downloadCount: cmsDownloads.length,
          errorCount: errors.length,
        });

        return {
          resources,
          downloads: cmsDownloads,
        };
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Processing cancelled');
        }
        logger.error('Parse and download failed', error);
        throw error;
      }
    },
    [updateProgress]
  );

  /**
   * Stage 2: Upload to Valu CMS
   */
  const uploadToCMS = useCallback(
    async (downloads: CmsDownloadResult[]): Promise<BatchUploadResult> => {
      logger.info('Stage 2: Uploading to CMS', {
        downloadCount: downloads.length,
      });

      updateProgress({ stage: ProcessingStage.UPLOADING });

      if (!valuApi) {
        throw new Error('Valu API not available');
      }

      try {
        const result = await uploadResources(downloads, valuApi, {
          checkDuplicates: true,
          continueOnError: true,
          maxRetries: 3,
        });

        logger.info('CMS upload complete', {
          successful: result.summary.successful,
          failed: result.summary.failed,
          duplicates: result.summary.duplicates,
        });

        return result;
      } catch (error: any) {
        logger.error('CMS upload failed', error);
        throw error;
      }
    },
    [valuApi, updateProgress, state.resources]
  );

  /**
   * Stage 3: Replace URLs in HTML
   */
  const replaceUrlsInHtml = useCallback(
    async (html: string, urlMappings: Record<string, string>): Promise<ReplacementResult> => {
      logger.info('Stage 3: Replacing URLs in HTML', {
        mappingCount: Object.keys(urlMappings).length,
      });

      updateProgress({ stage: ProcessingStage.REPLACING });

      try {
        // Convert object to Map
        const urlMap = new Map(Object.entries(urlMappings));

        const result = replaceUrls(html, urlMap, {
          normalizeUrls: true,
          preserveFormatting: true,
        });

        logger.info('URL replacement complete', {
          replacementCount: result.replacementCount,
          unreplacedCount: result.unreplacedUrls.length,
        });

        return result;
      } catch (error: any) {
        logger.error('URL replacement failed', error);
        throw error;
      }
    },
    [updateProgress]
  );

  /**
   * Main processing function
   */
  const processNewsletter = useCallback(
    async (html: string, baseUrl?: string): Promise<ProcessingResult | null> => {
      logger.info('Starting newsletter processing', {
        htmlLength: html.length,
        baseUrl,
      });

      // Reset state
      setState({
        stage: ProcessingStage.PARSING,
        progress: 0,
        isProcessing: true,
        error: null,
        result: null,
        startTime: Date.now(),
        resources: [],
        errors: [],
        warnings: [],
      });

      // Create abort controller
      abortControllerRef.current = new AbortController();
      stageTimesRef.current = new Map();
      stageStartTimeRef.current = Date.now();

      try {
        // Stage 1: Parse and Download
        const { resources, downloads } = await parseAndDownload(html, baseUrl);

        // Build ParserResult for final result
        const parserResult: ParserResult = {
          resources,
          byType: {
            [ResourceType.PDF]: resources.filter((r) => r.type === ResourceType.PDF),
            [ResourceType.IMAGE]: resources.filter((r) => r.type === ResourceType.IMAGE),
            [ResourceType.DOCUMENT]: resources.filter((r) => r.type === ResourceType.DOCUMENT),
            [ResourceType.UNKNOWN]: resources.filter((r) => r.type === ResourceType.UNKNOWN),
          },
          summary: {
            totalResources: resources.length,
            externalResources: resources.filter((r) => r.isExternal).length,
            byType: resources.reduce(
              (acc, r) => {
                acc[r.type as ResourceType] = (acc[r.type as ResourceType] || 0) + 1;
                return acc;
              },
              {
                [ResourceType.PDF]: 0,
                [ResourceType.IMAGE]: 0,
                [ResourceType.DOCUMENT]: 0,
                [ResourceType.UNKNOWN]: 0,
              } as { [key in ResourceType]: number }
            ),
          },
          metadata: {
            parseTime: 0, // Server-side parsing time not available
            htmlLength: html.length,
            options: {
              baseUrl,
              externalOnly: true,
              includeBackgrounds: true,
              maxUrlLength: 2048,
            },
          },
          errors: [],
        };

        // Initialize resource tracking
        const initialResources: ProcessedResource[] = downloads.map((download) => ({
          original: download.resource,
          download: {
            buffer: download.data,
            originalResource: download.resource,
            filename: download.filename,
            mimeType: download.mimeType,
            size: download.size,
            downloadTime: 0,
            downloadedAt: download.downloadedAt,
          },
          status: 'pending',
          timestamps: {
            started: new Date(),
            downloaded: download.downloadedAt,
          },
        }));

        setState((prev) => ({
          ...prev,
          resources: initialResources,
        }));

        // Stage 2: Upload to CMS
        const uploadResult = await uploadToCMS(downloads);

        // Update resources with upload results
        const uploadedResources: ProcessedResource[] = initialResources.map((resource) => {
          const upload = uploadResult.results.find((u) => u.originalUrl === resource.original.url);

          return {
            ...resource,
            upload,
            status: upload?.success ? 'completed' : 'failed',
            error: upload?.error
              ? {
                  stage: ProcessingStage.UPLOADING,
                  message: upload.error,
                }
              : undefined,
            timestamps: {
              ...resource.timestamps,
              uploaded: upload?.uploadedAt,
              completed: upload?.success ? new Date() : undefined,
            },
          };
        });

        setState((prev) => ({
          ...prev,
          resources: uploadedResources,
        }));

        // Stage 3: Replace URLs
        const replacementResult = await replaceUrlsInHtml(html, uploadResult.urlMappings);

        // Calculate final statistics
        const statistics = calculateStatistics(
          uploadedResources,
          state.startTime!,
          stageTimesRef.current
        );

        // Build final result
        const result: ProcessingResult = {
          success: uploadResult.summary.failed === 0,
          originalHtml: html,
          processedHtml: replacementResult.html,
          resources: uploadedResources,
          urlMappings: new Map(Object.entries(uploadResult.urlMappings)),
          parserResult, // Use the parserResult we built earlier
          replacementResult,
          statistics,
          errors: uploadResult.errors.map((err) => ({
            message: err.message,
            stage: ProcessingStage.UPLOADING,
            type: err.type as any,
            recoverable: true,
            timestamp: new Date(),
          })),
          warnings: replacementResult.warnings.map((warn) => ({
            message: warn.message,
            stage: ProcessingStage.REPLACING,
            type: warn.type as any,
          })),
          metadata: {
            startedAt: new Date(state.startTime!),
            completedAt: new Date(),
            processingTime: Date.now() - state.startTime!,
            options: {},
          },
        };

        logger.info('Newsletter processing complete', {
          success: result.success,
          resourceCount: result.resources.length,
          processingTime: result.metadata.processingTime,
        });

        setState((prev) => ({
          ...prev,
          stage: ProcessingStage.COMPLETE,
          progress: 100,
          isProcessing: false,
          result,
        }));

        return result;
      } catch (error: any) {
        logger.error('Newsletter processing failed', error);

        setState((prev) => ({
          ...prev,
          stage: ProcessingStage.FAILED,
          isProcessing: false,
          error: error.message || 'Processing failed',
        }));

        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [parseAndDownload, uploadToCMS, replaceUrlsInHtml, state.startTime]
  );

  /**
   * Reset processing state
   */
  const reset = useCallback(() => {
    logger.debug('Resetting processing state');

    setState({
      stage: ProcessingStage.IDLE,
      progress: 0,
      isProcessing: false,
      error: null,
      result: null,
      startTime: null,
      resources: [],
      errors: [],
      warnings: [],
    });

    stageTimesRef.current = new Map();
  }, []);

  /**
   * Cancel active processing
   */
  const cancel = useCallback(() => {
    logger.info('Cancelling newsletter processing');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      stage: ProcessingStage.FAILED,
      isProcessing: false,
      error: 'Processing cancelled by user',
    }));
  }, []);

  // Memoized return object
  const returnValue = useMemo<UseProcessingReturn>(
    () => ({
      stage: state.stage,
      progress: state.progress,
      isProcessing: state.isProcessing,
      error: state.error,
      result: state.result,
      processNewsletter,
      reset,
      cancel,
    }),
    [state, processNewsletter, reset, cancel]
  );

  return returnValue;
}

export default useProcessing;
