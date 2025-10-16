ב״ה
# Quick Start Guide

Get the Living with the Rebbe admin tool running in 5 minutes.

**Status**: Foundation complete! Next.js app is configured and ready for development.

## What's Already Set Up

✅ Next.js 15 with App Router
✅ TypeScript with strict mode
✅ Tailwind CSS with Hebrew/RTL support
✅ Jest testing framework
✅ ESLint and Prettier
✅ Complete directory structure
✅ Type definitions and utilities

## What Still Needs Implementation

The following components are planned for future epics:
1. Database models and MongoDB connection
2. API routes for scraping and publishing
3. Admin UI components
4. Scraping logic implementation
5. Authentication providers (Valu integration)
6. Mock API server for testing

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
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
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
- Status message showing the current project phase
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
- ✅ Jest tests can be run
- ✅ ESLint code checking
- ✅ Prettier code formatting
- ✅ Git hooks for code quality

### What's Coming Next (Future Epics)
- 📋 Admin dashboard UI
- 📋 Newsletter scraping functionality
- 📋 Database integration
- 📋 API endpoints
- 📋 Authentication with Valu
- 📋 Mock API for testing

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

Current structure (Epic #2 complete):
```
living-with-the-rebbe/
├── app/                    # Next.js 15 App Router ✅
│   ├── layout.tsx         # Root layout with fonts ✅
│   ├── page.tsx           # Home page ✅
│   ├── globals.css        # Global styles ✅
│   ├── admin/             # Admin pages (to be created)
│   └── api/               # API routes (to be created)
├── components/            # React components ✅
│   ├── admin/            # Admin UI (to be created)
│   └── ui/               # Reusable UI (to be created)
├── lib/                  # Core libraries ✅
│   ├── scraper/         # Scraping logic (to be created)
│   ├── cms/             # CMS integration (to be created)
│   └── db/              # Database (to be created)
├── models/               # MongoDB schemas ✅
├── hooks/                # React hooks ✅
├── types/                # TypeScript types ✅
├── utils/                # Utilities ✅
│   ├── env.ts           # Environment vars ✅
│   └── logger.ts        # Logging ✅
├── scripts/              # CLI scripts ✅
├── public/               # Static assets ✅
└── __tests__/            # Test files ✅
```

## Next Steps for Development

1. **Start with Database Layer (Epic #3)**:
   - Create MongoDB connection utility
   - Implement Newsletter and ProcessingSession models

2. **Or Start with Providers (Epic #4)**:
   - Create ValuApiProvider
   - Create AuthProvider
   - Integrate into root layout

3. **Explore Documentation**:
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
   - [API_SPECIFICATION.md](./API_SPECIFICATION.md) - API contracts
   - [MVP_SCOPE.md](./MVP_SCOPE.md) - Feature scope

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

## Testing in ChabadUniverse Iframe (Future)

Once the UI is implemented:
1. Get access to Valu Social Dev Tool
2. Configure localhost:3000 as allowed origin
3. Open ChabadUniverse
4. Navigate to admin tool location
5. Your local app loads in production iframe context

See [docs/valu-social-dev-tool.md](./docs/valu-social-dev-tool.md) for details.

## Need Help?

- Check [MVP_SCOPE.md](./MVP_SCOPE.md) for feature details
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Review [DECISIONS.md](./DECISIONS.md) for resolved questions
- Contact: retzion@merkos302.com

---

**Ready!** Foundation is complete. Time to start building features!