ב׳׳ה
# Architecture: Living with the Rebbe Admin Tool

## Executive Summary

This document outlines the architecture for the "Living with the Rebbe" admin tool - a scraping and publishing application that runs as an iframe within ChabadUniverse. The tool enables channel administrators to scrape archived newsletters and publish them to community channels.

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                 ChabadUniverse                       │
│  ┌─────────────────────────────────────────────┐    │
│  │         Living with Rebbe (iframe)          │    │
│  │                                              │    │
│  │  [Admin Dashboard] → [Scrape] → [Publish]   │    │
│  │         ↓               ↓           ↓       │    │
│  │    [Valu Auth]    [S3 Archive]  [CMS API]   │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  [Community Channel] ← [Newsletter Posts w/ Media]  │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

### Core Framework
- **Next.js 15.x** - React framework for the admin interface
- **React 18.x** - UI library
- **TypeScript** - Type safety

### Integration Layer
- **@arkeytyp/valu-api** - Iframe communication and authentication
- **Cheerio** - HTML parsing for newsletter scraping
- **Axios** - HTTP client for API calls

### Data Layer
- **MongoDB** - Document database for state management
- **Mongoose** - ODM for MongoDB
- **MongoDB Atlas** - Production database hosting

### Deployment
- **Vercel** - Hosting platform

## Application Architecture

### 1. Authentication Flow

```typescript
// Admin must authenticate through Valu/ChabadUniverse
const { user, isAuthenticated } = useValuAuth();

// Verify admin permissions for channel
if (!user?.roles?.includes('channel_admin')) {
  return <AccessDenied />;
}
```

### 2. Scraping Pipeline

```
Archive Page → Newsletter List → Individual Newsletters
     ↓              ↓                    ↓
  Parse HTML    Extract URLs      Extract Content
                                         ↓
                                   Media Discovery
                                         ↓
                                    CMS Upload
                                         ↓
                                   URL Rewriting
                                         ↓
                                  Channel Posting
```

### 3. Data Flow

**With MongoDB state management**:

1. **Initialize Session**: Create processing session in DB
2. **Fetch Archive**: GET from S3
3. **Parse Links**: Extract ~400 newsletter URLs
4. **Process Newsletter**:
   - Check DB for existing record (duplicate detection)
   - Fetch HTML from merkos302.com
   - Extract media URLs
   - Upload to CMS (save mappings to DB)
   - Rewrite URLs using saved mappings
   - Post to channel
   - Update DB with success status and post ID
5. **Recovery**: Can resume from last successful operation

## Project Structure

```
living-with-the-rebbe/
├── pages/
│   ├── index.tsx                # Admin dashboard
│   ├── scrape.tsx              # Scraping interface
│   ├── preview.tsx             # Preview before publish
│   └── api/
│       ├── archive/
│       │   └── fetch.ts        # Fetch archive list
│       ├── newsletter/
│       │   └── scrape.ts       # Scrape individual
│       ├── cms/
│       │   └── upload.ts       # Upload media
│       └── channel/
│           └── post.ts         # Post newsletter
│
├── components/
│   └── admin/
│       ├── ScrapeControls.tsx  # UI for scraping
│       ├── NewsletterList.tsx  # List to process
│       ├── PreviewPane.tsx     # Preview HTML
│       └── PublishButton.tsx   # Publish action
│
├── lib/
│   ├── scraper/
│   │   ├── archiveParser.ts   # Parse archive HTML
│   │   ├── newsletterParser.ts # Parse newsletter
│   │   └── mediaExtractor.ts  # Find media URLs
│   ├── cms/
│   │   ├── mediaUploader.ts   # Upload to CMS
│   │   └── urlRewriter.ts     # Replace URLs
│   ├── channel/
│   │   └── publisher.ts        # Post to channel
│   └── db/
│       └── connection.ts      # MongoDB connection
│
├── models/
│   ├── Newsletter.ts          # Newsletter schema
│   ├── ProcessingSession.ts   # Session tracking
│   └── MediaMapping.ts        # URL mappings
│
├── hooks/
│   ├── useValuAuth.ts         # Authentication
│   ├── useScraper.ts          # Scraping logic
│   └── usePublisher.ts        # Publishing logic
│
└── utils/
    ├── hebrew.ts              # RTL text handling
    └── validation.ts          # Input validation
```

## Core Components

### Admin Dashboard
- Display scraping status
- Show newsletter queue
- Publishing controls
- Error reporting

### Scraping Engine
```typescript
class NewsletterScraper {
  async fetchArchive(year: string): Promise<NewsletterLink[]>
  async scrapeNewsletter(url: string): Promise<Newsletter>
  async extractMedia(html: string): Promise<MediaUrl[]>
}
```

### CMS Integration
```typescript
class CMSClient {
  async uploadMedia(url: string): Promise<string>  // Returns CMS URL
  async postToChannel(newsletter: ProcessedNewsletter): Promise<void>
}
```

### URL Rewriting
```typescript
function rewriteUrls(html: string, urlMap: Map<string, string>): string {
  // Replace all media URLs with CMS URLs
  // Preserve all other links as-is
}
```

## Database Schemas

### Newsletter Schema
```typescript
const NewsletterSchema = new Schema({
  slug: { type: String, unique: true, required: true }, // "5785-nitzavim-vayeilech"
  sourceUrl: { type: String, required: true },
  year: { type: Number, required: true },
  parsha: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  channelPostId: String,  // ID from ChabadUniverse after posting
  error: String,
  retryCount: { type: Number, default: 0 },
  mediaMapping: [{
    original: String,
    cms: String,
    uploadedAt: Date
  }],
  scrapedAt: Date,
  postedAt: Date
}, { timestamps: true });
```

### ProcessingSession Schema
```typescript
const ProcessingSessionSchema = new Schema({
  sessionId: { type: String, unique: true },
  startedBy: String,  // Admin user ID from Valu
  totalNewsletters: Number,
  processed: { type: Number, default: 0 },
  successful: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  currentNewsletter: String,
  status: {
    type: String,
    enum: ['running', 'paused', 'completed', 'failed']
  }
}, { timestamps: true });
```

## API Endpoints

### Internal API Routes

```typescript
// GET /api/archive/fetch
// Returns list of newsletters from archive

// POST /api/newsletter/scrape
// Scrapes individual newsletter
{
  url: string
}

// POST /api/cms/upload
// Uploads media to CMS
{
  mediaUrl: string
}

// POST /api/channel/post
// Posts newsletter to channel
{
  html: string,
  tags: string[],
  title: string
}
```

### External API Requirements

**ChabadUniverse CMS API:**
```typescript
// PUT /api/cms/media
// Upload media file, returns URL

// POST /api/channels/{channelId}/posts
// Create newsletter post with tags

// GET /api/auth/user
// Verify admin permissions
```

## Security Considerations

1. **Authentication**: All operations require admin authentication
2. **Authorization**: Channel admin role verification
3. **CORS**: Configured for ChabadUniverse origin only
4. **Rate Limiting**: Prevent overwhelming source servers
5. **Input Validation**: Sanitize HTML content

## Performance Optimization

1. **Parallel Processing**: Upload media concurrently
2. **Database Indexing**: Indexed on slug for fast lookups
3. **Lazy Loading**: Process newsletters on-demand
4. **Progress Tracking**: Real-time status updates from DB
5. **Batch Operations**: Process multiple newsletters in parallel

## Error Handling

```typescript
try {
  // Scraping operation
} catch (error) {
  if (error.code === 'MEDIA_UPLOAD_FAILED') {
    // Retry with exponential backoff
  } else if (error.code === 'AUTH_INVALID') {
    // Check API key validity
  } else {
    // Log and display to admin
  }
}
```

## Deployment Configuration

**.env.production:**
```env
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=[api-key]
CHABAD_UNIVERSE_CHANNEL_ID=[channel-id]
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com
MONGODB_URI=mongodb+srv://[username]:[password]@[cluster].mongodb.net/living-with-rebbe
```

**vercel.json:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "ALLOW-FROM https://chabaduniverse.com"
        }
      ]
    }
  ]
}
```

## Monitoring & Logging

- Scraping progress tracking
- Media upload success/failure rates
- Newsletter posting confirmations
- Error logs for debugging

## Future Considerations

- Batch processing for multiple newsletters
- Scheduling for automatic updates
- Email delivery system (Phase 2)
- Duplicate detection before posting