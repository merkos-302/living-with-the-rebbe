/**
 * Newsletter Resource Processor
 *
 * Orchestrates the complete pipeline for processing newsletter HTML:
 * 1. Parse HTML to extract resources
 * 2. Download resources from original URLs
 * 3. Upload resources to CMS
 * 4. Replace original URLs with CMS URLs
 *
 * Provides progress tracking, error handling, and comprehensive statistics.
 */

import type { ValuApi } from '@arkeytyp/valu-api';
import { parseHtml } from '@/lib/parser';
import { downloadResources } from '@/lib/downloader';
import { uploadResources } from '@/lib/cms';
import { replaceUrls } from '@/lib/replacer/url-replacer';
import type { ParsedResource } from '@/types/parser';
import {
  ProcessingStage,
  ProcessingOptions,
  ProcessingResult,
  ProcessingProgress,
  ProcessingError,
  ProcessingStatistics,
  PipelineState,
  StageResult,
} from './types';

/**
 * Default processing options
 */
const DEFAULT_OPTIONS: Required<
  Omit<
    ProcessingOptions,
    'onProgress' | 'onResourceComplete' | 'onResourceFail' | 'onStageStart' | 'onStageComplete'
  >
> = {
  downloadConcurrency: 3,
  uploadConcurrency: 2,
  maxRetries: 3,
  downloadTimeout: 30000,
  uploadTimeout: 60000,
  continueOnError: true,
  checkDuplicates: true,
};

/**
 * Main newsletter processing pipeline
 *
 * @param html - Newsletter HTML to process
 * @param valuApi - Valu API instance for CMS uploads
 * @param options - Processing options
 * @returns Complete processing result with statistics
 *
 * @example
 * ```typescript
 * import { processNewsletter } from '@/lib/processor';
 * import { useValuApi } from '@/hooks/useValuApi';
 *
 * const { api } = useValuApi();
 *
 * const result = await processNewsletter(html, api, {
 *   onProgress: (progress) => {
 *     console.log(`${progress.percentComplete}% complete`);
 *   },
 *   continueOnError: true,
 * });
 *
 * console.log(result.processedHtml); // HTML with CMS URLs
 * console.log(result.statistics.successful); // Number of resources processed
 * ```
 */
export async function processNewsletter(
  html: string,
  valuApi: ValuApi,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  // Initialize pipeline state
  const state: PipelineState = {
    currentStage: ProcessingStage.PARSING,
    startTime,
    stageTimes: new Map(),
    resources: [],
    errors: [],
    warnings: [],
    downloadResults: new Map(),
    uploadResults: new Map(),
    shouldStop: false,
  };

  try {
    // Stage 1: Parse HTML
    const parseResult = await executeStage(
      state,
      ProcessingStage.PARSING,
      async () => await stageParseHtml(html),
      opts
    );

    if (!parseResult.success || state.shouldStop) {
      return buildErrorResult(html, state, startTime, opts);
    }

    const parserResult = parseResult.data!;

    // Initialize processed resources
    state.resources = parserResult.resources.map((resource) => ({
      original: resource,
      status: 'pending' as const,
      timestamps: {},
    }));

    // Notify progress
    notifyProgress(state, opts, state.resources.length, 0);

    // Stage 2: Download resources
    const downloadResult = await executeStage(
      state,
      ProcessingStage.DOWNLOADING,
      async () => await stageDownloadResources(parserResult.resources, state, opts),
      opts
    );

    if (!downloadResult.success || state.shouldStop) {
      return buildErrorResult(html, state, startTime, opts, parserResult);
    }

    // Stage 3: Upload to CMS
    const uploadResult = await executeStage(
      state,
      ProcessingStage.UPLOADING,
      async () => await stageUploadResources(valuApi, state, opts),
      opts
    );

    if (!uploadResult.success || state.shouldStop) {
      return buildErrorResult(html, state, startTime, opts, parserResult);
    }

    // Stage 4: Replace URLs
    const replacementResult = await executeStage(
      state,
      ProcessingStage.REPLACING,
      async () => await stageReplaceUrls(html, state, opts),
      opts
    );

    if (!replacementResult.success || state.shouldStop) {
      return buildErrorResult(html, state, startTime, opts, parserResult);
    }

    // Build final result
    const result = buildSuccessResult(
      html,
      replacementResult.data!,
      parserResult,
      state,
      startTime,
      opts
    );

    // Final progress notification
    state.currentStage = ProcessingStage.COMPLETE;
    notifyProgress(state, opts, state.resources.length, state.resources.length);

    return result;
  } catch (error) {
    // Unexpected error
    state.errors.push({
      message: error instanceof Error ? error.message : 'Unknown processing error',
      stage: state.currentStage,
      type: 'unknown',
      recoverable: false,
      timestamp: new Date(),
      details: error,
    });

    state.currentStage = ProcessingStage.FAILED;
    return buildErrorResult(html, state, startTime, opts);
  }
}

/**
 * Stage 1: Parse HTML to extract resources
 */
async function stageParseHtml(html: string) {
  const result = parseHtml(html, {
    externalOnly: true,
    includeBackgrounds: false, // Only process linked documents, not inline images
  });

  return result;
}

/**
 * Stage 2: Download resources from original URLs
 */
async function stageDownloadResources(
  resources: ParsedResource[],
  state: PipelineState,
  opts: Required<
    Omit<
      ProcessingOptions,
      'onProgress' | 'onResourceComplete' | 'onResourceFail' | 'onStageStart' | 'onStageComplete'
    >
  > &
    ProcessingOptions
) {
  // Mark resources as downloading
  state.resources.forEach((r) => {
    r.status = 'downloading';
    r.timestamps.started = new Date();
  });

  // Download with progress tracking
  const batchResult = await downloadResources(resources, {
    concurrency: opts.downloadConcurrency,
    maxRetries: opts.maxRetries,
    timeout: opts.downloadTimeout,
    onProgress: (progress) => {
      notifyProgress(state, opts, progress.total, progress.completed);
    },
    onDownloadComplete: (download) => {
      // Find and update the resource
      const resource = state.resources.find(
        (r) => r.original.normalizedUrl === download.originalResource.normalizedUrl
      );
      if (resource) {
        resource.download = download;
        resource.timestamps.downloaded = new Date();
        state.downloadResults.set(download.originalResource.normalizedUrl, download);
      }
    },
    onDownloadFail: (failure) => {
      const resource = state.resources.find(
        (r) => r.original.normalizedUrl === failure.resource.normalizedUrl
      );
      if (resource) {
        resource.status = 'failed';
        resource.error = {
          stage: ProcessingStage.DOWNLOADING,
          message: failure.error,
          details: failure,
        };

        state.errors.push({
          message: `Download failed: ${failure.error}`,
          stage: ProcessingStage.DOWNLOADING,
          type: 'download',
          resource: failure.resource,
          recoverable: opts.continueOnError,
          timestamp: new Date(),
          details: failure,
        });

        if (opts.onResourceFail) {
          opts.onResourceFail(resource);
        }
      }
    },
  });

  // Check if we should continue
  if (batchResult.failed.length > 0 && !opts.continueOnError) {
    state.shouldStop = true;
    return batchResult;
  }

  return batchResult;
}

/**
 * Stage 3: Upload resources to CMS
 */
async function stageUploadResources(
  valuApi: ValuApi,
  state: PipelineState,
  opts: Required<
    Omit<
      ProcessingOptions,
      'onProgress' | 'onResourceComplete' | 'onResourceFail' | 'onStageStart' | 'onStageComplete'
    >
  > &
    ProcessingOptions
) {
  // Get successfully downloaded resources and convert to CMS format
  const downloadsToUpload = Array.from(state.downloadResults.values()).map((download): any => ({
    resource: download.originalResource,
    data: download.buffer,
    size: download.size,
    mimeType: download.mimeType,
    filename: download.filename,
    downloadedAt: download.downloadedAt,
  }));

  if (downloadsToUpload.length === 0) {
    state.warnings.push({
      message: 'No resources to upload',
      stage: ProcessingStage.UPLOADING,
      type: 'skipped',
    });
    return {
      results: [],
      urlMappings: {},
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        duplicates: 0,
        totalBytes: 0,
      },
      processingTime: 0,
      errors: [],
    };
  }

  // Mark resources as uploading
  state.resources.forEach((r) => {
    if (r.status === 'downloading') {
      r.status = 'uploading';
    }
  });

  // Upload with progress tracking
  const batchResult = await uploadResources(downloadsToUpload, valuApi, {
    maxRetries: opts.maxRetries,
    timeout: opts.uploadTimeout,
    checkDuplicates: opts.checkDuplicates,
    continueOnError: opts.continueOnError,
  });

  // Process upload results
  batchResult.results.forEach((upload) => {
    const resource = state.resources.find((r) => r.original.normalizedUrl === upload.originalUrl);

    if (!resource) return;

    if (upload.success) {
      resource.upload = upload;
      resource.status = 'completed';
      resource.timestamps.uploaded = new Date();
      resource.timestamps.completed = new Date();
      state.uploadResults.set(upload.originalUrl, upload);

      if (opts.onResourceComplete) {
        opts.onResourceComplete(resource);
      }
    } else {
      resource.status = 'failed';
      resource.error = {
        stage: ProcessingStage.UPLOADING,
        message: upload.error || 'Upload failed',
        details: upload,
      };

      state.errors.push({
        message: `Upload failed: ${upload.error || 'Unknown error'}`,
        stage: ProcessingStage.UPLOADING,
        type: 'upload',
        resource: resource.original,
        recoverable: opts.continueOnError,
        timestamp: new Date(),
        details: upload,
      });

      if (opts.onResourceFail) {
        opts.onResourceFail(resource);
      }
    }
  });

  // Check for duplicates
  const duplicates = batchResult.results.filter((r) => r.isDuplicate);
  if (duplicates.length > 0) {
    state.warnings.push({
      message: `${duplicates.length} duplicate file(s) detected`,
      stage: ProcessingStage.UPLOADING,
      type: 'duplicate',
      context: { count: duplicates.length },
    });
  }

  // Check if we should continue
  if (batchResult.summary.failed > 0 && !opts.continueOnError) {
    state.shouldStop = true;
  }

  return batchResult;
}

/**
 * Stage 4: Replace URLs in HTML
 */
async function stageReplaceUrls(
  html: string,
  state: PipelineState,
  _opts: Required<
    Omit<
      ProcessingOptions,
      'onProgress' | 'onResourceComplete' | 'onResourceFail' | 'onStageStart' | 'onStageComplete'
    >
  > &
    ProcessingOptions
) {
  // Build URL mapping from successful uploads
  const urlMapping = new Map<string, string>();

  state.uploadResults.forEach((upload) => {
    if (upload.success && upload.cmsUrl) {
      urlMapping.set(upload.originalUrl, upload.cmsUrl);
    }
  });

  if (urlMapping.size === 0) {
    state.warnings.push({
      message: 'No URL mappings available for replacement',
      stage: ProcessingStage.REPLACING,
      type: 'skipped',
    });

    return {
      html,
      replacementCount: 0,
      unreplacedUrls: [],
      statistics: {
        totalMappings: 0,
        successfulReplacements: 0,
        unmatchedMappings: 0,
        modifiedElements: 0,
        processingTime: 0,
      },
      warnings: [],
    };
  }

  // Replace URLs
  const result = replaceUrls(html, urlMapping, {
    preserveFormatting: true,
    normalizeUrls: true,
  });

  // Add warnings from replacement
  result.warnings.forEach((warning) => {
    state.warnings.push({
      message: warning.message,
      stage: ProcessingStage.REPLACING,
      type: 'validation',
      context: warning.context,
    });
  });

  return result;
}

/**
 * Execute a processing stage with error handling
 */
async function executeStage<T>(
  state: PipelineState,
  stage: ProcessingStage,
  fn: () => Promise<T>,
  opts: ProcessingOptions
): Promise<StageResult<T>> {
  state.currentStage = stage;
  const stageStartTime = Date.now();
  state.stageTimes.set(stage, stageStartTime);

  // Notify stage start
  if (opts.onStageStart) {
    opts.onStageStart(stage);
  }

  try {
    const data = await fn();
    const duration = Date.now() - stageStartTime;

    // Notify stage complete
    if (opts.onStageComplete) {
      opts.onStageComplete(stage);
    }

    return {
      stage,
      success: true,
      duration,
      data,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    const duration = Date.now() - stageStartTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const processingError: ProcessingError = {
      message: `Stage ${stage} failed: ${errorMessage}`,
      stage,
      type: 'unknown',
      recoverable: false,
      timestamp: new Date(),
      details: error,
    };

    state.errors.push(processingError);

    return {
      stage,
      success: false,
      duration,
      errors: [processingError],
      warnings: [],
    };
  }
}

/**
 * Notify progress callback
 */
function notifyProgress(
  state: PipelineState,
  opts: ProcessingOptions,
  total: number,
  completed: number
) {
  if (!opts.onProgress) return;

  const elapsedTime = Date.now() - state.startTime;
  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

  const progress: ProcessingProgress = {
    stage: state.currentStage,
    percentComplete,
    processedCount: completed,
    totalCount: total,
    elapsedTime,
  };

  opts.onProgress(progress);
}

/**
 * Build error result when processing fails
 */
function buildErrorResult(
  html: string,
  state: PipelineState,
  startTime: number,
  opts: ProcessingOptions,
  parserResult?: any
): ProcessingResult {
  const processingTime = Date.now() - startTime;

  return {
    success: false,
    originalHtml: html,
    processedHtml: html, // Return original HTML on failure
    resources: state.resources,
    urlMappings: new Map(),
    parserResult: parserResult || {
      resources: [],
      byType: { pdf: [], image: [], document: [], unknown: [] },
      summary: { totalResources: 0, externalResources: 0, byType: {} },
      errors: [],
      metadata: { parseTime: 0, htmlLength: html.length, options: {} },
    },
    replacementResult: {
      html,
      replacementCount: 0,
      unreplacedUrls: [],
      statistics: {
        totalMappings: 0,
        successfulReplacements: 0,
        unmatchedMappings: 0,
        modifiedElements: 0,
        processingTime: 0,
      },
      warnings: [],
    },
    statistics: calculateStatistics(state, startTime),
    errors: state.errors,
    warnings: state.warnings,
    metadata: {
      startedAt: new Date(startTime),
      completedAt: new Date(),
      processingTime,
      options: opts,
    },
  };
}

/**
 * Build success result
 */
function buildSuccessResult(
  originalHtml: string,
  replacementResult: any,
  parserResult: any,
  state: PipelineState,
  startTime: number,
  opts: ProcessingOptions
): ProcessingResult {
  const processingTime = Date.now() - startTime;

  // Build URL mappings
  const urlMappings = new Map<string, string>();
  state.uploadResults.forEach((upload) => {
    if (upload.success && upload.cmsUrl) {
      urlMappings.set(upload.originalUrl, upload.cmsUrl);
    }
  });

  return {
    success: true,
    originalHtml,
    processedHtml: replacementResult.html,
    resources: state.resources,
    urlMappings,
    parserResult,
    replacementResult,
    statistics: calculateStatistics(state, startTime),
    errors: state.errors,
    warnings: state.warnings,
    metadata: {
      startedAt: new Date(startTime),
      completedAt: new Date(),
      processingTime,
      options: opts,
    },
  };
}

/**
 * Calculate comprehensive processing statistics
 */
function calculateStatistics(state: PipelineState, startTime: number): ProcessingStatistics {
  const successful = state.resources.filter((r) => r.status === 'completed').length;
  const failed = state.resources.filter((r) => r.status === 'failed').length;
  const skipped = state.resources.length - successful - failed;

  const totalBytesDownloaded = Array.from(state.downloadResults.values()).reduce(
    (sum, d) => sum + d.size,
    0
  );

  const totalBytesUploaded = Array.from(state.uploadResults.values()).reduce(
    (sum, u) => sum + (u.fileSize || 0),
    0
  );

  const totalTime = Date.now() - startTime;
  const averageTimePerResource =
    state.resources.length > 0 ? totalTime / state.resources.length : 0;

  // Calculate stage times
  const stageTimes = {
    parsing: 0,
    downloading: 0,
    uploading: 0,
    replacing: 0,
  };

  const stageOrder = [
    ProcessingStage.PARSING,
    ProcessingStage.DOWNLOADING,
    ProcessingStage.UPLOADING,
    ProcessingStage.REPLACING,
  ];

  for (let i = 0; i < stageOrder.length; i++) {
    const stage = stageOrder[i];
    if (!stage) continue;

    const stageStart = state.stageTimes.get(stage);
    if (!stageStart) continue;

    const nextStage = stageOrder[i + 1];
    const nextStart = nextStage ? state.stageTimes.get(nextStage) : undefined;

    const endTime = nextStart !== undefined ? nextStart : Date.now();
    const stageKey = stage.toLowerCase() as keyof typeof stageTimes;
    stageTimes[stageKey] = endTime - stageStart;
  }

  // Breakdown by type
  const byType = {
    pdf: { total: 0, successful: 0, failed: 0 },
    image: { total: 0, successful: 0, failed: 0 },
    document: { total: 0, successful: 0, failed: 0 },
    unknown: { total: 0, successful: 0, failed: 0 },
  };

  state.resources.forEach((resource) => {
    const type = resource.original.type.toLowerCase() as keyof typeof byType;
    if (byType[type]) {
      byType[type].total++;
      if (resource.status === 'completed') {
        byType[type].successful++;
      } else if (resource.status === 'failed') {
        byType[type].failed++;
      }
    }
  });

  return {
    totalResources: state.resources.length,
    successful,
    failed,
    skipped,
    totalBytesDownloaded,
    totalBytesUploaded,
    stageTimes,
    totalTime,
    averageTimePerResource,
    byType,
  };
}
