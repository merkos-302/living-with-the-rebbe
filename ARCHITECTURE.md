ב׳׳ה
# Architecture: Living with the Rebbe Admin Tool

## Executive Summary

This document outlines the architecture for the "Living with the Rebbe" admin tool - a scraping and publishing application that runs as an iframe within ChabadUniverse. The tool enables channel administrators to scrape and publish newsletters to community channels.

**MVP Scope**: Process 3 most recent newsletters + weekly updates (not 400 historical newsletters)

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   ChabadUniverse Platform                │
│  ┌───────────────────────────────────────────────────┐  │
│  │      Living with the Rebbe Admin Tool (iframe)     │  │
│  │                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │  │
│  │  │  Admin   │→ │  Scrape  │→ │   Process    │    │  │
│  │  │Dashboard │  │  Archive │  │  Newsletter  │    │  │
│  │  └──────────┘  └──────────┘  └──────────────┘    │  │
│  │       ↓             ↓               ↓             │  │
│  │  [Valu Auth]   [S3 Archive]   [Local Cache]       │  │
│  └───────────────────────────────────────────────────┘  │
│                           ↓                              │
│              [Future: Auto-publish to Channel]           │
└─────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### MVP Newsletter Processing Flow
```
   S3 Archive                    Local System                    Output
       │                              │                            │
       ▼                              ▼                            ▼
┌─────────────┐            ┌───────────────────┐         ┌──────────────┐
│   Archive   │  fetch     │   Newsletter      │ export  │  JSON File   │
│    HTML     │──────────▶ │    Scraper       │────────▶│    + Email   │
└─────────────┘            └───────────────────┘         └──────────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │   Media Cache     │
                           │  (Local Storage)  │
                           └───────────────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │    MongoDB        │
                           │  (State Tracking) │
                           └───────────────────┘
```

### Future API Integration Flow
```
When ChabadUniverse API Available:

   JSON Export                     CMS API                  Channel
       │                              │                        │
       ▼                              ▼                        ▼
┌─────────────┐            ┌───────────────────┐    ┌──────────────┐
│  Processed  │  upload    │   Media Upload    │    │  Newsletter  │
│ Newsletter  │──────────▶ │   (PUT /media)    │───▶│    Post     │
└─────────────┘            └───────────────────┘    └──────────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │  Channel Publish  │
                           │ (POST /channels)  │
                           └───────────────────┘
```

## Tech Stack

### Core Framework
- **Next.js 15.x** - React framework for the admin interface
- **React 18.x** - UI library
- **TypeScript** - Type safety

### Integration Layer
- **@arkeytyp/valu-api** - Iframe communication and authentication
- **Valu Social Dev Tool** - Enables localhost testing within production iframe
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

### 2. Processing Pipeline Stages

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   FETCH    │────▶│   PARSE    │────▶│   CACHE    │────▶│   EXPORT   │
│            │     │            │     │            │     │            │
│ S3 Archive │     │Extract HTML│     │Download    │     │JSON Output │
│            │     │   & Media  │     │   Media    │     │   + Email  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
      │                   │                  │                  │
      ▼                   ▼                  ▼                  ▼
  [MongoDB]          [MongoDB]          [MongoDB]          [MongoDB]
   (Track)            (Store)           (Update)           (Complete)
```

### 3. Component Interaction

```
    Frontend (Next.js)              Backend (API Routes)           External
         │                                  │                         │
    ┌────────┐                       ┌──────────┐              ┌──────────┐
    │ Admin  │──────Request────────▶│  Scrape  │────Fetch────▶│    S3    │
    │   UI   │                       │   API    │               │ Archive  │
    └────────┘                       └──────────┘              └──────────┘
         ▲                                  │
         │                                  ▼
    Status Update                    ┌──────────┐
         │                           │ Process  │
         │                           │   API    │
         │                           └──────────┘
         │                                  │
         │                                  ▼
    ┌────────┐                       ┌──────────┐              ┌──────────┐
    │Progress│◀──────Update─────────│ MongoDB  │              │  Email   │
    │Display │                       │   Store  │──Notify────▶│  Service │
    └────────┘                       └──────────┘              └──────────┘
```

## Project Structure

**Current State (Epic #2 Complete)**:

```
living-with-the-rebbe/
├── app/                        # Next.js 15 App Router ✅
│   ├── layout.tsx             # Root layout with fonts ✅
│   ├── page.tsx               # Home page ✅
│   ├── globals.css            # Global styles ✅
│   ├── admin/                 # Admin pages (Epic #6)
│   │   └── page.tsx          # Dashboard
│   └── api/                   # API routes (Epic #7)
│       ├── scrape/
│       │   └── route.ts      # Scraping endpoints
│       ├── status/
│       │   └── route.ts      # Status endpoints
│       └── export/
│           └── route.ts      # Export endpoints
│
├── components/                # React components ✅
│   ├── admin/                # Admin UI (Epic #6)
│   │   ├── NewsletterList.tsx
│   │   ├── ProcessingStatus.tsx
│   │   └── ScrapeControls.tsx
│   └── ui/                   # Reusable UI (Epic #6)
│       ├── button.tsx
│       ├── dialog.tsx
│       └── toast.tsx
│
├── lib/                      # Core libraries ✅
│   ├── scraper/             # Scraping logic (Epic #5)
│   │   ├── archive.ts
│   │   ├── newsletter.ts
│   │   └── media.ts
│   ├── cms/                 # CMS integration (Epic #8)
│   │   ├── client.ts
│   │   └── upload.ts
│   ├── db/                  # Database (Epic #3)
│   │   └── connection.ts
│   └── providers/           # React providers (Epic #4)
│       ├── ValuApiProvider.tsx
│       └── AuthProvider.tsx
│
├── models/                  # Mongoose schemas ✅ (Epic #3)
│   ├── Newsletter.ts
│   └── ProcessingSession.ts
│
├── hooks/                   # Custom hooks ✅ (Epic #4+)
│   ├── useValuAuth.ts
│   ├── useScraper.ts
│   └── usePublisher.ts
│
├── utils/                   # Utilities ✅
│   ├── env.ts              # Environment vars ✅
│   ├── logger.ts           # Logging ✅
│   └── hebrew.ts           # RTL handling (Epic #6)
│
├── types/                   # TypeScript types ✅
│   └── index.ts            # Core types ✅
│
├── scripts/                 # CLI scripts ✅
│   ├── scrape-recent.js
│   └── weekly-check.js
│
├── public/                  # Static assets ✅
├── __tests__/               # Test files ✅
└── Configuration files ✅
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── jest.config.js
    ├── .eslintrc.json
    └── .prettierrc
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
6. **Development Testing**: Valu Social Dev Tool provides secure localhost-to-production iframe testing
   - Real authentication flow (no mocking needed)
   - Third-party cookie handling in actual context
   - Production security policies applied during development

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