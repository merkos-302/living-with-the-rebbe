ב״ה
# Week 1 Sprint Plan - MVP Development

## Overview
Build complete MVP in 5 days with mock API, ready to plug in real API when available.

## Day 1 (Monday) - Project Setup & Mock API

### Morning (4 hours)
```bash
# 1. Initialize Next.js with App Router
npx create-next-app@latest living-with-rebbe --typescript --tailwind --app
cd living-with-rebbe

# 2. Install all dependencies
npm install @arkeytyp/valu-api cheerio axios mongoose nodemailer
npm install @radix-ui/react-dialog @radix-ui/react-tabs lucide-react
npm install -D @types/node @types/cheerio json-server concurrently
```

### Afternoon (4 hours)
Create mock API server:

```typescript
// mock-api/server.js
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('mock-api/db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Mock CMS media upload
server.put('/api/v1/cms/media', (req, res) => {
  const mockUrl = `https://mock-cms.local/media/${Date.now()}.jpg`;
  res.json({
    success: true,
    data: { url: mockUrl, id: `media_${Date.now()}` }
  });
});

// Mock channel post
server.post('/api/v1/channels/:channelId/posts', (req, res) => {
  res.json({
    success: true,
    data: {
      postId: `post_${Date.now()}`,
      url: `https://mock.local/posts/${Date.now()}`
    }
  });
});

server.use(router);
server.listen(3001, () => {
  console.log('Mock API Server running on http://localhost:3001');
});
```

### Deliverables Day 1
- ✅ Next.js project initialized with App Router
- ✅ All dependencies installed
- ✅ Mock API server running
- ✅ MongoDB connection configured
- ✅ Environment variables set

## Day 2 (Tuesday) - Scraper & Database

### Morning (4 hours)
Build the newsletter scraper:

```typescript
// app/lib/scraper/NewsletterScraper.ts
import * as cheerio from 'cheerio';
import axios from 'axios';

export class NewsletterScraper {
  private archiveBaseUrl = process.env.ARCHIVE_BASE_URL;

  async fetchRecentNewsletters(count: number = 3) {
    const year = '5785';
    const archiveUrl = `${this.archiveBaseUrl}/Chazak/${year}/LivingWithTheRebbe.html`;

    const { data } = await axios.get(archiveUrl);
    const $ = cheerio.load(data);

    const newsletters = [];
    $('table a').each((i, elem) => {
      if (newsletters.length >= count) return false;

      const href = $(elem).attr('href');
      if (href?.includes('Email')) {
        newsletters.push({
          url: this.resolveUrl(href),
          title: $(elem).text(),
          slug: this.generateSlug($(elem).text(), year)
        });
      }
    });

    return newsletters.slice(-count); // Get last 3
  }

  async scrapeNewsletter(url: string) {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract all media
    const media = [];
    $('img, audio, iframe').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src) media.push(src);
    });

    $('a[href$=".pdf"], a[href$=".doc"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) media.push(href);
    });

    return {
      html: $.html(),
      media: [...new Set(media)] // Unique media URLs
    };
  }

  private generateSlug(title: string, year: string): string {
    const clean = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${year}-${clean}`;
  }

  private resolveUrl(url: string): string {
    // Resolve relative URLs
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `https://merkos302.com${url}`;
    return `https://merkos302.com/living/${url}`;
  }
}
```

### Afternoon (4 hours)
Set up MongoDB schemas:

```typescript
// app/models/Newsletter.ts
import mongoose from 'mongoose';

const NewsletterSchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  title: String,
  year: Number,
  parsha: String,
  sourceUrl: String,
  originalHtml: String,
  processedHtml: String,
  mediaMapping: [{
    original: String,
    cached: String,
    cms: String
  }],
  status: {
    type: String,
    enum: ['scraped', 'processing', 'ready_to_publish', 'published'],
    default: 'scraped'
  },
  publishedAt: Date
}, { timestamps: true });

NewsletterSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Newsletter ||
  mongoose.model('Newsletter', NewsletterSchema);
```

### Deliverables Day 2
- ✅ Newsletter scraper working
- ✅ Can fetch 3 recent newsletters
- ✅ MongoDB schemas created
- ✅ Media extraction functional
- ✅ Test with real archive

## Day 3 (Wednesday) - Media Processing & Storage

### Morning (4 hours)
Media downloader and processor:

```typescript
// app/lib/media/MediaProcessor.ts
import axios from 'axios';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class MediaProcessor {
  private cacheDir = './public/media-cache';

  async ensureCacheDir() {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  async downloadMedia(url: string): Promise<string> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data);
    const hash = createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(url) || '.bin';
    const filename = `${hash}${ext}`;
    const filepath = path.join(this.cacheDir, filename);

    // Check if already cached
    try {
      await fs.access(filepath);
      return `/media-cache/${filename}`; // Already exists
    } catch {
      // Download and cache
      await fs.writeFile(filepath, buffer);
      return `/media-cache/${filename}`;
    }
  }

  async processNewsletterMedia(mediaUrls: string[]) {
    const mapping = [];

    for (const url of mediaUrls) {
      try {
        const cachedPath = await this.downloadMedia(url);
        mapping.push({
          original: url,
          cached: cachedPath,
          cms: null // Will be filled when API available
        });
      } catch (error) {
        console.error(`Failed to download ${url}:`, error);
        mapping.push({
          original: url,
          cached: null,
          cms: null,
          error: error.message
        });
      }
    }

    return mapping;
  }

  rewriteHtml(html: string, mediaMapping: any[]): string {
    let processed = html;

    for (const map of mediaMapping) {
      if (map.cached) {
        // Replace all occurrences of the original URL
        processed = processed.replace(
          new RegExp(map.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          map.cached
        );
      }
    }

    return processed;
  }
}
```

### Afternoon (4 hours)
Email notification service:

```typescript
// app/lib/email/EmailService.ts
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendNewsletterNotification(newsletter: any) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'retzion@merkos302.com',
      subject: `New Newsletter Ready: ${newsletter.title}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Newsletter Ready for Publishing</h2>
          <p><strong>Title:</strong> ${newsletter.title}</p>
          <p><strong>Year:</strong> ${newsletter.year}</p>
          <p><strong>Status:</strong> Ready to Publish</p>
          <p><strong>Media Files:</strong> ${newsletter.mediaMapping.length}</p>

          <p>The newsletter has been processed and is ready for publishing.</p>

          ${!process.env.CHABAD_UNIVERSE_API_KEY ?
            '<p><strong>Note:</strong> API not configured. Newsletter saved for manual publishing.</p>' :
            '<p>Newsletter will be automatically published.</p>'
          }

          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/newsletters/${newsletter.slug}">
              View Newsletter
            </a>
          </p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}
```

### Deliverables Day 3
- ✅ Media downloader working
- ✅ Media caching with deduplication
- ✅ HTML URL rewriting
- ✅ Email notifications configured
- ✅ All media properly stored

## Day 4 (Thursday) - Admin UI

### Morning (4 hours)
Main admin dashboard:

```typescript
// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Send } from 'lucide-react';

export default function AdminDashboard() {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    const res = await fetch('/api/newsletters');
    const data = await res.json();
    setNewsletters(data);
  };

  const fetchRecentNewsletters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scrape/recent', { method: 'POST' });
      const data = await res.json();
      alert(`Fetched ${data.count} newsletters`);
      await fetchNewsletters();
    } finally {
      setLoading(false);
    }
  };

  const processNewsletter = async (slug: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/newsletters/${slug}/process`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert('Newsletter processed successfully!');
        await fetchNewsletters();
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Living with the Rebbe - Admin</h1>

      <div className="mb-6 flex gap-4">
        <Button
          onClick={fetchRecentNewsletters}
          disabled={loading}
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Fetch Recent Newsletters
        </Button>

        <Button variant="outline">
          <Download />
          Export JSON
        </Button>
      </div>

      <div className="grid gap-4">
        {newsletters.map((newsletter) => (
          <Card key={newsletter._id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{newsletter.title}</h3>
                <p className="text-sm text-gray-600">
                  {newsletter.year} • {newsletter.parsha}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant={
                  newsletter.status === 'published' ? 'success' :
                  newsletter.status === 'ready_to_publish' ? 'warning' :
                  'default'
                }>
                  {newsletter.status}
                </Badge>

                {newsletter.status === 'scraped' && (
                  <Button
                    size="sm"
                    onClick={() => processNewsletter(newsletter.slug)}
                    disabled={processing}
                  >
                    <Send className="w-4 h-4" />
                    Process
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Afternoon (4 hours)
API routes:

```typescript
// app/api/scrape/recent/route.ts
import { NextResponse } from 'next/server';
import { NewsletterScraper } from '@/lib/scraper/NewsletterScraper';
import Newsletter from '@/models/Newsletter';
import connectDB from '@/lib/db';

export async function POST() {
  await connectDB();

  const scraper = new NewsletterScraper();
  const newsletters = await scraper.fetchRecentNewsletters(3);

  let created = 0;
  for (const nl of newsletters) {
    const exists = await Newsletter.findOne({ slug: nl.slug });
    if (!exists) {
      await Newsletter.create({
        slug: nl.slug,
        title: nl.title,
        sourceUrl: nl.url,
        status: 'scraped'
      });
      created++;
    }
  }

  return NextResponse.json({
    success: true,
    count: created,
    message: `${created} new newsletters added`
  });
}
```

### Deliverables Day 4
- ✅ Admin dashboard UI
- ✅ Newsletter list view
- ✅ Processing controls
- ✅ Status indicators
- ✅ API routes working

## Day 5 (Friday) - Testing & Deployment

### Morning (4 hours)
Complete testing checklist:

```typescript
// __tests__/integration.test.ts
describe('MVP Integration Tests', () => {
  test('Can fetch 3 recent newsletters', async () => {
    const scraper = new NewsletterScraper();
    const newsletters = await scraper.fetchRecentNewsletters(3);
    expect(newsletters).toHaveLength(3);
  });

  test('Prevents duplicate newsletters', async () => {
    const newsletter = {
      slug: 'test-2024',
      title: 'Test Newsletter'
    };

    await Newsletter.create(newsletter);

    // Try to create duplicate
    await expect(Newsletter.create(newsletter))
      .rejects.toThrow(/duplicate key/);
  });

  test('Processes newsletter media', async () => {
    const processor = new MediaProcessor();
    const mediaUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/doc.pdf'
    ];

    const mapping = await processor.processNewsletterMedia(mediaUrls);
    expect(mapping).toHaveLength(2);
    expect(mapping[0].cached).toBeTruthy();
  });

  test('Sends email notification', async () => {
    const emailService = new EmailService();
    await emailService.sendNewsletterNotification({
      title: 'Test Newsletter',
      year: 5785,
      slug: 'test-5785',
      mediaMapping: []
    });
    // Check email was sent (mock in tests)
  });
});
```

### Afternoon (4 hours)
Deploy to Vercel:

```bash
# 1. Push to GitHub
git add .
git commit -m "feat: MVP implementation with mock API"
git push origin main

# 2. Deploy to Vercel
vercel --prod

# 3. Set environment variables in Vercel
vercel env add MONGODB_URI production
vercel env add ARCHIVE_BASE_URL production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production

# 4. Configure Valu Social Dev Tool
# Add production URL to iframe whitelist
```

### Deliverables Day 5
- ✅ All tests passing
- ✅ Deployed to Vercel
- ✅ Email notifications working
- ✅ Documentation complete
- ✅ Ready for stakeholder demo

## End of Week 1 Status

### Completed
- ✅ Full MVP with mock API
- ✅ 3 recent newsletters scraped
- ✅ Media downloading and caching
- ✅ Admin dashboard
- ✅ Email notifications
- ✅ Export functionality
- ✅ Deployed to production

### Ready for API
When the ChabadUniverse API becomes available:
1. Update environment variables
2. Replace mock endpoints with real ones
3. Test with single newsletter
4. Enable auto-publishing

### Weekly Maintenance
Every week:
1. System checks for new newsletter (cron or manual)
2. Downloads and processes (~2 minutes)
3. Sends notification to retzion@merkos302.com
4. Admin reviews and publishes (when API ready)

## Success Metrics
- [x] 3 newsletters successfully scraped
- [x] All media cached locally
- [x] HTML preserved exactly
- [x] No duplicate entries
- [x] Email notifications working
- [x] Export to JSON functional
- [x] Deployed and accessible

---

**Week 1 Result**: Complete MVP ready for production use, waiting only for API integration.