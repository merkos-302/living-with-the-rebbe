ב״ה
# Architecture - Living with the Rebbe

## System Overview

Living with the Rebbe is a newsletter resource processor that runs as an iframe within ChabadUniverse. It processes HTML content to centralize external resources on the CMS platform.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     ChabadUniverse Platform                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Valu Social iframe                  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │        Living with the Rebbe Admin Tool        │  │   │
│  │  │                                                 │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │   │
│  │  │  │   HTML    │→ │  Parser  │→ │ Resource │    │  │   │
│  │  │  │   Input   │  │ (Cheerio)│  │Extractor │    │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘    │  │   │
│  │  │                      ↓                         │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │   │
│  │  │  │   URL     │← │   CMS    │← │ Resource │    │  │   │
│  │  │  │ Replacer  │  │ Uploader │  │Downloader│    │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘    │  │   │
│  │  │                      ↓                         │  │   │
│  │  │               ┌──────────┐                     │  │   │
│  │  │               │  Output  │                     │  │   │
│  │  │               │   HTML   │                     │  │   │
│  │  │               └──────────┘                     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                           ↓                           │   │
│  │                    Valu API Layer                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↓                               │
│                  ChabadUniverse CMS Backend                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Resource Storage                                   │   │
│  │  • Authentication Management                          │   │
│  │  • URL Redirection Logic                            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend (Next.js App)

```
app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Landing page
└── admin/
    ├── page.tsx              # Admin dashboard
    ├── process/
    │   └── page.tsx          # HTML processing interface
    └── history/
        └── page.tsx          # Processing history view

components/
├── admin/
│   ├── HtmlInput.tsx         # HTML paste/upload component
│   ├── ResourceList.tsx      # Display extracted resources
│   ├── ProcessingStatus.tsx  # Real-time processing updates
│   └── OutputViewer.tsx      # Modified HTML display
└── ui/
    ├── Button.tsx            # Radix UI components
    ├── Dialog.tsx
    └── Toast.tsx
```

### Core Processing Pipeline

```
lib/
├── parser/
│   ├── htmlParser.ts         # Cheerio HTML parsing
│   ├── resourceExtractor.ts  # Extract external URLs
│   └── urlValidator.ts       # Validate resource URLs
├── processor/
│   ├── resourceDownloader.ts # Download files in parallel
│   ├── fileValidator.ts      # Validate file types/sizes
│   └── urlReplacer.ts        # Replace URLs in HTML
├── cms/
│   ├── cmsUploader.ts        # Upload to CMS via Valu API
│   ├── authHandler.ts        # Handle authentication
│   └── errorRetry.ts         # Retry failed uploads
└── db/
    ├── connection.ts         # MongoDB connection
    └── models.ts             # Mongoose schemas
```

## Data Flow

### 1. Input Phase
```typescript
interface NewsletterInput {
  html: string;              // Pasted HTML content
  timestamp: Date;           // Processing start time
  adminId: string;          // Admin user ID from Valu
}
```

### 2. Parsing Phase
```typescript
interface ParsedResource {
  originalUrl: string;       // Original resource URL
  type: 'pdf' | 'image' | 'document';
  fileName: string;
  fileSize?: number;
}
```

### 3. Processing Phase
```typescript
interface ProcessedResource {
  originalUrl: string;
  cmsUrl: string;           // New CMS URL
  uploadId: string;         // CMS resource ID
  status: 'success' | 'failed';
  error?: string;
}
```

### 4. Output Phase
```typescript
interface ProcessingResult {
  originalHtml: string;
  modifiedHtml: string;
  resources: ProcessedResource[];
  processingTime: number;
  success: boolean;
}
```

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible components
- **Cheerio**: Server-side HTML parsing

### Backend
- **Node.js**: Runtime
- **MongoDB**: Processing history storage
- **Mongoose**: ODM for MongoDB
- **Axios**: HTTP client for downloads

### Infrastructure
- **Vercel**: Hosting platform
- **MongoDB Atlas**: Database hosting
- **Valu API**: CMS integration

## Security Considerations

### Authentication
- Admin-only access via Valu authentication
- Session validation on each request
- No public endpoints exposed

### File Processing
- File type validation (whitelist approach)
- Size limits for uploads
- Virus scanning before CMS upload (if available)

### Data Protection
- No sensitive data stored locally
- Processing history contains only metadata
- Original newsletters not cached

## Performance Optimization

### Parallel Processing
```javascript
// Download resources in parallel
const downloads = await Promise.all(
  resources.map(resource => downloadResource(resource))
);

// Upload to CMS in batches
const uploads = await uploadInBatches(downloads, 5);
```

### Caching Strategy
- No local caching of resources
- CMS handles all resource caching
- Processing history for duplicate detection

## Error Handling

### Retry Logic
```javascript
async function uploadWithRetry(resource, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await cmsUploader.upload(resource);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
}
```

### Error Recovery
- Failed uploads logged for manual retry
- Partial success handling (some resources fail)
- Admin notification on critical failures

## Deployment Architecture

### Production Environment
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│  MongoDB    │     │ChabadUniverse│
│   (Next.js) │     │   Atlas     │     │     CMS      │
└─────────────┘     └─────────────┘     └─────────────┘
       ↑                                        ↑
       │                                        │
       └────────────────────────────────────────┘
                    Valu API
```

### Development Environment
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Local Dev  │────▶│Local MongoDB│────▶│  Mock CMS   │
│ (localhost) │     │   (Docker)  │     │   Server    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Monitoring & Observability

### Metrics to Track
- Processing time per newsletter
- Number of resources processed
- Upload success/failure rates
- CMS API response times

### Logging
- Structured logging with levels
- Processing session tracking
- Error aggregation for debugging

## Future Scalability

### Potential Enhancements
1. **Queue System**: Add Redis for job queuing
2. **Worker Processes**: Separate processing workers
3. **CDN Integration**: Direct CDN uploads
4. **Batch Processing**: Multiple newsletters at once
5. **API Rate Limiting**: Respect CMS limits

### Database Schema Evolution
```javascript
// Current: Simple processing records
ProcessingSession {
  newsletterId: string,
  resources: Resource[],
  status: string
}

// Future: Advanced analytics
ProcessingAnalytics {
  newsletterId: string,
  resources: DetailedResource[],
  performance: PerformanceMetrics,
  userEngagement: EngagementData
}
```