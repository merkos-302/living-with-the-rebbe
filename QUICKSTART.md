ב״ה
# Quick Start Guide

Get the Living with the Rebbe admin tool running in 5 minutes.

**Status**: Phase 2 MVP Days 1-3 Complete! Foundation, authentication, and HTML parser implemented with 181 passing tests across 7 test suites.

## What's Already Set Up

✅ Next.js 15 with App Router
✅ TypeScript with strict mode
✅ Tailwind CSS with Hebrew/RTL support
✅ Jest testing framework
✅ ESLint and Prettier
✅ Complete directory structure
✅ Type definitions and utilities
✅ Sample newsletter with assets
✅ **Valu API Authentication System (Day 1)** - 12 files, 1,356 lines
✅ Iframe-only access enforcement
✅ Admin permission verification
✅ Cookie-based user caching
✅ Development test harness
✅ **HTML Input and Parser System (Days 2-3)** - 30+ files, 3,000+ lines
✅ Admin dashboard with tabbed interface (Resources, HTML Preview, Statistics)
✅ Dual-mode HTML input (URL fetch as default, paste as fallback)
✅ Server-side URL fetcher avoiding CORS issues
✅ Automatic relative URL resolution in URL fetch mode
✅ Base URL field for manual relative URL resolution
✅ Cheerio-based parser (ONLY extracts linked documents from <a> tags)
✅ Resource identifier (21 file formats)
✅ Preview components with filtering and statistics
✅ API routes: /api/parse and /api/fetch-html with rate limiting
✅ 181 comprehensive tests - all passing across 7 test suites

## What Still Needs Implementation

Phase 3: Resource Processing (Next Steps)
1. ✅ HTML input interface (dual-mode: URL fetch + paste)
2. ✅ Resource parser using Cheerio (linked documents only from <a> tags)
3. ⏳ Resource downloader with parallel processing (Phase 3)
4. ⏳ CMS upload integration via Valu API (stub first, then real API)
5. ⏳ URL replacement engine (Phase 3)
6. ⏳ Processing history with MongoDB (Post-MVP)

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally (or Atlas account)
- Git installed

## 5-Minute Setup

### 1. Clone and Install (1 minute)
```bash
git clone [repository-url]
cd living-with-the-rebbe
npm install
```

### 2. Configure Environment (1 minute)
```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required environment variables:
```env
# For local development without iframe
NEXT_PUBLIC_VALU_DEV_MODE=true

# For production (optional for now)
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=your-api-key  # For CMS uploads (future)
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe  # For history (future)
```

### 3. Start Development Server (1 minute)
```bash
npm run dev
# App running at http://localhost:3000
```

### 4. Verify Installation (1 minute)

**Option A: Direct Access (Dev Mode)**
```
http://localhost:3000
```
You should see:
- "Living with the Rebbe - Admin Tool" heading
- Authentication check running
- Admin dashboard with "Parse HTML" and "History" tabs
- HTML input textarea with base URL field
- Working HTML parser with resource preview

**Option B: Test Harness (Recommended)**
```
http://localhost:3000/test-harness.html
```
You should see:
- Iframe simulator interface
- Mock user configuration panel
- Your app loaded in iframe context
- Message exchange logging

### 5. Run Tests (Optional, 1 minute)
```bash
# Run the test suite
npm test

# Run with coverage
npm test -- --coverage

# Run linting
npm run lint
```

## Current Development Status

### What Works Now
- ✅ Development server runs successfully
- ✅ TypeScript compilation works
- ✅ Tailwind CSS styling applied
- ✅ Hebrew/RTL font loading
- ✅ Sample newsletter viewable
- ✅ Jest tests can be run
- ✅ ESLint code checking
- ✅ Prettier code formatting
- ✅ Git hooks for code quality
- ✅ **Valu API authentication (Day 1)** - 12 files, 1,356 lines
- ✅ **Iframe-only access enforcement**
- ✅ **Admin permission verification**
- ✅ **Cookie-based user caching**
- ✅ **Health monitoring with adaptive intervals**
- ✅ **Development test harness for local testing**
- ✅ **HTML input and parser (Days 2-3)** - 30+ files, 3,000+ lines
- ✅ **Admin dashboard with tabs** (Resources, HTML Preview, Statistics)
- ✅ **Dual-mode input: URL fetch (default) + paste HTML (fallback)**
- ✅ **Server-side URL fetcher** avoiding CORS issues
- ✅ **Automatic relative URL resolution** in URL fetch mode
- ✅ **Base URL field** for manual relative URL resolution
- ✅ **Cheerio-based parser** (ONLY extracts linked documents from <a> tags, NOT inline images)
- ✅ **Resource identifier** (21 file formats)
- ✅ **Preview components** with filtering and statistics
- ✅ **API routes** /api/parse and /api/fetch-html with rate limiting
- ✅ **181 comprehensive tests** - all passing across 7 test suites

### What's Coming Next (Phase 3)
- ⏳ Resource downloader with parallel processing
- ⏳ CMS upload integration (stub functions first)
- ⏳ URL replacement engine
- ⏳ Enhanced admin UI with processing status
- ⏳ Integration testing
- ⏳ Deploy to Vercel

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Project Structure

Current structure (Foundation + Authentication complete):
```
living-with-the-rebbe/
├── app/                    # Next.js 15 App Router ✅
│   ├── layout.tsx         # Root layout with providers ✅
│   ├── page.tsx           # Authenticated home page ✅
│   ├── providers.tsx      # Client-side providers ✅
│   ├── globals.css        # Global styles ✅
│   ├── admin/             # Admin pages ✅
│   │   ├── layout.tsx    # Authenticated wrapper ✅
│   │   └── page.tsx      # Admin dashboard ✅
│   └── api/               # API routes ✅
│       └── parse/        # HTML parsing endpoint ✅
├── components/            # React components ✅
│   ├── valu/             # Valu authentication ✅
│   │   ├── ValuFrameGuard.tsx    # Iframe enforcement ✅
│   │   └── AccessDenied.tsx      # Access denied UI ✅
│   ├── LoadingSpinner.tsx # Loading states ✅
│   ├── admin/            # Processing UI ✅
│   │   ├── HtmlInput.tsx # Dual-mode input (URL fetch + paste) ✅
│   │   ├── UrlInput.tsx  # URL fetch interface ✅
│   │   ├── ParseResults.tsx # Resource grid ✅
│   │   ├── ResourcePreview.tsx # Resource cards ✅
│   │   └── HtmlPreview.tsx # Code viewer ✅
│   └── ui/               # Reusable UI (future)
├── contexts/              # React contexts ✅
│   ├── ValuApiContext.tsx # Valu API context ✅
│   └── AuthContext.tsx    # Auth context ✅
├── lib/                  # Core libraries ✅
│   ├── valu-api-singleton.ts # API instance manager ✅
│   ├── parser/          # HTML parsing ✅ COMPLETE
│   │   ├── html-parser.ts # Cheerio parser ✅
│   │   ├── resource-identifier.ts # Type detection ✅
│   │   ├── index.ts    # Public API ✅
│   │   └── __tests__/  # 181 tests ✅
│   ├── fetcher/         # URL fetching ✅ COMPLETE
│   │   ├── url-fetcher.ts # Server-side HTML fetcher ✅
│   │   └── __tests__/  # Comprehensive tests ✅
│   ├── cms/             # CMS integration (future)
│   └── processor/       # Resource processing (future)
├── hooks/                # React hooks ✅
│   ├── useValuApi.ts    # API connection hook ✅
│   └── useValuAuth.ts   # Authentication hook ✅
├── types/                # TypeScript types ✅
├── utils/                # Utilities ✅
│   ├── env.ts           # Environment vars ✅
│   ├── logger.ts        # Logging ✅
│   └── valuAuthCookie.ts # User caching ✅
├── scripts/              # CLI scripts ✅
├── public/               # Static assets ✅
│   ├── test-harness.html # Dev iframe simulator ✅
│   └── samples/         # Sample newsletter ✅
└── __tests__/            # Test files ✅
```

## Next Steps for Development

1. ✅ **HTML Input & Parser** (Complete):
   - ✅ Dual-mode HTML input (URL fetch + paste)
   - ✅ Server-side URL fetcher
   - ✅ Cheerio-based resource extractor (linked documents only)
   - ✅ Tested with sample newsletters

2. **Build Resource Processing** (Phase 3 - Next):
   - ⏳ Parallel resource downloader
   - ⏳ CMS upload integration (stub first)
   - ⏳ URL replacement engine

3. **Enhance Admin UI**:
   - ⏳ Processing status indicators
   - ⏳ Before/after HTML preview
   - ⏳ Enhanced output viewer

4. **Explore Documentation**:
   - [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) - High-level overview
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
   - [PROJECT_STATUS_SUMMARY.md](./PROJECT_STATUS_SUMMARY.md) - Detailed roadmap

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Check code quality
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
```

## Testing in ChabadUniverse Iframe

Once the UI is implemented:
1. Get access to Valu Social Dev Tool
2. Configure localhost:3000 as allowed origin
3. Open ChabadUniverse
4. Navigate to admin tool location
5. Your local app loads in production iframe context

## Processing Workflow (To Be Implemented)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  📝 PASTE HTML  │────▶│  🔍 PARSE LINKS │────▶│ 📥 DOWNLOAD     │
│                 │     │                 │     │    RESOURCES    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ ✅ GET OUTPUT   │◀────│ 🔄 REPLACE URLs │◀────│ ☁️ UPLOAD TO    │
│                 │     │                 │     │     CMS         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Need Help?

- Check [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) for workflow details
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Review [PROJECT_STATUS_SUMMARY.md](./PROJECT_STATUS_SUMMARY.md) for roadmap
- Contact: retzion@merkos302.com

---

**Ready!** Foundation is complete. Time to implement the HTML processing features!