/**
 * Example Usage of Newsletter Processor
 *
 * This file demonstrates how to use the newsletter processing pipeline
 * in a real application context.
 */

import { processNewsletter } from './index';
import type { ValuApi } from '@arkeytyp/valu-api';

// Types used in examples
// import type { ProcessingStage, ProcessingProgress, ProcessingResult } from './index';

/**
 * Example 1: Basic Usage
 *
 * Process newsletter HTML with default options and basic progress tracking.
 */
export async function basicExample(html: string, valuApi: ValuApi) {
  console.log('Starting newsletter processing...');

  const result = await processNewsletter(html, valuApi, {
    onProgress: (progress) => {
      console.log(`Progress: ${progress.percentComplete}% - Stage: ${progress.stage}`);
    },
  });

  if (result.success) {
    console.log('✓ Processing complete!');
    console.log(
      `  Processed: ${result.statistics.successful}/${result.statistics.totalResources} resources`
    );
    console.log(`  Time: ${result.statistics.totalTime}ms`);
    console.log(`  Downloaded: ${(result.statistics.totalBytesDownloaded / 1024).toFixed(2)} KB`);
    console.log(`  Uploaded: ${(result.statistics.totalBytesUploaded / 1024).toFixed(2)} KB`);

    // Use the processed HTML
    return result.processedHtml;
  } else {
    console.error('✗ Processing failed');
    result.errors.forEach((error) => {
      console.error(`  ${error.stage}: ${error.message}`);
    });
    return null;
  }
}

/**
 * Example 2: Advanced Usage with Detailed Callbacks
 *
 * Track detailed progress with all available callbacks.
 */
export async function advancedExample(html: string, valuApi: ValuApi) {
  let successCount = 0;
  let failureCount = 0;

  const result = await processNewsletter(html, valuApi, {
    // Performance tuning
    downloadConcurrency: 5,
    uploadConcurrency: 3,
    maxRetries: 3,

    // Stage callbacks
    onStageStart: (stage) => {
      console.log(`\n━━━ Starting ${stage.toUpperCase()} ━━━`);
    },

    onStageComplete: (stage) => {
      console.log(`✓ Completed ${stage.toUpperCase()}`);
    },

    // Overall progress
    onProgress: (progress) => {
      console.log(
        `[${progress.stage}] ${progress.processedCount}/${progress.totalCount} (${progress.percentComplete}%)`
      );
    },

    // Resource-level tracking
    onResourceComplete: (resource) => {
      successCount++;
      console.log(`  ✓ ${resource.original.url}`);
      if (resource.upload?.cmsUrl) {
        console.log(`    → ${resource.upload.cmsUrl}`);
      }
    },

    onResourceFail: (resource) => {
      failureCount++;
      console.error(`  ✗ ${resource.original.url}`);
      console.error(`    Error: ${resource.error?.message}`);
    },

    // Continue even if some resources fail
    continueOnError: true,
  });

  // Report summary
  console.log('\n━━━ SUMMARY ━━━');
  console.log(`Total Resources: ${result.statistics.totalResources}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log(`\nStage Times:`);
  console.log(`  Parsing: ${result.statistics.stageTimes.parsing}ms`);
  console.log(`  Downloading: ${result.statistics.stageTimes.downloading}ms`);
  console.log(`  Uploading: ${result.statistics.stageTimes.uploading}ms`);
  console.log(`  Replacing: ${result.statistics.stageTimes.replacing}ms`);

  return result;
}

/**
 * Example 3: React Component Integration
 *
 * Shows how to use the processor in a React component with UI updates.
 * (Commented out to avoid TypeScript errors in non-React context)
 */
/*
export function useNewsletterProcessor() {
  // In a real React component, these would be useState hooks
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState<{
    stage: ProcessingStage;
    percent: number;
    current: number;
    total: number;
  } | null>(null);
  const [result, setResult] = React.useState<ProcessingResult | null>(null);

  const process = async (html: string, valuApi: ValuApi): Promise<ProcessingResult> => {
    setIsProcessing(true);
    setProgress(null);
    setResult(null);

    try {
      const result = await processNewsletter(html, valuApi, {
        onProgress: (p: ProcessingProgress) => {
          setProgress({
            stage: p.stage,
            percent: p.percentComplete,
            current: p.processedCount,
            total: p.totalCount,
          });
        },

        onStageStart: (stage: ProcessingStage) => {
          console.log(`Starting ${stage}...`);
        },

        continueOnError: true,
      });

      setResult(result);
      return result;
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return {
    isProcessing,
    progress,
    result,
    process,
  };
}
*/

/**
 * Example 4: Error Handling and Partial Results
 *
 * Handle failures gracefully and use partial results.
 */
export async function errorHandlingExample(html: string, valuApi: ValuApi) {
  const result = await processNewsletter(html, valuApi, {
    continueOnError: true, // Continue even if individual resources fail
    maxRetries: 3,
  });

  // Check overall success
  if (!result.success) {
    console.error('Pipeline failed completely:', result.errors);
    return null;
  }

  // Check for partial failures
  if (result.statistics.failed > 0) {
    console.warn(`Warning: ${result.statistics.failed} resource(s) failed to process`);

    // Log failed resources
    result.resources
      .filter((r) => r.status === 'failed')
      .forEach((resource) => {
        console.error(`Failed: ${resource.original.url}`);
        console.error(`  Stage: ${resource.error?.stage}`);
        console.error(`  Error: ${resource.error?.message}`);
      });
  }

  // Even with failures, we have a partially processed HTML
  // with successful replacements
  console.log(
    `Successfully processed ${result.statistics.successful}/${result.statistics.totalResources} resources`
  );

  return {
    html: result.processedHtml,
    hasFailures: result.statistics.failed > 0,
    failedResources: result.resources.filter((r) => r.status === 'failed'),
    statistics: result.statistics,
  };
}

/**
 * Example 5: Performance Tuning
 *
 * Adjust settings based on network conditions and requirements.
 */
export async function performanceTunedExample(
  html: string,
  valuApi: ValuApi,
  networkType: 'fast' | 'slow' | 'unstable'
) {
  let options;

  if (networkType === 'fast') {
    // Fast network: maximize parallelism
    options = {
      downloadConcurrency: 10,
      uploadConcurrency: 5,
      maxRetries: 2,
      downloadTimeout: 15000,
      uploadTimeout: 30000,
    };
  } else if (networkType === 'slow') {
    // Slow network: be patient, fewer parallel requests
    options = {
      downloadConcurrency: 2,
      uploadConcurrency: 1,
      maxRetries: 5,
      downloadTimeout: 60000,
      uploadTimeout: 120000,
    };
  } else {
    // Unstable network: many retries, medium parallelism
    options = {
      downloadConcurrency: 3,
      uploadConcurrency: 2,
      maxRetries: 10,
      downloadTimeout: 45000,
      uploadTimeout: 90000,
    };
  }

  return await processNewsletter(html, valuApi, options);
}

/**
 * Example 6: Saving Processing History
 *
 * Save processing results to database for audit trail.
 */
export async function processingHistoryExample(html: string, valuApi: ValuApi) {
  const result = await processNewsletter(html, valuApi);

  // Save to database (pseudo-code)
  const historyRecord = {
    processedAt: result.metadata.completedAt,
    success: result.success,
    statistics: {
      total: result.statistics.totalResources,
      successful: result.statistics.successful,
      failed: result.statistics.failed,
      totalTime: result.statistics.totalTime,
      bytesDownloaded: result.statistics.totalBytesDownloaded,
      bytesUploaded: result.statistics.totalBytesUploaded,
    },
    resources: result.resources.map((r) => ({
      originalUrl: r.original.url,
      cmsUrl: r.upload?.cmsUrl || null,
      status: r.status,
      error: r.error?.message || null,
      type: r.original.type,
    })),
    errors: result.errors.map((e) => ({
      message: e.message,
      stage: e.stage,
      type: e.type,
    })),
    warnings: result.warnings.map((w) => ({
      message: w.message,
      stage: w.stage,
      type: w.type,
    })),
  };

  // await db.processingHistory.insert(historyRecord);
  console.log('Processing history saved:', historyRecord);

  return result;
}

// Note: This file is for demonstration purposes only
// In actual use, import processNewsletter from '@/lib/processor'
// and use it with your ValuApi instance from useValuApi() hook
