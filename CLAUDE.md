ב׳׳ה
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Current Status**: Foundation Complete - Epic #2 Finished (Implementation Ready)

This is an admin tool for ChabadUniverse channel administrators to scrape and publish "Living with the Rebbe" newsletters. The application:
- Runs exclusively as an iframe within ChabadUniverse/Valu Social
- **MVP Scope**: Scrapes 3 most recent newsletters + weekly updates (NOT ~400)
- Downloads and caches media locally (we own all media, no auth required)
- Sends email notifications to retzion@merkos302.com when ready
- Exports to JSON for manual posting until API available
- Will upload media and auto-post when ChabadUniverse API is ready
- Preserves exact HTML styling from original newsletters
- Uses Next.js 15 App Router (not Pages Router)

## Architecture (Based on Universe-Portal)

### Framework & Core Stack
- **Next.js 15.x** with TypeScript for the application framework
- **React 18.x** for UI components
- **MongoDB/Mongoose** for state management and processing tracking
- **Vercel** for hosting and deployment

### UI & Styling
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling
- **Lucide React** for icons

### Valu/ChabadUniverse Integration
- **@arkeytyp/valu-api** for iframe communication and authentication
- **CMS API** for media upload (PUT endpoints)
- **Channel API** for newsletter posting (POST endpoints)
- **Admin-only access** via Valu authentication

### Content Processing Pipeline (MVP - 3 + Weekly)
1. **Archive Scraper**: Fetches 3 most recent newsletters
2. **Newsletter Parser**: Extracts HTML and media URLs
3. **Media Downloader**: Caches media locally (no auth required)
4. **Email Notifier**: Sends to retzion@merkos302.com
5. **JSON Export**: Manual posting until API ready
6. **Future**: Auto-upload and publish when API available

## Common Commands

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Required Environment Variables
```
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=<api-key>
CHABAD_UNIVERSE_CHANNEL_ID=<target-channel>
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe
```

## Workflow

### Scraping Process (MVP)
1. Admin authenticates via Valu/ChabadUniverse
2. Creates new processing session in database
3. Fetches archive from `https://merkos-living.s3.us-west-2.amazonaws.com/Chazak/[year]/LivingWithTheRebbe.html`
4. Parses and selects 3 most recent newsletter links (merkos302.com pattern)
5. For each newsletter:
   - Checks database for existing processing record
   - If already posted, skips to next
   - Extracts HTML content
   - Identifies media assets
   - Uploads media to CMS (stores mappings in DB)
   - Rewrites URLs to CMS locations
   - Posts to channel with tags (parsha, year)
   - Updates database with success status and channel post ID

### API Integration
- **Media Upload**: PUT to ChabadUniverse CMS, returns new URL
- **Newsletter Post**: POST to community channel with HTML and tags
- **Authentication**: Via Valu getCurrentUser() for admin verification

## Key Considerations
- **Admin-only tool** - No public access
- **Iframe-only** - Does not function standalone
- **State Management** - MongoDB tracks processing status and prevents duplicates
- **Preserves styling** - Maintains exact HTML formatting
- **Hebrew/RTL support** - Handles bidirectional text properly
- **Recovery Support** - Can resume failed operations using database state

## Development Patterns (From Universe-Portal)

### Provider Hierarchy
Follow the same provider pattern as universe-portal in root layout:
```typescript
<ValuApiProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</ValuApiProvider>
```

### Valu API Usage
- `useValuAuth()` hook for authentication
- Admin permission verification
- CMS API key management

### File Organization (Next.js 15 App Router)
- `/app` - App Router structure ✅ Created
  - `/app/layout.tsx` - Root layout with fonts ✅
  - `/app/page.tsx` - Home page placeholder ✅
  - `/app/globals.css` - Global styles with Hebrew/RTL ✅
  - `/app/admin` - Admin dashboard pages (to be created)
  - `/app/api` - API route handlers (to be created)
- `/components` - React components ✅ Directory created
  - `/components/admin` - Scraping and publishing UI (to be created)
  - `/components/ui` - Reusable UI components (to be created)
- `/lib` - Core libraries ✅ Directory created
  - `/lib/scraper` - Scraping logic (to be created)
  - `/lib/cms` - CMS integration (to be created)
  - `/lib/db` - Database connection (to be created)
- `/models` - Mongoose schemas ✅ Directory created (schemas to be implemented)
- `/hooks` - Custom React hooks ✅ Directory created
- `/types` - TypeScript types ✅ Core types defined
- `/utils` - Utility functions ✅ env.ts and logger.ts created
- `/scripts` - Node.js CLI scripts ✅ Directory created
- `/public` - Static assets ✅ Directory created

## Development Workflow

This project uses a structured, self-documenting workflow with Claude Code. For complete details, see:

**📖 [Claude Code Workflow Guide](docs/CLAUDE-CODE-WORKFLOW.md)**

### Quick Workflow Overview

1. **Start Session**: `/session-start [issue-name]` - Creates branch and session file
2. **Develop**: Write code, tests, and use TodoWrite for progress tracking
3. **End Session**: `/session-end` - Documents work with comprehensive summary
4. **Update Docs**: `/update-docs` - Syncs all project documentation automatically
5. **Commit**: `/save` - Runs quality checks, creates conventional commit
6. **Pull Request**: `pr` - Creates comprehensive PR with test plan

### Key Commands

- `/session-start [name]` - Begin new development session with Git branch
- `/session-update` - Document progress during long sessions
- `/session-end` - Complete session with detailed summary
- `/update-docs` - Auto-update all documentation files
- `/save` - Commit with quality gates (tests, lint, build)

### Self-Documenting Benefits

The workflow automatically captures:
- **Session files** - Complete development diary with decisions and solutions
- **Documentation updates** - CLAUDE.md, README.md, and all docs stay in sync
- **Commit messages** - Detailed "what" and "why" with conventional format
- **PR descriptions** - Comprehensive summaries with test plans

All development context is preserved without extra effort, creating a zero-effort knowledge base.

## Related Projects
- **Universe-Portal** (`../universe-portal`): Reference architecture
- **Valu API** (https://github.com/Roomful/valu-api): Iframe integration

## Testing Approach
- Unit tests for scraping logic
- Integration tests for CMS upload
- Mock Valu authentication for development
- Test in actual ChabadUniverse iframe

## Project Implementation Status

### ✅ Epic #2 Complete: Foundation and Project Setup
- ✅ Next.js 15.0.0 with App Router configured
- ✅ TypeScript 5.3.3 with strict mode enabled
- ✅ Tailwind CSS 3.4.0 with Hebrew/RTL support
- ✅ Complete directory structure created
- ✅ Root layout with Inter and Heebo fonts
- ✅ Global styles with CSS custom properties
- ✅ Jest 29.7.0 testing framework configured
- ✅ ESLint 8.56.0 with TypeScript rules
- ✅ Prettier 3.6.2 code formatting
- ✅ Husky 9.1.7 with lint-staged pre-commit hooks
- ✅ Core type definitions (Newsletter, Session, API interfaces)
- ✅ Environment variable utilities with validation
- ✅ Logger utility for structured logging
- ✅ All configuration files created and tested
- ✅ Comprehensive documentation
- ✅ Claude Code tooling setup
- ✅ Dependencies installed (30+ packages)

### 📋 Next Implementation Phases

**Epic #3: Database Layer**
- Create MongoDB connection utility
- Implement Newsletter Mongoose model
- Implement ProcessingSession Mongoose model
- Add database seed scripts

**Epic #4: Authentication & Providers**
- Create ValuApiProvider component
- Create AuthProvider component
- Integrate providers into root layout
- Add useValuAuth hook

**Epic #5: Core Scraping Logic**
- Archive scraper implementation
- Newsletter parser
- Media extractor
- URL rewriter

**Epic #6: Admin UI Components**
- Admin dashboard page
- Newsletter list component
- Processing status component
- Radix UI base components

**Epic #7: API Routes**
- Scraping API routes
- Status API routes
- Export API routes
- Webhook endpoints

**Epic #8: Testing & Quality**
- Unit tests for utilities
- Integration tests for API routes
- Component tests for UI
- Mock API server for development

### 🚀 Development Environment Ready
All prerequisites are complete. To start development:
1. ✅ Dependencies installed: `npm install`
2. ✅ Configuration files created and working
3. ✅ Directory structure established
4. ✅ Type definitions in place
5. Configure `.env.local` with your values
6. Start development server: `npm run dev`
7. Begin implementing Epic #3 (Database Layer) or Epic #4 (Providers)