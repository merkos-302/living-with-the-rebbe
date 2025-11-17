ב״ה
# Quick Start Guide

Get the Living with the Rebbe admin tool running in 5 minutes.

**Status**: Foundation complete! Next.js app is configured and ready for HTML processing implementation.

## What's Already Set Up

✅ Next.js 15 with App Router
✅ TypeScript with strict mode
✅ Tailwind CSS with Hebrew/RTL support
✅ Jest testing framework
✅ ESLint and Prettier
✅ Complete directory structure
✅ Type definitions and utilities
✅ Sample newsletter with assets

## What Still Needs Implementation

The following components are planned for the HTML processing workflow:
1. HTML input interface (paste/upload)
2. Resource parser using Cheerio
3. CMS upload integration via Valu API
4. URL replacement engine
5. Admin UI components
6. Processing history with MongoDB

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
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=your-api-key  # For CMS uploads
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe
```

### 3. Start Development Server (1 minute)
```bash
npm run dev
# App running at http://localhost:3000
```

### 4. Verify Installation (1 minute)
Open your browser to http://localhost:3000

You should see:
- "Living with the Rebbe - Admin Tool" heading
- Button to view sample newsletter
- Clean, styled interface with Hebrew font support

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

### What's Coming Next (HTML Processing)
- 📋 HTML input component for pasting newsletters
- 📋 Resource extraction using Cheerio
- 📋 Parallel resource downloading
- 📋 CMS upload via Valu API
- 📋 URL replacement in HTML
- 📋 Processing status display
- 📋 Before/after preview

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

Current structure (Foundation complete):
```
living-with-the-rebbe/
├── app/                    # Next.js 15 App Router ✅
│   ├── layout.tsx         # Root layout with fonts ✅
│   ├── page.tsx           # Home page with sample ✅
│   ├── globals.css        # Global styles ✅
│   ├── admin/             # Admin pages (to be created)
│   └── api/               # API routes (to be created)
├── components/            # React components ✅
│   ├── admin/            # Processing UI (to be created)
│   └── ui/               # Reusable UI (to be created)
├── lib/                  # Core libraries ✅
│   ├── parser/          # HTML parsing (to be created)
│   ├── cms/             # CMS integration (to be created)
│   └── processor/       # Resource processing (to be created)
├── models/               # MongoDB schemas ✅
├── hooks/                # React hooks ✅
├── types/                # TypeScript types ✅
├── utils/                # Utilities ✅
│   ├── env.ts           # Environment vars ✅
│   └── logger.ts        # Logging ✅
├── scripts/              # CLI scripts ✅
├── public/               # Static assets ✅
│   └── samples/         # Sample newsletter ✅
└── __tests__/            # Test files ✅
```

## Next Steps for Development

1. **Start with HTML Parser**:
   - Create HTML input component
   - Implement Cheerio-based resource extractor
   - Test with sample newsletter

2. **Build Resource Processing**:
   - Implement parallel downloader
   - Create CMS upload integration
   - Build URL replacement engine

3. **Create Admin UI**:
   - Processing dashboard
   - Status indicators
   - Output viewer with copy function

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