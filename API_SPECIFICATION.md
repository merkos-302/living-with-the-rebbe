ב׳׳ה
# ChabadUniverse API Specification

## Overview

This document specifies the API endpoints required from the ChabadUniverse platform to enable the Living with the Rebbe admin tool functionality. These APIs need to be implemented by the Valu Social/ChabadUniverse team before development can proceed.

**Status**: ⚠️ **NOT IMPLEMENTED** - This is a specification for APIs that need to be created.

## Table of Contents
1. [Authentication](#authentication)
2. [Media Management](#media-management)
3. [Channel Operations](#channel-operations)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [OpenAPI Specification](#openapi-specification)

## Authentication

### Overview
The system uses two authentication methods that work together:
1. **Valu OAuth**: User authentication via iframe (existing)
2. **API Key**: Static key for server-to-server API calls (new)

### API Key Authentication

All API requests must include the API key in the Authorization header:

```http
Authorization: Bearer {CHABAD_UNIVERSE_API_KEY}
```

### Verify API Key
```http
GET /api/v1/auth/verify
```

**Headers:**
```http
Authorization: Bearer {API_KEY}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "permissions": ["media.upload", "channel.post", "channel.read"],
  "rateLimit": {
    "requests": 1000,
    "period": "hour",
    "remaining": 950
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": {
    "code": "AUTH_INVALID",
    "message": "Invalid or expired API key"
  }
}
```

## Media Management

### Upload Media Asset

Uploads a media file to the ChabadUniverse CMS and returns the permanent URL.

```http
PUT /api/v1/cms/media
```

**Headers:**
```http
Authorization: Bearer {API_KEY}
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
file: [binary data]
type: "image" | "document" | "audio" | "video"
filename: "newsletter-image.jpg" (optional)
metadata: {
  "source": "living-with-rebbe",
  "year": "5785",
  "parsha": "nitzavim"
} (optional, JSON string)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "media_abc123def456",
    "url": "https://chabaduniverse.com/cms/media/abc123def456.jpg",
    "cdnUrl": "https://cdn.chabaduniverse.com/media/abc123def456.jpg",
    "type": "image",
    "mimeType": "image/jpeg",
    "size": 524288,
    "hash": "sha256:abcdef123456...",
    "uploadedAt": "2024-10-05T10:30:00Z"
  }
}
```

**Response (409 Conflict - Duplicate):**
```json
{
  "success": false,
  "error": {
    "code": "MEDIA_DUPLICATE",
    "message": "Media already exists",
    "existing": {
      "id": "media_existing123",
      "url": "https://chabaduniverse.com/cms/media/existing123.jpg",
      "hash": "sha256:abcdef123456..."
    }
  }
}
```

**Response (413 Payload Too Large):**
```json
{
  "success": false,
  "error": {
    "code": "MEDIA_TOO_LARGE",
    "message": "File size exceeds maximum allowed size",
    "maxSize": 10485760,
    "actualSize": 15728640
  }
}
```

### Check Media Exists

Verify if media with a specific hash already exists (for deduplication).

```http
GET /api/v1/cms/media/check?hash={sha256_hash}
```

**Response (200 OK - Exists):**
```json
{
  "exists": true,
  "media": {
    "id": "media_abc123",
    "url": "https://chabaduniverse.com/cms/media/abc123.jpg",
    "cdnUrl": "https://cdn.chabaduniverse.com/media/abc123.jpg"
  }
}
```

**Response (200 OK - Not Found):**
```json
{
  "exists": false
}
```

### Batch Media Upload Status

Check status of multiple media uploads (useful for batch processing).

```http
POST /api/v1/cms/media/batch-status
```

**Request Body:**
```json
{
  "hashes": [
    "sha256:abc123...",
    "sha256:def456...",
    "sha256:ghi789..."
  ]
}
```

**Response:**
```json
{
  "results": {
    "sha256:abc123...": {
      "exists": true,
      "url": "https://chabaduniverse.com/cms/media/abc123.jpg"
    },
    "sha256:def456...": {
      "exists": false
    },
    "sha256:ghi789...": {
      "exists": true,
      "url": "https://chabaduniverse.com/cms/media/ghi789.pdf"
    }
  }
}
```

## Channel Operations

### Create Channel Post

Posts content to a specified channel.

```http
POST /api/v1/channels/{channelId}/posts
```

**URL Parameters:**
- `channelId`: The target channel identifier

**Headers:**
```http
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Parshas Nitzavim-Vayeilech 5785",
  "content": "<html>...</html>",
  "contentType": "html",
  "tags": ["nitzavim-vayeilech", "5785", "living-with-rebbe"],
  "metadata": {
    "source": "living-with-rebbe",
    "year": 5785,
    "parsha": "nitzavim-vayeilech",
    "originalUrl": "https://merkos302.com/living/Email85/49Nitzavim1.html"
  },
  "publishAt": "2024-09-15T10:00:00Z",
  "idempotencyKey": "newsletter-5785-nitzavim-vayeilech"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "postId": "post_xyz789ghi012",
    "channelId": "channel_main",
    "url": "https://chabaduniverse.com/channels/main/posts/xyz789ghi012",
    "status": "published",
    "publishedAt": "2024-09-15T10:00:00Z"
  }
}
```

**Response (200 OK - Idempotent):**
```json
{
  "success": true,
  "data": {
    "postId": "post_existing456",
    "channelId": "channel_main",
    "url": "https://chabaduniverse.com/channels/main/posts/existing456",
    "status": "published",
    "message": "Post already exists with this idempotency key"
  }
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "CHANNEL_NO_ACCESS",
    "message": "API key does not have permission to post to this channel"
  }
}
```

### Get Channel Post

Retrieve a specific post (useful for verification).

```http
GET /api/v1/channels/{channelId}/posts/{postId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "postId": "post_xyz789",
    "title": "Parshas Nitzavim-Vayeilech 5785",
    "tags": ["nitzavim-vayeilech", "5785"],
    "status": "published",
    "publishedAt": "2024-09-15T10:00:00Z",
    "viewCount": 156,
    "url": "https://chabaduniverse.com/channels/main/posts/xyz789"
  }
}
```

### Check Post Exists

Check if a post with a specific idempotency key already exists.

```http
GET /api/v1/channels/{channelId}/posts/check?idempotencyKey={key}
```

**Response (200 OK - Exists):**
```json
{
  "exists": true,
  "post": {
    "postId": "post_abc123",
    "url": "https://chabaduniverse.com/channels/main/posts/abc123",
    "publishedAt": "2024-09-15T10:00:00Z"
  }
}
```

**Response (200 OK - Not Found):**
```json
{
  "exists": false
}
```

### List Channel Posts

Get posts from a channel (useful for duplicate detection).

```http
GET /api/v1/channels/{channelId}/posts?tag=5785&limit=100
```

**Query Parameters:**
- `tag`: Filter by tag (optional)
- `limit`: Maximum results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `metadata.year`: Filter by year metadata (optional)
- `metadata.parsha`: Filter by parsha metadata (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "postId": "post_123",
        "title": "Parshas Nitzavim-Vayeilech 5785",
        "tags": ["nitzavim-vayeilech", "5785"],
        "publishedAt": "2024-09-15T10:00:00Z",
        "metadata": {
          "year": 5785,
          "parsha": "nitzavim-vayeilech"
        }
      }
    ],
    "pagination": {
      "total": 52,
      "limit": 100,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    },
    "requestId": "req_abc123def456"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID` | 401 | Invalid or missing API key |
| `AUTH_FORBIDDEN` | 403 | Valid key but insufficient permissions |
| `CHANNEL_NOT_FOUND` | 404 | Channel does not exist |
| `POST_NOT_FOUND` | 404 | Post does not exist |
| `MEDIA_DUPLICATE` | 409 | Media already exists (includes existing URL) |
| `MEDIA_TOO_LARGE` | 413 | File exceeds size limit |
| `MEDIA_INVALID_TYPE` | 415 | Unsupported media type |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `INTERNAL_ERROR` | 500 | Server error |

### Retry Strategy

**Retryable Errors (use exponential backoff):**
- 429 (Rate Limit) - Check `Retry-After` header
- 500, 502, 503, 504 (Server errors)
- Network timeouts

**Non-Retryable Errors:**
- 400 (Bad Request)
- 401 (Unauthorized)
- 403 (Forbidden)
- 404 (Not Found)
- 413 (Payload Too Large)

## Rate Limiting

### Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1633435200
Retry-After: 3600 (only on 429 responses)
```

### Limits

| Endpoint | Limit | Period |
|----------|-------|--------|
| Media Upload | 100 | Hour |
| Channel Post | 500 | Hour |
| Read Operations | 1000 | Hour |

### Batch Operations

For efficient processing:
- Media uploads can be parallelized (max 3 concurrent)
- Use idempotency keys to safely retry
- Check existence before uploading to avoid duplicates

## OpenAPI Specification

### Minimal OpenAPI 3.0 Template

```yaml
openapi: 3.0.0
info:
  title: ChabadUniverse API
  version: 1.0.0
  description: API for Living with the Rebbe newsletter publishing

servers:
  - url: https://api.chabaduniverse.com/v1
    description: Production
  - url: https://staging-api.chabaduniverse.com/v1
    description: Staging
  - url: http://localhost:3001/v1
    description: Development

components:
  securitySchemes:
    ApiKeyAuth:
      type: http
      scheme: bearer

  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
            requestId:
              type: string

    MediaUploadResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            id:
              type: string
            url:
              type: string
            cdnUrl:
              type: string
            type:
              type: string
            size:
              type: integer
            hash:
              type: string
            uploadedAt:
              type: string
              format: date-time

    PostCreateRequest:
      type: object
      required:
        - title
        - content
        - idempotencyKey
      properties:
        title:
          type: string
        content:
          type: string
        tags:
          type: array
          items:
            type: string
        metadata:
          type: object
        idempotencyKey:
          type: string

paths:
  /auth/verify:
    get:
      summary: Verify API key
      security:
        - ApiKeyAuth: []
      responses:
        '200':
          description: Valid API key
        '401':
          description: Invalid API key

  /cms/media:
    put:
      summary: Upload media file
      security:
        - ApiKeyAuth: []
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                type:
                  type: string
                  enum: [image, document, audio, video]
      responses:
        '200':
          description: Upload successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MediaUploadResponse'
        '409':
          description: Media already exists
        '413':
          description: File too large

  /channels/{channelId}/posts:
    post:
      summary: Create channel post
      security:
        - ApiKeyAuth: []
      parameters:
        - name: channelId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PostCreateRequest'
      responses:
        '201':
          description: Post created
        '200':
          description: Post already exists (idempotent)
        '403':
          description: No permission for channel

security:
  - ApiKeyAuth: []
```

## Implementation Priority

### Phase 1 (Critical - Week 1)
1. ✅ API Key verification endpoint
2. ✅ Media upload endpoint with deduplication
3. ✅ Basic error handling

### Phase 2 (Required - Week 2)
1. ✅ Channel post creation with idempotency
2. ✅ Post existence checking
3. ✅ Rate limiting

### Phase 3 (Nice to Have - Week 3)
1. ✅ Batch status checking
2. ✅ Post listing with filters
3. ✅ Enhanced metadata support

## Testing Requirements

### Development Environment
- Mock API server for local development
- Sample API key for testing: `test_key_development_only`
- Docker compose for local API simulation

### Staging Environment
- Dedicated test channel: `channel_test`
- Rate limits relaxed for testing
- Data automatically cleaned after 24 hours

### Integration Tests
```typescript
// Example test for media upload
describe('Media Upload', () => {
  it('should upload new media successfully', async () => {
    const response = await uploadMedia(testFile);
    expect(response.status).toBe(200);
    expect(response.data.url).toMatch(/^https:\/\/chabaduniverse\.com/);
  });

  it('should return existing URL for duplicate', async () => {
    const response1 = await uploadMedia(testFile);
    const response2 = await uploadMedia(testFile);
    expect(response2.status).toBe(409);
    expect(response2.error.existing.url).toBe(response1.data.url);
  });
});
```

## Security Considerations

### API Key Management
- Keys should be environment-specific
- Rotate keys every 90 days
- Log all key usage for auditing
- Implement key revocation mechanism

### Input Validation
- Sanitize HTML content before posting
- Validate file types and sizes
- Escape special characters in tags
- Limit request body sizes

### CORS Configuration
For iframe integration:
```
Access-Control-Allow-Origin: https://chabaduniverse.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

## Support and Questions

### API Documentation
- Swagger UI: `https://api.chabaduniverse.com/docs`
- Postman Collection: [Download Link]
- API Status: `https://status.chabaduniverse.com`

### Contact
- API Team: api-team@chabaduniverse.com
- Slack: #api-support
- Emergency: [On-call rotation]

## Appendix: Example Requests

### Complete Upload and Post Flow

```bash
# 1. Verify API key
curl -X GET https://api.chabaduniverse.com/v1/auth/verify \
  -H "Authorization: Bearer YOUR_API_KEY"

# 2. Upload media
curl -X PUT https://api.chabaduniverse.com/v1/cms/media \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@newsletter-image.jpg" \
  -F "type=image"

# 3. Create post with uploaded media URL
curl -X POST https://api.chabaduniverse.com/v1/channels/main/posts \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Parshas Nitzavim 5785",
    "content": "<html><img src=\"https://chabaduniverse.com/cms/media/abc123.jpg\">...</html>",
    "tags": ["nitzavim", "5785"],
    "idempotencyKey": "newsletter-5785-nitzavim"
  }'
```

---

**Note**: This specification must be implemented by the ChabadUniverse/Valu Social team before the Living with the Rebbe admin tool can be developed. Once implemented, update this document with actual endpoints and any deviations from the specification.