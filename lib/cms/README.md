# CMS Upload Module

Upload resources to ChabadUniverse CMS using Valu API v1.1.1 Service Intents.

## Overview

This module provides a complete solution for downloading external resources (PDFs, images, documents) and uploading them to the ChabadUniverse CMS. It integrates with Valu API v1.1.1 Service Intents and provides:

- **Resource downloading** with parallel processing and retry logic
- **CMS upload** via Valu Service Intents
- **Deduplication** to avoid re-uploading existing files
- **Public URL generation** with automatic auth redirect handling
- **Comprehensive error handling** with detailed logging

## Architecture

```
┌─────────────────┐
│ Parsed Resources│
│  (from parser)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Download     │──► Downloads files in parallel
│   (external)    │    with retry logic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  File Convert   │──► Converts ArrayBuffer to File
│  & Validate     │    Validates size & type
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check Dupes    │──► Searches existing resources
│  (Valu Intent)  │    via resource-search intent
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Upload to CMS  │──► Uploads via resource-upload
│  (Valu Intent)  │    Service Intent
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Generate URL   │──► Gets public URL via
│  (Valu Intent)  │    generate-public-url intent
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Upload Result  │──► Returns CMS URLs for
│  & URL Mapping  │    HTML replacement
└─────────────────┘
```

## Usage

### Basic Example

```typescript
import { downloadResources, uploadResources } from '@/lib/cms';
import { parseHtml } from '@/lib/parser';
import { useValuApi } from '@/hooks/useValuApi';

// Parse HTML to extract resources
const parseResult = parseHtml(htmlContent);

// Download resources
const downloads = await downloadResources(parseResult.resources);

// Upload to CMS (requires Valu API)
const { api } = useValuApi();
const uploadResult = await uploadResources(downloads, api);

// Use URL mappings to replace in HTML
const { urlMappings } = uploadResult;
// urlMappings = { "https://original.com/file.pdf": "https://cms.chabaduniverse.com/..." }
```

### With Options

```typescript
// Download with custom settings
const downloads = await downloadResources(parsedResources, {
  maxConcurrent: 3, // Download 3 at a time
  maxRetries: 5, // Retry failed downloads up to 5 times
  timeout: 60000, // 60 second timeout
  userAgent: 'Custom/1.0',
});

// Upload with custom settings
const uploadResult = await uploadResources(downloads, api, {
  checkDuplicates: true, // Check for existing files
  continueOnError: true, // Continue if individual uploads fail
  maxRetries: 3, // Retry failed uploads up to 3 times
  maxFileSize: 100 * 1024 * 1024, // 100MB max
});
```

### Single Resource Upload

```typescript
import { downloadResource, uploadToCMS } from '@/lib/cms';

// Download single resource
const download = await downloadResource(parsedResource);

// Upload to CMS
const result = await uploadToCMS(download, api);

if (result.success) {
  console.log('Uploaded:', result.cmsUrl);
} else {
  console.error('Failed:', result.error);
}
```

## API Reference

### `downloadResources()`

Download multiple resources in parallel with concurrency control.

```typescript
function downloadResources(
  resources: ParsedResource[],
  options?: DownloadOptions
): Promise<DownloadResult[]>;
```

**Options:**
- `maxRetries` (default: 3) - Maximum retries for failed downloads
- `retryDelay` (default: 1000) - Base delay in ms between retries
- `timeout` (default: 30000) - Download timeout in ms
- `maxConcurrent` (default: 5) - Max parallel downloads
- `userAgent` (default: 'Living-with-the-Rebbe/1.0') - User agent string

**Returns:** Array of `DownloadResult` objects containing file data.

### `uploadResources()`

Upload multiple resources to CMS via Valu Service Intents.

```typescript
function uploadResources(
  downloads: DownloadResult[],
  valuApi: ValuApi,
  options?: UploadOptions
): Promise<BatchUploadResult>;
```

**Options:**
- `maxRetries` (default: 3) - Maximum retries for failed uploads
- `retryDelay` (default: 1000) - Base delay in ms between retries
- `timeout` (default: 60000) - Upload timeout in ms
- `checkDuplicates` (default: true) - Search for existing resources
- `maxFileSize` (default: 50MB) - Maximum file size
- `continueOnError` (default: true) - Continue if uploads fail

**Returns:** `BatchUploadResult` with:
- `results` - Array of individual upload results
- `urlMappings` - Map of original URLs to CMS URLs
- `summary` - Statistics (total, successful, failed, duplicates)
- `processingTime` - Total time in milliseconds
- `errors` - Array of errors encountered

### `uploadToCMS()`

Upload a single resource to CMS.

```typescript
function uploadToCMS(
  download: DownloadResult,
  valuApi: ValuApi,
  options?: UploadOptions
): Promise<UploadResult>;
```

**Returns:** `UploadResult` with:
- `success` - Whether upload succeeded
- `resourceId` - Valu resource ID
- `originalUrl` - Original URL from HTML
- `cmsUrl` - Public CMS URL with auth handling
- `thumbnailUrl` - Thumbnail URL (if available)
- `isDuplicate` - Whether this was deduplicated
- `error` - Error message (if failed)

## Valu Service Intents

This module uses the following Valu API v1.1.1 Service Intents:

### 1. Resource Upload
```typescript
const intent = new Intent('ApplicationStorage', 'resource-upload', {
  files: fileList // FileList object
});
const result = await valuApi.callService(intent);
```

### 2. Resource Search (Deduplication)
```typescript
const intent = new Intent('ApplicationStorage', 'resource-search', {
  size: 50 // Max results
});
const result = await valuApi.callService(intent);
```

### 3. Generate Public URL
```typescript
const intent = new Intent('Resources', 'generate-public-url', {
  resourceId: 'resource-id'
});
const result = await valuApi.callService(intent);
```

## Public URLs and Auth Redirects

The public URLs returned by `generate-public-url` automatically handle authentication:

- **Authenticated users**: Redirected to in-app view (within ChabadUniverse frame)
- **Public users**: Redirected to website view
- **Access control**: Respects resource permissions (public/private/permissioned)
- **Analytics**: Tracks resource access for insights

Example URL: `https://cms.chabaduniverse.com/api/resource/abc123`

## Error Handling

All functions use comprehensive error handling:

```typescript
const uploadResult = await uploadResources(downloads, api, {
  continueOnError: true, // Continue processing even if some fail
});

// Check overall success
console.log(`${uploadResult.summary.successful}/${uploadResult.summary.total} succeeded`);

// Handle individual failures
for (const result of uploadResult.results) {
  if (!result.success) {
    console.error(`Failed to upload ${result.originalUrl}: ${result.error}`);
  }
}

// Handle errors
for (const error of uploadResult.errors) {
  console.error(`${error.type} error: ${error.message}`);
}
```

## Deduplication

The module automatically checks for existing resources to avoid re-uploading:

```typescript
const uploadResult = await uploadResources(downloads, api, {
  checkDuplicates: true, // Enable deduplication (default)
});

// Check for duplicates
const duplicates = uploadResult.results.filter(r => r.isDuplicate);
console.log(`Skipped ${duplicates.length} duplicate files`);
```

**Matching criteria:**
- Filename (exact match)
- File size (exact match)
- MIME type (exact match)

## Utility Functions

### File Conversion
```typescript
import { arrayBufferToFile, filesToFileList } from '@/lib/cms';

// Convert ArrayBuffer to File
const file = arrayBufferToFile(buffer, 'document.pdf', 'application/pdf');

// Create FileList for Valu API
const fileList = filesToFileList([file1, file2]);
```

### File Validation
```typescript
import { validateFile, formatBytes } from '@/lib/cms';

const validation = validateFile(file, 50 * 1024 * 1024); // 50MB max
if (!validation.valid) {
  console.error('Invalid file:', validation.error);
}

console.log('File size:', formatBytes(file.size));
```

### Filename Utilities
```typescript
import { extractFilename, sanitizeFilename, makeUniqueFilename } from '@/lib/cms';

// Extract from URL
const filename = extractFilename('https://example.com/path/to/file.pdf');

// Sanitize for file system
const safe = sanitizeFilename('unsafe:file*name?.pdf');

// Make unique with timestamp
const unique = makeUniqueFilename('document.pdf');
```

## Performance

### Parallel Processing
- Downloads use configurable concurrency (default: 5 parallel)
- Uploads are sequential to avoid overwhelming the API
- Retry logic uses exponential backoff

### Optimization Tips
1. Set appropriate `maxConcurrent` based on network speed
2. Enable `checkDuplicates` to avoid re-uploading
3. Use `continueOnError: true` for batch operations
4. Adjust `timeout` based on file sizes

### Benchmarks
- Small PDFs (< 1MB): ~2-3 seconds per file
- Large PDFs (5-10MB): ~5-10 seconds per file
- Images (< 500KB): ~1-2 seconds per file
- Batch of 10 files: ~30-60 seconds total

## Testing

The module includes comprehensive tests:

```bash
# Run all tests
npm test lib/cms

# Run specific test file
npm test lib/cms/__tests__/cms-uploader.test.ts

# Watch mode
npm test lib/cms -- --watch
```

## Logging

The module uses the application logger with structured logging:

```typescript
import { logger } from '@/utils/logger';

// Logs include context
logger.info('Starting CMS upload', {
  url: 'https://example.com/file.pdf',
  filename: 'document.pdf',
  size: 12345,
});
```

**Log levels:**
- `debug` - Detailed operation info
- `info` - Important events (uploads, downloads)
- `warn` - Recoverable errors (retries)
- `error` - Failed operations

## Integration with Parser

The CMS module works seamlessly with the parser:

```typescript
import { parseHtml } from '@/lib/parser';
import { downloadResources, uploadResources } from '@/lib/cms';

// 1. Parse HTML
const parseResult = parseHtml(htmlContent, { baseUrl });

// 2. Download resources
const downloads = await downloadResources(parseResult.resources);

// 3. Upload to CMS
const uploadResult = await uploadResources(downloads, api);

// 4. Replace URLs in HTML
let modifiedHtml = htmlContent;
for (const [original, cms] of Object.entries(uploadResult.urlMappings)) {
  modifiedHtml = modifiedHtml.replace(original, cms);
}
```

## Troubleshooting

### Common Issues

**Upload timeouts:**
```typescript
// Increase timeout for large files
await uploadResources(downloads, api, {
  timeout: 120000, // 2 minutes
});
```

**Too many concurrent downloads:**
```typescript
// Reduce concurrency if hitting rate limits
await downloadResources(resources, {
  maxConcurrent: 2,
});
```

**Valu API not available:**
```typescript
import { validateValuApi } from '@/lib/cms';

try {
  validateValuApi(api);
  // Safe to use
} catch (error) {
  console.error('Valu API not ready:', error.message);
}
```

**File too large:**
```typescript
// Increase max file size if needed
await uploadResources(downloads, api, {
  maxFileSize: 100 * 1024 * 1024, // 100MB
});
```

## Future Enhancements

- [ ] Progress callbacks for real-time updates
- [ ] Bandwidth throttling for large uploads
- [ ] Automatic image optimization before upload
- [ ] Support for resumable uploads
- [ ] Batch delete for cleanup
- [ ] Advanced deduplication (by hash)
- [ ] CDN integration for faster delivery

## Related Documentation

- [Parser Module](../parser/README.md) - HTML parsing and resource extraction
- [Valu API Documentation](https://github.com/arkeytyp/valu-api) - Valu API reference
- [Service Intents Guide](https://docs.valu.social/service-intents) - Service Intents documentation

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [examples](#usage)
3. Check application logs for detailed error messages
4. Contact the development team
