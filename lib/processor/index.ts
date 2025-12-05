/**
 * Newsletter Processing Pipeline Module
 *
 * Orchestrates the complete flow of processing newsletter HTML:
 * Parse → Download → Upload → Replace
 *
 * This module ties together all the resource processing steps:
 * - `/lib/parser` - Extracts resources from HTML
 * - `/lib/downloader` - Downloads resources from external URLs
 * - `/lib/cms` - Uploads resources to ChabadUniverse CMS
 * - `/lib/replacer` - Replaces original URLs with CMS URLs
 *
 * @example Basic usage
 * ```typescript
 * import { processNewsletter } from '@/lib/processor';
 * import { useValuApi } from '@/hooks/useValuApi';
 *
 * const { api } = useValuApi();
 *
 * const result = await processNewsletter(html, api, {
 *   onProgress: (progress) => {
 *     console.log(`${progress.percentComplete}% complete - ${progress.stage}`);
 *   },
 *   continueOnError: true,
 * });
 *
 * if (result.success) {
 *   console.log('Processing complete!');
 *   console.log('Processed HTML:', result.processedHtml);
 *   console.log('Statistics:', result.statistics);
 * } else {
 *   console.error('Processing failed:', result.errors);
 * }
 * ```
 *
 * @example With detailed callbacks
 * ```typescript
 * import { processNewsletter, ProcessingStage } from '@/lib/processor';
 *
 * const result = await processNewsletter(html, api, {
 *   downloadConcurrency: 5,
 *   uploadConcurrency: 3,
 *   maxRetries: 3,
 *
 *   onStageStart: (stage) => {
 *     console.log(`Starting stage: ${stage}`);
 *   },
 *
 *   onStageComplete: (stage) => {
 *     console.log(`Completed stage: ${stage}`);
 *   },
 *
 *   onProgress: (progress) => {
 *     console.log(`Progress: ${progress.percentComplete}%`);
 *     console.log(`Processed: ${progress.processedCount}/${progress.totalCount}`);
 *   },
 *
 *   onResourceComplete: (resource) => {
 *     console.log(`✓ ${resource.original.url}`);
 *   },
 *
 *   onResourceFail: (resource) => {
 *     console.error(`✗ ${resource.original.url}:`, resource.error?.message);
 *   },
 * });
 * ```
 *
 * @example Error handling
 * ```typescript
 * import { processNewsletter } from '@/lib/processor';
 *
 * const result = await processNewsletter(html, api, {
 *   continueOnError: true, // Continue processing even if individual resources fail
 * });
 *
 * // Check overall success
 * if (!result.success) {
 *   console.error('Processing failed:', result.errors);
 * }
 *
 * // Check individual resource failures
 * const failedResources = result.resources.filter(r => r.status === 'failed');
 * failedResources.forEach(resource => {
 *   console.error(`Failed: ${resource.original.url}`);
 *   console.error(`Reason: ${resource.error?.message}`);
 *   console.error(`Stage: ${resource.error?.stage}`);
 * });
 *
 * // Even with failures, you get partial results
 * console.log(`Successfully processed: ${result.statistics.successful}/${result.statistics.totalResources}`);
 * console.log('Processed HTML (with successful replacements):', result.processedHtml);
 * ```
 */

// Main processor function
export { processNewsletter } from './resource-processor';

// Types
export type {
  ProcessingOptions,
  ProcessingResult,
  ProcessingProgress,
  ProcessedResource,
  ProcessingStatistics,
  ProcessingError,
  ProcessingWarning,
  StageResult,
  PipelineState,
} from './types';

export { ProcessingStage } from './types';
