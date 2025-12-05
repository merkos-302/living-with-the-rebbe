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
├── layout.tsx                 # Root layout with providers ✅
├── page.tsx                   # Landing page ✅
├── providers.tsx              # Client-side providers ✅
├── globals.css                # Global styles ✅
├── admin/
│   ├── layout.tsx            # Authenticated wrapper ✅
│   ├── page.tsx              # Admin dashboard with tabs (Resources, HTML, Stats) ✅
│   ├── process/
│   │   └── page.tsx          # HTML processing interface (future)
│   └── history/
│       └── page.tsx          # Processing history view (future)
└── api/
    ├── parse/
    │   └── route.ts          # HTML parsing endpoint ✅
    ├── fetch-html/
    │   └── route.ts          # Server-side URL fetcher with rate limiting ✅
    ├── process/
    │   └── route.ts          # Full processing pipeline endpoint ✅
    └── download-resource/
        └── route.ts          # Server-side resource download (avoid CORS) ✅

components/
├── admin/
│   ├── HtmlInput.tsx         # Dual-mode input (URL fetch + paste) ✅
│   ├── UrlInput.tsx          # URL fetch interface ✅
│   ├── ParseResults.tsx      # Resource grid with filtering and statistics ✅
│   ├── ResourcePreview.tsx   # Individual resource cards ✅
│   ├── HtmlPreview.tsx       # Code viewer with syntax highlighting ✅
│   ├── ProcessingProgress.tsx # Processing progress indicators ✅
│   ├── ProcessedOutput.tsx   # Output HTML viewer with copy button ✅
│   └── README.md             # Component documentation ✅
├── valu/
│   ├── ValuFrameGuard.tsx    # Iframe enforcement ✅
│   └── AccessDenied.tsx      # Access denied UI ✅
├── LoadingSpinner.tsx        # Loading states ✅
└── ui/
    ├── Button.tsx            # Radix UI components (future)
    ├── Dialog.tsx
    └── Toast.tsx
```

### Core Processing Pipeline

```
lib/
├── valu-api-singleton.ts     # Valu API instance manager ✅
├── health-performance-monitor.ts # Health monitoring ✅
├── loggers.ts                # Logging utilities ✅
├── parser/                   # ✅ COMPLETE
│   ├── html-parser.ts        # Cheerio HTML parsing ✅
│   ├── resource-identifier.ts # Identifies 21 file formats ✅
│   ├── index.ts              # Public API ✅
│   ├── demo.ts               # Example usage ✅
│   ├── README.md             # Full documentation ✅
│   └── __tests__/            # 181 comprehensive tests across 7 test suites ✅
├── fetcher/                  # ✅ COMPLETE
│   ├── url-fetcher.ts        # Server-side HTML fetcher ✅
│   ├── README.md             # Full documentation ✅
│   └── __tests__/            # Comprehensive tests ✅
├── downloader/                  # ✅ COMPLETE (23 tests)
│   ├── resource-downloader.ts # Download files with retry logic ✅
│   ├── types.ts               # TypeScript interfaces ✅
│   └── index.ts               # Public exports ✅
├── cms/                         # ✅ COMPLETE (56 tests)
│   ├── cms-uploader.ts        # Upload to CMS via Valu Service Intents ✅
│   ├── file-converter.ts      # ArrayBuffer → File/FileList conversion ✅
│   ├── types.ts               # TypeScript interfaces ✅
│   └── index.ts               # Public exports ✅
├── replacer/                    # ✅ COMPLETE (36 tests)
│   ├── url-replacer.ts        # Cheerio-based URL swapping ✅
│   ├── types.ts               # TypeScript interfaces ✅
│   └── index.ts               # Public exports ✅
├── processor/                   # ✅ COMPLETE
│   ├── resource-processor.ts  # Full pipeline coordinator ✅
│   ├── types.ts               # Processing types ✅
│   └── index.ts               # Public exports ✅
└── db/
    ├── connection.ts         # MongoDB connection (future)
    └── models.ts             # Mongoose schemas (future)

contexts/
├── ValuApiContext.tsx        # Valu API context ✅
└── AuthContext.tsx           # Auth context ✅

hooks/
├── useValuApi.ts             # API connection hook ✅
├── useValuAuth.ts            # Authentication hook ✅
├── useHtmlParser.ts          # HTML parser state management ✅
└── useProcessing.ts          # Processing state management ✅

utils/
├── env.ts                    # Environment validation ✅
├── logger.ts                 # Logging utilities ✅
└── valuAuthCookie.ts         # Cookie-based user caching ✅
```

## Data Flow

### 1. Input Phase
```typescript
interface NewsletterInput {
  // URL Fetch Mode (default)
  url?: string;              // Newsletter URL (S3, web, etc.)

  // Paste Mode (fallback)
  html?: string;             // Pasted HTML content
  baseUrl?: string;          // Base URL for resolving relative URLs

  // Common fields
  timestamp: Date;           // Processing start time
  adminId: string;           // Admin user ID from Valu
}
```

### 2. Parsing Phase
```typescript
interface ParsedResource {
  url: string;               // Original URL
  normalizedUrl: string;     // Absolute URL (resolved from base URL if relative)
  type: ResourceType;        // PDF, DOCUMENT, IMAGE, UNKNOWN
  extension: string;         // File extension
  isExternal: boolean;       // True if not same domain as base URL
  source: ResourceSource;    // Where it was found (LINK, IMAGE, EMBED, etc.)
  context?: {                // Optional context
    altText?: string;
    title?: string;
    ariaLabel?: string;
  };
}

enum ResourceType {
  PDF = 'pdf',
  DOCUMENT = 'document',
  IMAGE = 'image',
  UNKNOWN = 'unknown'
}
```

**Key Implementation Details**:
1. The parser ONLY extracts resources from `<a href>` tags (linked documents like PDFs and Word docs), NOT from `<img src>` tags (inline images). This is intentional - inline images are part of the email's visual content, while only downloadable resources need CMS hosting.
2. URL fetch mode is the DEFAULT, automatically resolving all relative URLs using the base URL extracted from the fetched HTML.
3. Paste mode with manual base URL field is available as fallback for cases where URL fetching isn't possible.

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