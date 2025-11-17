ב׳׳ה
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Current Status**: Foundation Complete - Ready for HTML Processing Implementation

This is an admin tool for ChabadUniverse channel administrators to process "Living with the Rebbe" newsletters before distribution. The application:
- Runs exclusively as an iframe within ChabadUniverse/Valu Social
- **Core Function**: Processes pasted HTML to upload resources to CMS
- Takes newsletter HTML as input (paste or upload)
- Extracts all external resources (PDFs, images, documents)
- Downloads resources and uploads them to ChabadUniverse CMS
- Replaces original URLs with CMS URLs (which handle auth/redirects)
- Returns modified HTML ready for distribution
- Uses Next.js 15 App Router (not Pages Router)

## Architecture

### Framework & Core Stack
- **Next.js 15.x** with TypeScript for the application framework
- **React 18.x** for UI components
- **MongoDB/Mongoose** for processing history tracking
- **Vercel** for hosting and deployment

### UI & Styling
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling
- **Lucide React** for icons

### Valu/ChabadUniverse Integration
- **@arkeytyp/valu-api** for iframe communication and authentication
- **CMS API** for resource upload (PUT endpoints)
- **Admin-only access** via Valu authentication

### Content Processing Pipeline
1. **HTML Input**: Admin pastes or uploads newsletter HTML
2. **Resource Parser**: Extracts all external links using Cheerio
3. **Resource Downloader**: Fetches files from original locations
4. **CMS Uploader**: Uploads to ChabadUniverse CMS via Valu API
5. **URL Replacer**: Swaps original URLs with CMS URLs
6. **HTML Output**: Returns modified HTML for distribution

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
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe
```

## Processing Workflow

### HTML Processing Flow
1. Admin authenticates via Valu/ChabadUniverse
2. Pastes newsletter HTML into the input interface
3. System parses HTML to identify external resources:
   - PDF documents (e.g., Torah portions, study guides)
   - Images (newsletter graphics, photos)
   - Other documents (Word files, etc.)
4. For each resource:
   - Downloads from original URL
   - Validates file type and size
   - Uploads to ChabadUniverse CMS
   - Receives new CMS URL with auth handling
   - Maps original URL → CMS URL
5. Replaces all URLs in the HTML
6. Presents modified HTML for admin review
7. Admin copies final HTML for distribution

### CMS URL Behavior
The CMS URLs returned (e.g., `https://cms.chabaduniverse.com/api/resource/abc123`) automatically:
- Check viewer authentication status
- Redirect authenticated users to in-app view (within ChabadUniverse frame)
- Redirect public users to website view
- Track resource access for analytics

### API Integration
- **Resource Upload**: PUT to ChabadUniverse CMS, returns new URL
- **Authentication**: Via Valu getCurrentUser() for admin verification
- **Error Handling**: Retry logic for failed uploads

## Key Considerations
- **Admin-only tool** - No public access
- **Iframe-only** - Does not function standalone
- **Processing History** - MongoDB tracks all processing sessions
- **Preserves HTML** - Maintains exact formatting, only replaces URLs
- **Hebrew/RTL support** - Handles bidirectional text properly
- **Error Recovery** - Can retry failed uploads

## Development Patterns

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
  - `/app/page.tsx` - Home page ✅
  - `/app/globals.css` - Global styles with Hebrew/RTL ✅
  - `/app/admin` - Admin processing pages (to be created)
  - `/app/api` - API route handlers (to be created)
- `/components` - React components ✅ Directory created
  - `/components/admin` - Processing UI components (to be created)
  - `/components/ui` - Reusable UI components (to be created)
- `/lib` - Core libraries ✅ Directory created
  - `/lib/parser` - HTML parsing logic (to be created)
  - `/lib/cms` - CMS upload integration (to be created)
  - `/lib/processor` - Resource processing (to be created)
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

## Implementation Roadmap

### Phase 1: Core HTML Processing (Priority: IMMEDIATE)
- [ ] HTML input component (textarea for paste)
- [ ] Cheerio-based resource extractor
- [ ] Resource URL validator
- [ ] Basic UI layout

### Phase 2: Resource Processing (Priority: HIGH)
- [ ] Parallel resource downloader
- [ ] File type validation
- [ ] CMS upload integration via Valu API
- [ ] URL replacement engine

### Phase 3: User Interface (Priority: MEDIUM)
- [ ] Processing status display
- [ ] Before/after preview
- [ ] Copy-to-clipboard for output
- [ ] Error handling UI

### Phase 4: Data Persistence (Priority: LOW)
- [ ] MongoDB models for history
- [ ] Processing session tracking
- [ ] Analytics dashboard

## Related Projects
- **Universe-Portal** (`../universe-portal`): Reference architecture
- **Valu API** (https://github.com/Roomful/valu-api): Iframe integration

## Testing Approach
- Unit tests for HTML parsing logic
- Integration tests for CMS upload
- Mock Valu authentication for development
- Test in actual ChabadUniverse iframe

## Project Status Summary

### ✅ Complete
- Next.js 15 setup with App Router
- TypeScript configuration
- Tailwind CSS with Hebrew/RTL support
- Directory structure
- Core type definitions
- Development workflow

### 📋 To Implement
- HTML input interface
- Resource extraction logic
- Download/upload pipeline
- URL replacement engine
- Admin UI components
- Processing history tracking

### 🚀 Getting Started
1. Configure `.env.local` with your values
2. Run `npm run dev` to start development
3. Begin with Phase 1: HTML input and parsing
4. Use mock CMS API for development