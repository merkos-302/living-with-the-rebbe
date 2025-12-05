# Newsletter Processor Module

The processor module orchestrates the complete pipeline for processing "Living with the Rebbe" newsletters.

## Overview

This module ties together all resource processing steps in a coordinated pipeline:

```
Parse HTML → Download Resources → Upload to CMS → Replace URLs
```

### Pipeline Stages

1. **Parsing** - Extract resources from HTML using `/lib/parser`
2. **Downloading** - Download resources from external URLs using `/lib/downloader`
3. **Uploading** - Upload to ChabadUniverse CMS using `/lib/cms`
4. **Replacing** - Replace original URLs with CMS URLs using `/lib/replacer`

## Basic Usage

```typescript
import { processNewsletter } from '@/lib/processor';
import { useValuApi } from '@/hooks/useValuApi';

const { api } = useValuApi();

const result = await processNewsletter(html, api, {
  onProgress: (progress) => {
    console.log(`${progress.percentComplete}% complete - ${progress.stage}`);
  },
});

if (result.success) {
  console.log('Processed HTML:', result.processedHtml);
  console.log('Statistics:', result.statistics);
}
```

## Features

### Progress Tracking

Get real-time updates on processing progress:

```typescript
const result = await processNewsletter(html, api, {
  onProgress: (progress) => {
    console.log(`Stage: ${progress.stage}`);
    console.log(`Overall: ${progress.percentComplete}%`);
    console.log(`Processed: ${progress.processedCount}/${progress.totalCount}`);
    console.log(`Elapsed: ${progress.elapsedTime}ms`);
  },
});
```

### Stage Callbacks

Monitor when stages start and complete:

```typescript
const result = await processNewsletter(html, api, {
  onStageStart: (stage) => {
    console.log(`Starting: ${stage}`);
  },

  onStageComplete: (stage) => {
    console.log(`Completed: ${stage}`);
  },
});
```

### Resource-Level Callbacks

Track individual resource processing:

```typescript
const result = await processNewsletter(html, api, {
  onResourceComplete: (resource) => {
    console.log(`✓ ${resource.original.url}`);
    console.log(`  Downloaded: ${resource.download?.size} bytes`);
    console.log(`  CMS URL: ${resource.upload?.cmsUrl}`);
  },

  onResourceFail: (resource) => {
    console.error(`✗ ${resource.original.url}`);
    console.error(`  Error: ${resource.error?.message}`);
    console.error(`  Stage: ${resource.error?.stage}`);
  },
});
```

### Error Handling

Continue processing even when individual resources fail:

```typescript
const result = await processNewsletter(html, api, {
  continueOnError: true, // Default: true
});

// Check overall success
if (!result.success) {
  console.error('Pipeline failed:', result.errors);
}

// Check individual failures
const failed = result.resources.filter(r => r.status === 'failed');
console.log(`Failed: ${failed.length}/${result.statistics.totalResources}`);

// Get partial results
console.log(`Successful: ${result.statistics.successful}`);
console.log('Processed HTML:', result.processedHtml); // Contains successful replacements
```

## Configuration Options

### Concurrency Control

```typescript
const result = await processNewsletter(html, api, {
  downloadConcurrency: 5,  // Download 5 resources at once
  uploadConcurrency: 3,    // Upload 3 resources at once
});
```

### Retry Logic

```typescript
const result = await processNewsletter(html, api, {
  maxRetries: 3,           // Retry failed operations 3 times
  downloadTimeout: 30000,  // 30 second download timeout
  uploadTimeout: 60000,    // 60 second upload timeout
});
```

### Deduplication

```typescript
const result = await processNewsletter(html, api, {
  checkDuplicates: true,   // Check for existing files before uploading
});
```

## Processing Result

The processor returns a comprehensive result object:

```typescript
interface ProcessingResult {
  // Overall success status
  success: boolean;

  // Original and processed HTML
  originalHtml: string;
  processedHtml: string;

  // Detailed resource information
  resources: ProcessedResource[];

  // URL mappings used for replacement
  urlMappings: Map<string, string>;

  // Results from each stage
  parserResult: ParserResult;
  replacementResult: ReplacementResult;

  // Comprehensive statistics
  statistics: ProcessingStatistics;

  // All errors and warnings
  errors: ProcessingError[];
  warnings: ProcessingWarning[];

  // Processing metadata
  metadata: {
    startedAt: Date;
    completedAt: Date;
    processingTime: number;
    options: ProcessingOptions;
  };
}
```

## Processing Statistics

Get detailed statistics about the processing:

```typescript
const { statistics } = result;

console.log('Total Resources:', statistics.totalResources);
console.log('Successful:', statistics.successful);
console.log('Failed:', statistics.failed);
console.log('Skipped:', statistics.skipped);

console.log('Downloaded:', statistics.totalBytesDownloaded, 'bytes');
console.log('Uploaded:', statistics.totalBytesUploaded, 'bytes');

console.log('Total Time:', statistics.totalTime, 'ms');
console.log('Average per Resource:', statistics.averageTimePerResource, 'ms');

// Time spent in each stage
console.log('Stage Times:', statistics.stageTimes);

// Breakdown by resource type
console.log('PDFs:', statistics.byType.pdf);
console.log('Images:', statistics.byType.image);
console.log('Documents:', statistics.byType.document);
```

## Processed Resources

Access detailed information about each resource:

```typescript
result.resources.forEach(resource => {
  console.log('Original URL:', resource.original.url);
  console.log('Status:', resource.status); // 'completed', 'failed', 'pending'

  // Download information
  if (resource.download) {
    console.log('Downloaded:', resource.download.size, 'bytes');
    console.log('MIME Type:', resource.download.mimeType);
  }

  // Upload information
  if (resource.upload) {
    console.log('CMS URL:', resource.upload.cmsUrl);
    console.log('Resource ID:', resource.upload.resourceId);
  }

  // Error information
  if (resource.error) {
    console.log('Failed at:', resource.error.stage);
    console.log('Error:', resource.error.message);
  }

  // Processing timestamps
  console.log('Started:', resource.timestamps.started);
  console.log('Downloaded:', resource.timestamps.downloaded);
  console.log('Uploaded:', resource.timestamps.uploaded);
  console.log('Completed:', resource.timestamps.completed);
});
```

## URL Mappings

Get the mapping of original URLs to CMS URLs:

```typescript
const { urlMappings } = result;

urlMappings.forEach((cmsUrl, originalUrl) => {
  console.log(`${originalUrl} → ${cmsUrl}`);
});
```

## Errors and Warnings

Access all errors and warnings from processing:

```typescript
// Errors (critical issues)
result.errors.forEach(error => {
  console.error('Error:', error.message);
  console.error('Stage:', error.stage);
  console.error('Type:', error.type);
  console.error('Resource:', error.resource?.url);
  console.error('Recoverable:', error.recoverable);
});

// Warnings (non-critical issues)
result.warnings.forEach(warning => {
  console.warn('Warning:', warning.message);
  console.warn('Stage:', warning.stage);
  console.warn('Type:', warning.type);
});
```

## Integration with UI

Example React component using the processor:

```typescript
import { useState } from 'react';
import { processNewsletter, ProcessingProgress } from '@/lib/processor';
import { useValuApi } from '@/hooks/useValuApi';

export function NewsletterProcessor() {
  const { api } = useValuApi();
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState(null);

  const handleProcess = async (html: string) => {
    const result = await processNewsletter(html, api, {
      onProgress: (progress) => {
        setProgress(progress);
      },

      onStageStart: (stage) => {
        console.log(`Starting ${stage}...`);
      },

      continueOnError: true,
    });

    setResult(result);
    setProgress(null);
  };

  return (
    <div>
      {progress && (
        <div>
          <p>Stage: {progress.stage}</p>
          <p>Progress: {progress.percentComplete}%</p>
          <progress value={progress.percentComplete} max={100} />
        </div>
      )}

      {result && (
        <div>
          <h3>Processing Complete</h3>
          <p>Successful: {result.statistics.successful}</p>
          <p>Failed: {result.statistics.failed}</p>
          <textarea value={result.processedHtml} readOnly />
        </div>
      )}
    </div>
  );
}
```

## Best Practices

### 1. Always Handle Errors

```typescript
const result = await processNewsletter(html, api, {
  continueOnError: true,
});

if (!result.success) {
  // Show user-friendly error message
  console.error('Processing failed');
}

// Always check statistics
if (result.statistics.failed > 0) {
  console.warn(`${result.statistics.failed} resources failed`);
}
```

### 2. Provide User Feedback

```typescript
const result = await processNewsletter(html, api, {
  onProgress: (progress) => {
    updateProgressBar(progress.percentComplete);
    updateStatusText(progress.stage);
  },

  onResourceComplete: (resource) => {
    logSuccess(resource.original.url);
  },

  onResourceFail: (resource) => {
    logError(resource.original.url, resource.error?.message);
  },
});
```

### 3. Tune Performance

```typescript
// For faster processing with reliable network
const result = await processNewsletter(html, api, {
  downloadConcurrency: 10,  // More parallel downloads
  uploadConcurrency: 5,     // More parallel uploads
});

// For slower/unreliable network
const result = await processNewsletter(html, api, {
  downloadConcurrency: 2,   // Fewer parallel requests
  maxRetries: 5,            // More retries
  downloadTimeout: 60000,   // Longer timeout
});
```

### 4. Save Processing History

```typescript
const result = await processNewsletter(html, api);

// Save to database for audit trail
await saveToDatabase({
  processedAt: result.metadata.completedAt,
  statistics: result.statistics,
  errors: result.errors,
  warnings: result.warnings,
  resources: result.resources.map(r => ({
    url: r.original.url,
    status: r.status,
    cmsUrl: r.upload?.cmsUrl,
  })),
});
```

## Related Modules

- **`/lib/parser`** - HTML parsing and resource extraction
- **`/lib/downloader`** - Resource downloading
- **`/lib/cms`** - CMS upload integration
- **`/lib/replacer`** - URL replacement

## Testing

See test files for examples:
- Unit tests: `__tests__/lib/processor/resource-processor.test.ts`
- Integration tests: `__tests__/lib/processor/integration.test.ts`
