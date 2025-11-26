# HTML Fetch API

Server-side API endpoint for fetching HTML from URLs to avoid CORS issues.

## Endpoint

```
POST /api/fetch-html
GET  /api/fetch-html  (API information)
```

## Features

- **Domain Whitelisting**: Only allows fetching from approved domains
- **Rate Limiting**: Max 10 requests per minute per IP
- **Caching**: 15-minute cache for fetched HTML
- **URL Resolution**: Automatically resolves relative URLs to absolute
- **Timeout Protection**: 30-second timeout for fetch operations
- **Error Handling**: Comprehensive error messages

## Whitelisted Domains

- `merkos-living.s3.us-west-2.amazonaws.com`
- `merkos-living.s3.amazonaws.com`
- `merkos302.com`
- Any subdomain of `merkos302.com` (e.g., `www.merkos302.com`, `sub.merkos302.com`)

## Request

### POST /api/fetch-html

**Body:**
```json
{
  "url": "https://merkos302.com/newsletter.html"
}
```

**Headers:**
```
Content-Type: application/json
```

## Response

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "html": "<html>...</html>",
    "baseUrl": "https://merkos302.com",
    "resolvedHtml": "<html>...</html>",
    "metadata": {
      "fetchTime": 1234,
      "htmlLength": 5000,
      "resolvedLength": 5200
    }
  }
}
```

### Error Response (400, 429, 500)

```json
{
  "success": false,
  "error": "Invalid URL",
  "details": "Domain example.com is not whitelisted"
}
```

## Status Codes

- **200**: Success
- **400**: Bad Request (invalid URL, malformed JSON, unauthorized domain)
- **429**: Rate Limit Exceeded
- **500**: Server Error (fetch failed, timeout)

## Rate Limit Headers

When rate limited (429), the response includes:

```
Retry-After: 60
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890000
```

## Usage Example

```typescript
import type { FetchHtmlRequest, FetchHtmlResponse } from '@/types/api';

const response = await fetch('/api/fetch-html', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://merkos302.com/newsletter.html',
  } as FetchHtmlRequest),
});

const data: FetchHtmlResponse = await response.json();

if (data.success) {
  console.log('HTML:', data.data.html);
  console.log('Resolved HTML:', data.data.resolvedHtml);
} else {
  console.error('Error:', data.error);
}
```

## Error Scenarios

### Invalid URL Format
```json
{
  "success": false,
  "error": "Invalid URL",
  "details": "Invalid URL format"
}
```

### Non-whitelisted Domain
```json
{
  "success": false,
  "error": "Invalid URL",
  "details": "Domain evil.com is not whitelisted. Allowed domains: ..."
}
```

### Rate Limit Exceeded
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "details": "Too many requests. Please try again in 60 seconds."
}
```

### Fetch Timeout
```json
{
  "success": false,
  "error": "Failed to fetch HTML",
  "details": "Request timed out after 30 seconds"
}
```

### Network Error
```json
{
  "success": false,
  "error": "Failed to fetch HTML",
  "details": "Network error: Connection refused"
}
```

## Implementation Details

- Uses the `url-fetcher` utility from `/lib/fetcher/url-fetcher.ts`
- In-memory cache with automatic cleanup
- Per-IP rate limiting
- Client IP extracted from `x-forwarded-for` or `x-real-ip` headers
- Comprehensive validation and error handling

## Testing

Tests are located at `/app/api/fetch-html/__tests__/route.test.ts`

Run tests:
```bash
npm test -- app/api/fetch-html/__tests__/route.test.ts
```

Tests cover:
- URL validation
- Domain whitelisting
- Rate limiting logic
- Cache behavior
- Error handling
- Response formatting
- Timeout logic
