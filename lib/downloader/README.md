# Resource Downloader

Downloads resources (PDFs, images, documents) from external URLs with retry logic, concurrency control, and progress tracking.

## Features

- **Parallel Downloads**: Download multiple resources concurrently with configurable concurrency limit
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Progress Tracking**: Real-time progress callbacks for UI updates
- **Error Handling**: Comprehensive error handling with detailed failure information
- **Rate Limiting**: Built-in rate limiting on API endpoints
- **File Integrity**: Optional SHA-256 hash calculation for downloaded files
- **CORS Avoidance**: Server-side API endpoints to avoid browser CORS restrictions

## Installation

The downloader module is part of the Living with the Rebbe project. No additional installation is required.

Dependencies:
- `axios` - HTTP client for downloads
- `crypto` - Hash calculation

## Usage

### Basic Download

```typescript
import { downloadResource } from '@/lib/downloader';
import { ParsedResource, ResourceType } from '@/types/parser';

const resource: ParsedResource = {
  url: 'file.pdf',
  normalizedUrl: 'https://example.com/file.pdf',
  type: ResourceType.PDF,
  extension: '.pdf',
  element: {
    tag: 'a',
    attribute: 'href',
    outerHTML: '<a href="file.pdf">Download</a>',
  },
  isExternal: true,
};

try {
  const result = await downloadResource(resource);
  console.log(`Downloaded ${result.filename} (${result.size} bytes)`);
  // result.buffer contains the file data
} catch (error) {
  console.error('Download failed:', error);
}
```

### Batch Download with Progress

```typescript
import { downloadResources } from '@/lib/downloader';

const resources: ParsedResource[] = [
  // ... array of parsed resources
];

const result = await downloadResources(resources, {
  concurrency: 3,
  maxRetries: 3,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentComplete}% (${progress.successful} successful, ${progress.failed} failed)`);
  },
  onDownloadComplete: (result) => {
    console.log(`Downloaded: ${result.filename}`);
  },
  onDownloadFail: (failure) => {
    console.error(`Failed: ${failure.resource.normalizedUrl} - ${failure.error}`);
  },
});

console.log('Summary:', result.summary);
```

### Download from URL (Convenience Method)

```typescript
import { downloadFromUrl } from '@/lib/downloader';

const result = await downloadFromUrl('https://example.com/document.pdf', {
  timeout: 60000,
  calculateHash: true,
});

console.log(`Hash: ${result.hash}`);
```

## API

### `downloadResource(resource, options?)`

Downloads a single resource with retry logic.

**Parameters:**
- `resource: ParsedResource` - The resource to download
- `options?: DownloadOptions` - Optional configuration

**Returns:** `Promise<DownloadResult>`

**Throws:** `DownloadError` if download fails after all retries

### `downloadResources(resources, options?)`

Downloads multiple resources with concurrency control.

**Parameters:**
- `resources: ParsedResource[]` - Array of resources to download
- `options?: DownloadOptions` - Optional configuration

**Returns:** `Promise<BatchDownloadResult>`

### `downloadFromUrl(url, options?)`

Downloads a resource from a URL string (convenience method).

**Parameters:**
- `url: string` - URL to download from
- `options?: DownloadOptions` - Optional configuration

**Returns:** `Promise<DownloadResult>`

## Types

### `DownloadOptions`

```typescript
interface DownloadOptions {
  timeout?: number;              // Default: 30000ms
  maxRetries?: number;           // Default: 3
  retryDelay?: number;           // Default: 1000ms
  concurrency?: number;          // Default: 3
  maxFileSize?: number;          // Default: 50MB
  headers?: Record<string, string>;
  calculateHash?: boolean;       // Default: false
  onProgress?: (progress: DownloadProgress) => void;
  onDownloadComplete?: (result: DownloadResult) => void;
  onDownloadFail?: (failure: DownloadFailure) => void;
}
```

### `DownloadResult`

```typescript
interface DownloadResult {
  buffer: ArrayBuffer;           // Downloaded file data
  originalResource: ParsedResource;
  filename: string;              // Generated filename
  mimeType: string;              // Detected MIME type
  size: number;                  // File size in bytes
  downloadTime: number;          // Download duration in ms
  downloadedAt: Date;            // Completion timestamp
  hash?: string;                 // SHA-256 hash (if calculateHash: true)
}
```

### `BatchDownloadResult`

```typescript
interface BatchDownloadResult {
  successful: DownloadResult[];
  failed: DownloadFailure[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalSize: number;
    totalTime: number;
  };
}
```

### `DownloadProgress`

```typescript
interface DownloadProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  inProgress: number;
  currentResource?: ParsedResource;
  totalBytes: number;
  percentComplete: number;       // 0-100
}
```

## Server-Side API

### POST `/api/download-resource`

Downloads a single resource server-side (avoids CORS).

**Request Body:**
```json
{
  "resource": {
    "normalizedUrl": "https://example.com/file.pdf",
    "type": "pdf",
    "extension": ".pdf",
    ...
  },
  "options": {
    "timeout": 30000,
    "calculateHash": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "buffer": "base64-encoded-data",
    "filename": "file.pdf",
    "mimeType": "application/pdf",
    "size": 12345,
    "hash": "sha256-hash",
    ...
  }
}
```

### PUT `/api/download-resource` (Batch)

Downloads multiple resources in parallel.

**Request Body:**
```json
{
  "resources": [
    { "normalizedUrl": "...", ... },
    { "normalizedUrl": "...", ... }
  ],
  "options": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": [...],
    "failed": [...],
    "summary": { ... }
  }
}
```

**Rate Limiting:**
- Max 10 concurrent requests per IP
- 1-minute sliding window
- Returns 429 status when limit exceeded

## Retry Logic

The downloader automatically retries failed downloads using exponential backoff:

- **Retryable errors**: Network failures, timeouts, 5xx server errors, 429 rate limits
- **Non-retryable errors**: 4xx client errors (except 429)
- **Backoff calculation**: `delay = baseDelay * (2 ^ attempt)`, capped at 10 seconds
- **Example**: 1s → 2s → 4s → 8s (3 retries with 1s base delay)

## Error Handling

```typescript
import { DownloadError } from '@/lib/downloader';

try {
  await downloadResource(resource);
} catch (error) {
  if (error instanceof DownloadError) {
    console.error('URL:', error.url);
    console.error('Status:', error.statusCode);
    console.error('Message:', error.message);
  }
}
```

## Best Practices

1. **Use batch downloads** for multiple resources to benefit from concurrency control
2. **Set appropriate concurrency** based on server capabilities (default: 3)
3. **Handle failures gracefully** - the batch API continues on errors
4. **Use progress callbacks** for long-running downloads
5. **Enable hash calculation** for critical files requiring integrity verification
6. **Use server-side API** when downloading from client to avoid CORS issues
7. **Monitor rate limits** - batch size limited to 20 resources per request

## Examples

### Download Newsletter Resources

```typescript
import { parseHtml } from '@/lib/parser';
import { downloadResources } from '@/lib/downloader';

// Parse HTML to extract resources
const parseResult = await parseHtml(html, { baseUrl });

// Download only PDFs
const pdfResources = parseResult.byType.pdf;

const downloadResult = await downloadResources(pdfResources, {
  concurrency: 5,
  onProgress: (progress) => {
    updateProgressBar(progress.percentComplete);
  },
});

// Process successful downloads
for (const download of downloadResult.successful) {
  await uploadToCMS(download.buffer, download.filename);
}

// Handle failures
for (const failure of downloadResult.failed) {
  logError(`Failed to download: ${failure.resource.normalizedUrl}`, failure.error);
}
```

### Client-Side Download via API

```typescript
async function downloadResourceViaAPI(resource: ParsedResource) {
  const response = await fetch('/api/download-resource', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resource }),
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const result = await response.json();

  // Decode base64 buffer
  const buffer = Uint8Array.from(atob(result.data.buffer), c => c.charCodeAt(0));

  return { ...result.data, buffer };
}
```

## Testing

Run tests with:

```bash
npm test lib/downloader
```

The test suite covers:
- Successful downloads
- Retry logic
- Error handling
- Batch downloads with concurrency
- Progress callbacks
- Hash calculation
- Filename generation

## Performance

- **Concurrency**: Default 3 parallel downloads, configurable up to 10
- **Timeout**: 30 seconds per download
- **Max file size**: 50MB (configurable)
- **Memory**: Uses streaming where possible, but loads full file into memory
- **Batch limit**: 20 resources per API request

## Troubleshooting

### Download Timeouts

Increase the timeout for large files:
```typescript
await downloadResource(resource, { timeout: 60000 });
```

### Rate Limiting

If you hit rate limits, reduce concurrency:
```typescript
await downloadResources(resources, { concurrency: 1 });
```

### Memory Issues

For very large files, consider:
1. Increasing `maxFileSize` limit
2. Processing in smaller batches
3. Implementing streaming (future enhancement)

### CORS Errors

Use the server-side API endpoint instead of direct browser downloads.

## Future Enhancements

- [ ] Streaming downloads for large files
- [ ] Resume interrupted downloads
- [ ] Download queue with priority
- [ ] Bandwidth throttling
- [ ] Persistent retry state across restarts
- [ ] WebSocket progress updates
- [ ] Download caching
