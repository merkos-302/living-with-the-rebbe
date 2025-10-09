ב״ה
# MVP Plan - Revised Scope

## Executive Summary

Based on clarifications, the MVP scope has been dramatically reduced from ~400 newsletters to:
- **Initial Load**: 3 most recent newsletters
- **Ongoing**: Weekly newsletter updates
- **No duplicates**: Each newsletter posted once, no update mechanism needed

This changes the project from a massive migration to a lightweight weekly publishing tool.

## Immediate Action Plan (No API Required)

### Week 1: Build Complete System with Mock API

Since we don't have an ETA on the Valu API, we'll build everything with a mock API that matches our specification.

#### Day 1-2: Setup & Mock API
```bash
# 1. Initialize project
npx create-next-app@latest living-with-rebbe --typescript --tailwind --app
cd living-with-rebbe

# 2. Create mock API server
mkdir mock-api
npm install json-server --save-dev
```

**Mock API Implementation:**
```typescript
// mock-api/server.js
const jsonServer = require('json-server');
const server = jsonServer.create();
const middlewares = jsonServer.defaults();

// Mock endpoints matching our API specification
server.post('/api/v1/cms/media', (req, res) => {
  res.json({
    success: true,
    data: {
      url: `https://mock-cms.local/media/${Date.now()}.jpg`,
      id: `media_${Date.now()}`
    }
  });
});

server.post('/api/v1/channels/:channelId/posts', (req, res) => {
  res.json({
    success: true,
    data: {
      postId: `post_${Date.now()}`,
      url: `https://mock.local/posts/${Date.now()}`
    }
  });
});

server.listen(3001);
```

#### Day 3: Scraper for 3 Recent Newsletters
```typescript
// lib/scraper/mvpScraper.ts
export class MVPScraper {
  async fetchRecentNewsletters(): Promise<Newsletter[]> {
    // Fetch only the 3 most recent from archive
    const archiveUrl = `${ARCHIVE_BASE_URL}/Chazak/5785/LivingWithTheRebbe.html`;
    const html = await fetch(archiveUrl);
    const allNewsletters = this.parseArchive(html);

    // Return only last 3
    return allNewsletters.slice(-3);
  }

  async fetchWeeklyNewsletter(): Promise<Newsletter> {
    // Fetch the latest newsletter
    // This can run on a schedule or manual trigger
  }
}
```

#### Day 4-5: Complete UI with ChabadUniverse Design
- Copy design patterns from ChabadUniverse
- Simple dashboard showing:
  - 3 recent newsletters status
  - "Fetch Latest Newsletter" button
  - Processing status
  - Success/error messages

### Week 2: Production-Ready Features

#### Automated Weekly Processing
```typescript
// pages/api/cron/weekly.ts
export async function GET(request: Request) {
  // This can be triggered by Vercel Cron
  const latestNewsletter = await scraper.fetchWeeklyNewsletter();

  // Check if already processed
  const exists = await Newsletter.findOne({ slug: latestNewsletter.slug });
  if (exists) {
    return Response.json({ message: 'Already processed' });
  }

  // Process and store
  await processNewsletter(latestNewsletter);

  // When API ready, will post to channel
  // For now, store as "ready_to_publish"

  return Response.json({ success: true });
}
```

#### Manual Export Option
```typescript
// pages/api/export/ready-to-publish.ts
export async function GET() {
  const readyNewsletters = await Newsletter.find({
    status: 'ready_to_publish'
  });

  // Return as JSON for manual posting if needed
  return Response.json({
    newsletters: readyNewsletters.map(n => ({
      title: n.title,
      html: n.processedHtml,
      mediaFiles: n.mediaMapping
    }))
  });
}
```

## Revised Database Schema

```typescript
// Simpler schema for MVP
const NewsletterSchema = new Schema({
  slug: { type: String, unique: true },  // Prevents duplicates
  weekNumber: Number,  // For ordering
  year: Number,
  parsha: String,
  sourceUrl: String,
  originalHtml: String,
  processedHtml: String,  // With rewritten URLs
  mediaMapping: [{
    original: String,
    local: String,  // Where we cached it
    cms: String     // Where it will be uploaded (when API ready)
  }],
  status: {
    type: String,
    enum: ['fetched', 'processed', 'ready_to_publish', 'published'],
    default: 'fetched'
  },
  publishedAt: Date
}, { timestamps: true });

// Ensure no duplicates
NewsletterSchema.index({ slug: 1 }, { unique: true });
NewsletterSchema.index({ year: 1, weekNumber: 1 }, { unique: true });
```

## MVP User Flow

### Initial Setup (One-time)
1. Admin opens tool in ChabadUniverse iframe
2. Clicks "Initialize Recent Newsletters"
3. System fetches last 3 newsletters
4. Shows preview of each
5. Admin confirms and processes
6. Newsletters marked as "ready_to_publish"

### Weekly Flow
1. **Automated** (via cron) or **Manual** (via button)
2. Fetch latest newsletter from archive
3. Check if already exists (prevent duplicates)
4. Download and cache all media (we own all media, no auth issues)
5. Process HTML (exact replica)
6. Store as "ready_to_publish"
7. **Send email notification to retzion@merkos302.com**
8. When API available: Auto-publish
9. Until then: Export JSON for manual posting

## Development Priorities

### Must Have (Week 1)
- [x] Scrape 3 recent newsletters
- [x] Download media files
- [x] Store in MongoDB
- [x] Basic admin UI
- [x] Duplicate prevention

### Should Have (Week 2)
- [ ] Weekly cron job
- [ ] Email notification on new newsletter
- [ ] Export to JSON/ZIP
- [ ] Preview before publishing
- [ ] Error recovery

### Nice to Have (Post-MVP)
- [ ] Bulk historical import (if needed)
- [ ] Edit capability
- [ ] Analytics dashboard
- [ ] Media CDN optimization

## Testing Strategy for MVP

### Manual Testing Checklist
```markdown
## Initial Load Test
- [ ] Successfully fetches 3 recent newsletters
- [ ] No duplicate entries created
- [ ] All media downloaded
- [ ] HTML preserved exactly
- [ ] Preview matches original

## Weekly Update Test
- [ ] Detects new newsletter
- [ ] Skips if already exists
- [ ] Processes within 2 minutes
- [ ] Notification sent
- [ ] Ready for publishing

## Error Scenarios
- [ ] Archive unavailable
- [ ] Media download fails
- [ ] Duplicate newsletter attempted
- [ ] Network timeout
```

## Deployment Strategy

### Phase 1: Without API (Immediate)
```yaml
Deploy to Vercel:
- Full scraping functionality
- MongoDB storage
- Export capabilities
- Manual publishing workflow

Admin Workflow:
1. Scrape newsletters
2. Export processed data
3. Manually post to ChabadUniverse
```

### Phase 2: With API (When Ready)
```yaml
Update configuration:
- Replace mock API with real endpoints
- Enable auto-publishing
- Remove export features
- Add success notifications
```

## Success Metrics

### MVP Success Criteria
- ✅ 3 recent newsletters scraped and stored
- ✅ Weekly newsletter detected and processed
- ✅ No duplicate posts
- ✅ Exact HTML replica
- ✅ All media properly cached
- ✅ Admin can preview before publishing
- ✅ Export option available (until API ready)

### Performance Targets (Revised)
- Newsletter processing: < 2 minutes
- Media downloads: Parallel, < 30 seconds total
- UI response time: < 1 second
- Weekly check: < 10 seconds

## Risk Mitigation

### Low Risk (MVP Scope)
With only 3 + weekly newsletters:
- Minimal data storage required
- Fast processing time
- Easy manual verification
- Simple recovery from errors

### Mitigation Strategies
1. **No API**: Build complete system with mock, swap later
2. **Media failures**: Retry logic with fallback to original URLs
3. **Duplicate prevention**: Unique indexes + slug checking
4. **Archive changes**: Monitor structure weekly, alert on changes

## Communication Plan

### Weekly Status Updates
```markdown
## Week 1 Update
- [x] Project setup complete
- [x] Mock API running
- [x] 3 newsletters scraped successfully
- [ ] Awaiting API specification confirmation
```

### Stakeholder Demo
- Show 3 newsletters in system
- Demonstrate weekly update process
- Preview exact HTML replicas
- Export JSON for review

## Next Steps

1. **Today**: Start project setup with mock API
2. **Tomorrow**: Implement 3-newsletter scraper
3. **Day 3**: Build admin UI
4. **Day 4**: Test with real newsletters
5. **Day 5**: Deploy to Vercel for stakeholder review

## Questions Resolved

- ✅ Scope: 3 + weekly (not 400)
- ✅ Design: Match ChabadUniverse
- ✅ Duplicates: Prevent, don't update
- ✅ Newsletter format: Exact replica
- ✅ Media ownership: We own all media, no auth required
- ✅ Error recovery: Not an issue with only 3 + weekly
- ✅ Notification: Email to retzion@merkos302.com
- ✅ Router: Use Next.js App Router

## Implementation Confirmed

All blockers removed. Ready to begin development immediately.

---

**Bottom Line**: With this reduced scope, we can have a working MVP in 1 week, even without the API. The system will be ready to plug in the real API whenever it becomes available.