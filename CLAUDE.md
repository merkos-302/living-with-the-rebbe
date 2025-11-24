ב׳׳ה
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Current Status**: Phase 2 MVP Development - 1-2 Week Sprint

This is an admin tool for ChabadUniverse channel administrators to process "Living with the Rebbe" newsletters before distribution.

### Phase 2 MVP Scope
The MVP focuses on delivering a functional HTML processing tool within 1-2 weeks:
- **Core Function**: Process newsletter HTML and replace external resource URLs with CMS URLs
- **Input**: Admin pastes HTML into textarea
- **Processing**: Extract resources, "upload" to CMS (using stubs initially)
- **Output**: Modified HTML with CMS URLs ready for distribution
- **Approach**: Stub-first development - build with mock CMS API, swap when real API available

### Full Application Features (When Complete)
- Runs exclusively as an iframe within ChabadUniverse/Valu Social
- Takes newsletter HTML as input (paste or upload)
- Extracts all external resources (PDFs, images, documents)
- Downloads resources and uploads them to ChabadUniverse CMS
- Replaces original URLs with CMS URLs (which handle auth/redirects)
- Returns modified HTML ready for distribution
- Tracks processing history in MongoDB

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

### API Integration (Phase 2 MVP)
For the MVP, we use stub functions that simulate the CMS API:
- **Stub Upload**: Mock function returns fake CMS URLs
- **Pattern**: `https://cms.chabaduniverse.com/api/resource/mock-{id}`
- **Migration Path**: Replace stubs with real API when available

### API Integration (Production)
When the real CMS API is available:
- **Resource Upload**: PUT to ChabadUniverse CMS, returns new URL
- **Authentication**: Via Valu getCurrentUser() for admin verification
- **Error Handling**: Retry logic for failed uploads
- **Access Control**: Files can be public, private, or permissioned
- **Redirect Logic**: CMS URLs redirect based on auth status

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

## Phase 2 MVP Implementation (1-2 Week Sprint)

### Week 1: Core Processing
**Days 1-2: HTML Input & Parser**
- [ ] Admin page at `/app/admin/page.tsx`
- [ ] HTML textarea component for paste input
- [ ] Cheerio parser to extract external URLs
- [ ] Basic processing types and interfaces

**Days 3-4: Resource Processing**
- [ ] Resource extractor (PDFs, images, documents)
- [ ] URL mapping system (original → CMS)
- [ ] HTML URL replacement engine
- [ ] Test with sample newsletter

**Day 5: CMS Stub Functions**
- [ ] Create `/lib/cms/cmsStubs.ts` with mock upload
- [ ] Return fake CMS URLs for testing
- [ ] Wire stubs to processing pipeline

### Week 2: UI & Polish
**Days 6-7: Basic Interface**
- [ ] Processing status indicators
- [ ] Output textarea with processed HTML
- [ ] Copy-to-clipboard functionality
- [ ] Basic error display

**Days 8-9: Integration**
- [ ] End-to-end testing
- [ ] Handle edge cases
- [ ] Basic retry logic
- [ ] Simple admin layout

**Day 10: Deployment**
- [ ] Documentation updates
- [ ] Deploy to Vercel
- [ ] Handoff notes for real API

### Out of Scope for MVP
- MongoDB processing history
- Before/after preview
- Batch processing
- Full Valu authentication (stub admin access)
- Production error recovery
- Analytics dashboard

## Related Projects
- **Universe-Portal** (`../universe-portal`): Reference architecture
- **Valu API** (https://github.com/Roomful/valu-api): Iframe integration

## Testing Approach
- Unit tests for HTML parsing logic
- Integration tests for CMS upload
- Mock Valu authentication for development
- Test in actual ChabadUniverse iframe

## Project Status Summary

### ✅ Complete (Infrastructure)
- Next.js 15 setup with App Router
- TypeScript configuration
- Tailwind CSS with Hebrew/RTL support
- Directory structure
- Core type definitions (needs updating)
- Development workflow
- Sample newsletter for testing

### 🎯 Phase 2 MVP To Build (1-2 Weeks)
- [ ] HTML input textarea component
- [ ] Cheerio-based resource extractor
- [ ] URL replacement engine
- [ ] CMS stub functions
- [ ] Basic admin UI
- [ ] Copy-to-clipboard output
- [ ] Deploy to Vercel

### 📦 Future Enhancements (Post-MVP)
- Real CMS API integration
- MongoDB processing history
- Before/after preview
- Batch processing
- Full authentication
- Error recovery UI
- Analytics dashboard

### 🚀 Getting Started for Phase 2 MVP
1. Review this document and PHASE2_MVP.md
2. Run `npm install` to ensure dependencies
3. Run `npm run dev` to start development
4. Begin with `/app/admin/page.tsx` - the HTML input interface
5. Use stub functions for CMS API
6. Test with `/public/samples/5785/yom_kippur.html`