# Newsletter Processing API

**Endpoint**: `POST /api/process`

## Overview

This API route provides server-side newsletter processing that parses HTML, downloads resources, and returns base64-encoded data for client-side CMS upload. This hybrid approach solves the CORS problem while keeping Valu API client-side.

## Architecture

### Why This Design?

1. **CORS Avoidance**: Resource downloads happen server-side where CORS restrictions don't apply
2. **Client-side Upload**: CMS uploads use Valu API which must run client-side in the iframe
3. **Efficient Transfer**: Base64 encoding allows transferring binary data through JSON

### Processing Flow

```
Client (Browser)
   |
   | 1. POST HTML + baseUrl
   v
Server (API Route)
   |
   | 2. Parse HTML → Extract resources
   | 3. Download resources → Convert to base64
   v
Client (Browser)
   |
   | 4. Upload base64 data to CMS (via Valu API)
   | 5. Replace URLs in HTML
   | 6. Return modified HTML
```

## Request

### Method
`POST`

### Body
```typescript
{
  html: string;       // Newsletter HTML content
  baseUrl?: string;   // Base URL for resolving relative URLs
}
```

### Example
```typescript
const response = await fetch('/api/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: '<html><body><a href="https://example.com/doc.pdf">PDF</a></body></html>',
    baseUrl: 'https://example.com'
  })
});

const data = await response.json();
```

## Response

### Success Response
```typescript
{
  success: true;
  data: {
    resources: ParsedResource[];        // All extracted resources
    downloads: ProcessedDownload[];     // Successfully downloaded (base64)
    errors: ProcessingError[];          // Failed downloads
  }
}
```

### Types

#### ParsedResource
```typescript
{
  url: string;              // Original URL
  normalizedUrl: string;    // Absolute URL
  type: string;             // 'pdf' | 'image' | 'document' | 'unknown'
  extension: string;        // File extension (e.g., '.pdf')
  element: {
    tag: string;           // HTML tag (e.g., 'a')
    attribute: string;     // Attribute name (e.g., 'href')
    outerHTML: string;     // Full HTML element
  };
  context?: {
    altText?: string;
    title?: string;
    ariaLabel?: string;
  };
  isExternal: boolean;
  position?: number;
}
```

#### ProcessedDownload
```typescript
{
  url: string;         // Original URL
  data: string;        // Base64 encoded file data
  filename: string;    // Generated filename
  mimeType: string;    // MIME type from server
  size: number;        // File size in bytes
}
```

#### ProcessingError
```typescript
{
  url: string;         // Failed URL
  error: string;       // Error message
}
```

### Error Response
```typescript
{
  success: false;
  error: string;       // Error category
  details?: string;    // Detailed error message
}
```

## Features

### HTML Parsing
- Extracts resources from `<a>` tags (PDFs, Word docs, etc.)
- Resolves relative URLs using baseUrl
- Supports 21 file formats
- Automatic deduplication

### Resource Downloading
- **Concurrency**: 3 parallel downloads
- **Retry Logic**: 3 attempts with exponential backoff
- **Timeout**: 30 seconds per resource
- **Size Limit**: 50MB per file, 100MB total

### Rate Limiting
- **5 requests per minute** per IP address
- Returns 429 status with `Retry-After` header

### Error Handling
- Partial success: Returns successful downloads even if some fail
- Detailed error messages for debugging
- Validation for all inputs

## Limits

### Request Limits
- **HTML Size**: 10MB maximum
- **Rate Limit**: 5 requests/minute per IP

### Download Limits
- **Per File**: 50MB maximum
- **Total**: 100MB for all files combined
- **Timeout**: 30 seconds per file
- **Concurrency**: 3 files at a time

## Usage Example

### Client-Side Processing
```typescript
async function processNewsletter(html: string, baseUrl?: string) {
  try {
    // Step 1: Server-side parse and download
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, baseUrl })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    // Step 2: Client-side upload to CMS (using Valu API)
    const urlMap = new Map<string, string>();

    for (const download of result.data.downloads) {
      // Convert base64 back to binary
      const binary = atob(download.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: download.mimeType });

      // Upload to CMS
      const cmsUrl = await uploadToCms(blob, download.filename);
      urlMap.set(download.url, cmsUrl);
    }

    // Step 3: Replace URLs in HTML
    let modifiedHtml = html;
    for (const [originalUrl, cmsUrl] of urlMap) {
      modifiedHtml = modifiedHtml.replace(
        new RegExp(escapeRegex(originalUrl), 'g'),
        cmsUrl
      );
    }

    return {
      html: modifiedHtml,
      resources: result.data.resources,
      urlMap,
      errors: result.data.errors
    };
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
}
```

## Testing

Tests are located in `__tests__/route.test.ts` and cover:
- HTML parsing and resource extraction
- Resource downloading simulation
- Base64 encoding/decoding
- Error handling
- Integration workflow

Run tests:
```bash
npm test -- app/api/process/__tests__/route.test.ts
```

## Security Considerations

1. **Rate Limiting**: Prevents abuse with 5 requests/minute per IP
2. **Size Limits**: Prevents memory exhaustion
3. **Timeout Protection**: 30-second timeout per download
4. **Input Validation**: All inputs validated before processing
5. **Error Sanitization**: Errors don't expose internal details

## Performance

- **Parsing**: ~10ms for typical newsletter HTML
- **Downloads**: Depends on file sizes and network
- **Concurrency**: 3 parallel downloads reduce total time
- **Base64 Encoding**: ~1ms per MB

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid request body | JSON parsing failed |
| 400 | Invalid HTML content | HTML missing or wrong type |
| 400 | Invalid base URL | baseUrl wrong type |
| 413 | HTML content too large | Exceeds 10MB |
| 413 | Total download size exceeds limit | Exceeds 100MB |
| 429 | Rate limit exceeded | Too many requests |
| 500 | Failed to process newsletter | Internal error |

## Related Files

- `/lib/parser` - HTML parsing logic
- `/lib/downloader` - Resource downloading
- `/types/api.ts` - API type definitions
- `/types/parser.ts` - Parser type definitions

## Future Enhancements

1. **Streaming**: Stream large files instead of loading in memory
2. **Caching**: Cache parsed results for repeated URLs
3. **Webhooks**: Async processing with webhook callback
4. **Progress**: WebSocket for real-time progress updates
5. **Compression**: Compress base64 data for transfer
