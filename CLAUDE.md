ב׳׳ה
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Current Status**: Planning/Documentation Phase (No code implemented yet)

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
- `/app` - App Router structure
  - `/app/admin` - Admin dashboard pages
  - `/app/api` - API route handlers
- `/components/admin` - Scraping and publishing UI
- `/lib/scraper` - Scraping logic
- `/lib/cms` - CMS integration
- `/lib/db` - Database connection and queries
- `/models` - Mongoose schemas (Newsletter, ProcessingSession)
- `/hooks` - Custom React hooks
- `/scripts` - Node.js CLI scripts for scraping operations

## Related Projects
- **Universe-Portal** (`../universe-portal`): Reference architecture
- **Valu API** (https://github.com/Roomful/valu-api): Iframe integration

## Testing Approach
- Unit tests for scraping logic
- Integration tests for CMS upload
- Mock Valu authentication for development
- Test in actual ChabadUniverse iframe

## Project Implementation Status

### ✅ Completed
- Comprehensive documentation and specifications
- Architecture design and database schemas
- API contract definitions
- Development workflow documentation
- Claude Code tooling setup

### 🚧 Not Yet Implemented (Needs Development)
- Next.js application setup and configuration
- React components and UI
- API routes and handlers
- Database models and connections
- Scraping logic implementation
- Media processing pipeline
- Email notification system
- Mock API for development
- Test suite and coverage

### 📋 Prerequisites for Development
1. Install dependencies: `npm install`
2. Create required configuration files:
   - `tsconfig.json`
   - `next.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `jest.config.js`
   - `.eslintrc.json`
3. Set up MongoDB connection
4. Configure environment variables in `.env.local`
5. Implement mock ChabadUniverse API for development

### 🚀 Getting Started with Implementation
When ready to begin development:
1. Run `npm install` to install all dependencies
2. Create the App Router structure in `/app`
3. Set up MongoDB schemas in `/models`
4. Implement scraping logic in `/lib/scraper`
5. Build admin UI components in `/components/admin`
6. Create API routes in `/app/api`
7. Set up mock API server for local development
8. Test in Valu Social Dev Tool iframe