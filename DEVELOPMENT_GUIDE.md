ב׳׳ה
# Development Guide

This guide combines the complete workflow and implementation details for developing the Living with the Rebbe admin tool.

## Table of Contents
1. [Project Setup](#project-setup)
2. [Development Workflow](#development-workflow)
3. [Implementation Timeline](#implementation-timeline)
4. [Core Components](#core-components)
5. [Database Operations](#database-operations)
6. [Error Handling](#error-handling)
7. [Testing Strategy](#testing-strategy)
8. [Development Milestones](#development-milestones)

## Project Setup

### Prerequisites
- Node.js 18+ LTS
- MongoDB (local or Atlas account)
- Vercel CLI (for deployment)
- Admin API key for ChabadUniverse
- Valu Social Dev Tool access (for iframe testing)

### Initial Setup

```bash
# Initialize Next.js project
npx create-next-app@latest living-with-rebbe --typescript --tailwind --app
cd living-with-rebbe

# Install dependencies
npm install @arkeytyp/valu-api cheerio axios mongoose

# Install UI libraries
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react framer-motion
```

### Local Development with Valu Social

Valu Social provides a development tool that allows your localhost application to run within their production iframe environment:

1. **Configure localhost in Valu Social**:
   - Access the Valu Social dev tool configuration
   - Add your localhost URL (typically `http://localhost:3000`)
   - This enables testing with real authentication and iframe context

2. **No mocking required**:
   - Test against actual production parent window
   - Real authentication flow
   - Actual third-party cookie behavior

3. **Development workflow**:
   ```bash
   # Start local dev server
   npm run dev

   # Open ChabadUniverse/Valu Social
   # Navigate to your app within their iframe
   # Your localhost app will load with full production context
   ```

### Environment Configuration

Create `.env.local`:
```env
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=your-api-key
CHABAD_UNIVERSE_CHANNEL_ID=target-channel-id
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe
```

### MongoDB Setup

```typescript
// lib/db/connection.ts
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
```

## Development Workflow

### Complete Processing Pipeline

```mermaid
graph TD
    A[Admin Authentication] --> B[Create Processing Session]
    B --> C[Fetch Archive]
    C --> D[Parse Newsletter Links]
    D --> E[Check Database for Duplicates]
    E --> F[Process Each Newsletter]
    F --> G[Extract Media]
    G --> H[Upload to CMS]
    H --> I[Rewrite URLs]
    I --> J[Post to Channel]
    J --> K[Update Database]
    K --> L[Session Complete]
```

### Phase 1: Authentication & Session

```typescript
// 1. Admin authenticates via Valu/ChabadUniverse
const { user, isAuthenticated } = useValuAuth();
if (!user?.roles?.includes('channel_admin')) {
  return <AccessDenied />;
}

// 2. Create processing session
const session = await ProcessingSession.create({
  sessionId: generateId(),
  startedBy: user.id,
  status: 'running',
  totalNewsletters: 0,
  processed: 0,
  successful: 0,
  failed: 0
});
```

### Phase 2: Archive Discovery

```typescript
// Fetch and parse archive
const year = "5785";
const archiveUrl = `${ARCHIVE_BASE_URL}/Chazak/${year}/LivingWithTheRebbe.html`;
const archiveHtml = await fetch(archiveUrl);
const newsletters = parseArchive(archiveHtml);

// Check for already processed
const processedSlugs = await Newsletter.find({
  status: 'completed'
}).distinct('slug');

const toProcess = newsletters.filter(n =>
  !processedSlugs.includes(n.slug)
);
```

### Phase 3: Newsletter Processing

For each newsletter:

```typescript
// 1. Check if already processed
const existing = await Newsletter.findOne({ slug });
if (existing?.status === 'completed') {
  console.log(`Skipping ${slug} - already processed`);
  continue;
}

// 2. Create/update database record
await Newsletter.findOneAndUpdate(
  { slug },
  {
    status: 'processing',
    sourceUrl,
    year,
    parsha
  },
  { upsert: true }
);

// 3. Scrape content
const { html, media } = await scrapeNewsletter(url);

// 4. Process media with deduplication
const mediaMapping = [];
for (const mediaUrl of media) {
  const existing = await Newsletter.findOne({
    'mediaMapping.original': mediaUrl
  });

  if (!existing) {
    const cmsUrl = await uploadToCMS(mediaUrl);
    mediaMapping.push({
      original: mediaUrl,
      cms: cmsUrl,
      uploadedAt: new Date()
    });
  }
}

// 5. Rewrite URLs
const processedHtml = rewriteUrls(html, mediaMapping);

// 6. Post to channel
try {
  const response = await postToChannel({
    channelId: CHANNEL_ID,
    content: processedHtml,
    title,
    tags: [parsha, year]
  });

  await Newsletter.findOneAndUpdate(
    { slug },
    {
      status: 'completed',
      channelPostId: response.postId,
      postedAt: new Date(),
      mediaMapping
    }
  );
} catch (error) {
  await Newsletter.findOneAndUpdate(
    { slug },
    {
      status: 'failed',
      error: error.message,
      $inc: { retryCount: 1 }
    }
  );
}
```

## Implementation Timeline

### Week 1: Foundation
**Day 1-2: Project Setup**
- Initialize Next.js with TypeScript
- Set up MongoDB connection
- Configure Vercel deployment
- Create environment variables

**Day 3-4: Authentication**
- Integrate Valu API
- Create auth hooks
- Build auth guard components
- Test iframe detection using Valu Social Dev Tool

**Day 5: Database & UI**
- Create Mongoose models
- Build admin dashboard
- Implement loading states

### Week 2: Scraping Pipeline
**Day 6-7: Archive Parser**
- Create archive fetcher
- Implement HTML parser
- Extract newsletter metadata

**Day 8-9: Newsletter Scraper**
- Build content extractor
- Parse media URLs
- Handle Hebrew/RTL content

**Day 10: Media Processing**
- Identify media types
- Create URL validator
- Build extraction logic

### Week 3: CMS Integration
**Day 11-12: CMS Client**
- Create upload functions
- Add retry logic
- Handle API authentication

**Day 13: URL Rewriting**
- Build URL mapper
- Implement replacer
- Test edge cases

**Day 14-15: Publishing**
- Create channel poster
- Add tag management
- Handle errors

### Week 4: Polish & Testing
**Day 16-17: Admin Interface**
- Year selector UI
- Newsletter list view
- Progress indicators

**Day 18: Preview System**
- HTML preview
- Media verification
- Edit capabilities

**Day 19-20: Testing**
- Unit tests
- Integration tests
- Performance optimization

## Core Components

### Newsletter Model

```typescript
const NewsletterSchema = new Schema({
  slug: { type: String, unique: true, required: true },
  sourceUrl: { type: String, required: true },
  year: { type: Number, required: true },
  parsha: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  channelPostId: String,
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

NewsletterSchema.index({ slug: 1 });
NewsletterSchema.index({ status: 1 });
```

### ProcessingSession Model

```typescript
const ProcessingSessionSchema = new Schema({
  sessionId: { type: String, unique: true },
  startedBy: String,
  totalNewsletters: Number,
  processed: { type: Number, default: 0 },
  successful: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  currentNewsletter: String,
  status: {
    type: String,
    enum: ['running', 'paused', 'completed', 'failed'],
    default: 'running'
  }
}, { timestamps: true });
```

### Archive Parser

```typescript
export class ArchiveParser {
  async fetchArchive(year: string): Promise<NewsletterMeta[]> {
    const url = `${ARCHIVE_BASE_URL}/Chazak/${year}/LivingWithTheRebbe.html`;
    const response = await axios.get(url);
    return this.parseArchiveHTML(response.data);
  }

  private parseArchiveHTML(html: string): NewsletterLink[] {
    const $ = cheerio.load(html);
    const links: NewsletterLink[] = [];

    $('table a').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text();
      if (href && href.includes('Email')) {
        links.push({
          url: this.resolveUrl(href),
          title: text,
          slug: this.generateSlug(text, href)
        });
      }
    });

    return links;
  }

  private generateSlug(title: string, url: string): string {
    // Extract year and parsha from URL/title
    const yearMatch = url.match(/Email(\d+)/);
    const year = yearMatch ? `57${yearMatch[1]}` : '';
    const parsha = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${year}-${parsha}`;
  }
}
```

### Media Uploader

```typescript
export class MediaUploader {
  async uploadMedia(url: string): Promise<string> {
    try {
      // Download media
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Prepare for CMS upload
      const formData = new FormData();
      formData.append('file', Buffer.from(response.data));
      formData.append('type', this.getMediaType(url));

      // Upload to CMS
      const uploadResponse = await fetch(`${CMS_URL}/api/media`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.CHABAD_UNIVERSE_API_KEY}`
        },
        body: formData
      });

      const result = await uploadResponse.json();
      return result.url;

    } catch (error) {
      console.error(`Failed to upload ${url}:`, error);
      throw error;
    }
  }

  private getMediaType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    const typeMap = {
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'pdf': 'document',
      'mp3': 'audio',
      'mp4': 'video'
    };
    return typeMap[ext] || 'unknown';
  }
}
```

## Database Operations

### Duplicate Detection

```typescript
async function checkDuplicate(slug: string): Promise<boolean> {
  const existing = await Newsletter.findOne({
    slug,
    status: 'completed'
  });
  return existing !== null;
}
```

### Resume Failed Processing

```typescript
async function resumeFailed(sessionId: string) {
  const failedNewsletters = await Newsletter.find({
    status: 'failed',
    retryCount: { $lt: 3 }
  }).sort({ createdAt: 1 });

  for (const newsletter of failedNewsletters) {
    await processNewsletter(newsletter);
  }
}
```

### Progress Tracking

```typescript
interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentNewsletter: string;
  mediaUploaded: number;
  mediaTotal: number;
}

async function updateProgress(
  sessionId: string,
  status: Partial<ProcessingStatus>
) {
  await ProcessingSession.findOneAndUpdate(
    { sessionId },
    { $set: status }
  );
}
```

## Error Handling

### Error Codes

```typescript
enum ErrorCode {
  ARCHIVE_FETCH_FAILED = 'E001',
  NEWSLETTER_PARSE_ERROR = 'E002',
  MEDIA_UPLOAD_FAILED = 'E003',
  CMS_API_ERROR = 'E004',
  AUTH_INVALID = 'E005',
  DATABASE_ERROR = 'E006',
  NETWORK_TIMEOUT = 'E007'
}
```

### Retry Logic

```typescript
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = 3
) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

## Testing Strategy

### Unit Tests

```typescript
// __tests__/scraper/archiveParser.test.ts
describe('ArchiveParser', () => {
  it('should parse archive HTML correctly', async () => {
    const parser = new ArchiveParser();
    const html = fs.readFileSync('fixtures/archive.html', 'utf8');
    const newsletters = parser.parseArchiveHTML(html);

    expect(newsletters).toHaveLength(52); // Weekly newsletters
    expect(newsletters[0]).toHaveProperty('slug');
    expect(newsletters[0]).toHaveProperty('url');
  });

  it('should generate correct slugs', () => {
    const slug = parser.generateSlug('Parshas Nitzavim', 'Email85/nitzavim.html');
    expect(slug).toBe('5785-parshas-nitzavim');
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/cms.test.ts
describe('CMS Integration', () => {
  it('should upload media successfully', async () => {
    const uploader = new MediaUploader();
    const testImageUrl = 'https://example.com/test.jpg';

    const cmsUrl = await uploader.uploadMedia(testImageUrl);

    expect(cmsUrl).toMatch(/^https:\/\/chabaduniverse\.com\/cms\/media\//);
  });

  it('should handle upload failures gracefully', async () => {
    // Test with invalid URL
    await expect(
      uploader.uploadMedia('invalid-url')
    ).rejects.toThrow();
  });
});
```

## Development Milestones

### MVP (End of Week 2)
- ✅ Basic scraping functional
- ✅ Can parse archive and newsletters
- ✅ Media URLs extracted
- ✅ Database integration complete
- ✅ Manual testing possible

### Beta (End of Week 3)
- ✅ CMS integration complete
- ✅ URL rewriting functional
- ✅ Can post to test channel
- ✅ Authentication working
- ✅ Error recovery implemented

### Production (End of Week 4)
- ✅ Full admin interface
- ✅ Error handling robust
- ✅ Testing complete
- ✅ Documentation finished
- ✅ Performance optimized

## Best Practices

### Performance
1. Process newsletters in batches of 5
2. Upload media in parallel (max 3 concurrent)
3. Use database indexes for fast lookups
4. Cache CMS URLs to avoid re-uploading

### Data Integrity
1. Always check database before processing
2. Validate media URLs before upload
3. Confirm post creation with API response
4. Use transactions for critical operations

### Hebrew Content
1. Preserve RTL text direction
2. Maintain Hebrew character encoding (UTF-8)
3. Keep original font specifications
4. Test with actual Hebrew content

### Error Recovery
1. Log all errors with context
2. Implement exponential backoff
3. Set maximum retry limits
4. Provide manual retry option

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB is running
mongod --version

# For Atlas, verify connection string
mongodb+srv://username:password@cluster.mongodb.net/living-with-rebbe
```

**Archive Not Loading**
- Verify S3 bucket permissions
- Check year parameter format (4 digits)
- Confirm network connectivity

**Media Upload Failures**
- Check file size limits (usually 10MB)
- Verify supported formats
- Confirm API key validity

**Posting Errors**
- Verify channel exists and ID is correct
- Check user has posting rights
- Validate HTML content size

## Manual Operations

### Single Newsletter Processing
```bash
# Process specific newsletter
npm run scrape:single -- --url="https://merkos302.com/living/Email85/49Nitzavim1.html"
```

### Retry Failed Uploads
```bash
# Retry all failed media uploads
npm run retry:media -- --session-id="abc123"
```

### Export Processing Report
```bash
# Generate CSV of processed newsletters
npm run export:report -- --year=5785
```

## Success Criteria

### Functional Requirements
- [ ] Can scrape all ~400 newsletters
- [ ] Media uploads successful (>95% success rate)
- [ ] Posts appear in channel
- [ ] Tags properly applied
- [ ] Duplicate detection working

### Performance Requirements
- [ ] Process 5 newsletters/minute (realistic)
- [ ] Media upload < 30 seconds per file
- [ ] UI responsive during processing
- [ ] Error recovery automatic

### Quality Requirements
- [ ] 95% overall success rate
- [ ] HTML formatting preserved
- [ ] Hebrew text displays correctly
- [ ] All media accessible from CMS

## Next Steps

1. **Resolve API specification** with ChabadUniverse team
2. **Set up development environment** with MongoDB
3. **Create proof of concept** for core workflow
4. **Test in actual iframe** environment
5. **Begin Phase 1** implementation