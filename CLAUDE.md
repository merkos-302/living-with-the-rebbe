ב׳׳ה
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Current Status**: Phase 2 MVP Development - Days 1-3 Complete (HTML Input & Parser), Phase 3 Next (Resource Processing)

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
- **@arkeytyp/valu-api v1.1.1** for iframe communication, authentication, and file storage ✅
- **CMS via Service Intents** - Real API available for file upload/URL generation ✅
  - `ApplicationStorage.resource-upload` - Upload files
  - `ApplicationStorage.resource-search` - List/search files (for deduplication)
  - `Resources.generate-public-url` - Get shareable URLs (handles auth automatically)
- **Admin-only access** via Valu authentication ✅
- **Cookie-based caching** for fast user loading ✅
- **Health monitoring** with adaptive intervals ✅

### Content Processing Pipeline
1. **HTML Input**: Admin provides newsletter HTML via URL fetch (default) or paste (fallback) ✅
   - URL Fetch Mode: Fetches HTML from S3/web URLs, automatically resolves relative URLs ✅
   - Paste Mode: Manual HTML paste with base URL field for relative URL resolution ✅
2. **Resource Parser**: Extracts linked documents (PDFs, Word docs) from `<a>` tags using Cheerio ✅
   - **IMPORTANT**: Only extracts LINKED documents from `<a href>` tags, NOT inline images from `<img>` tags
   - Inline images are part of the email's visual content and remain unchanged
   - Only downloadable resources need CMS hosting
   - Supports 21 file formats (PDFs, Word docs, Excel sheets, etc.)
3. **Resource Downloader**: Fetches files from original locations (Phase 3 - to be implemented)
4. **CMS Uploader**: Uploads to ChabadUniverse CMS via Valu API (Phase 3 - to be implemented)
5. **URL Replacer**: Swaps original URLs with CMS URLs (Phase 3 - to be implemented)
6. **HTML Output**: Returns modified HTML for distribution (Phase 3 - to be implemented)

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

### API Integration (Phase 3 - Real Valu API)
The Valu API v1.1.1 provides production-ready file storage via **Service Intents**:

```typescript
// Upload file to CMS
const uploadIntent = new Intent("ApplicationStorage", "resource-upload", {
  files: fileList  // FileList from converted ArrayBuffer
});
const result = await valuApi.callService(uploadIntent);

// Get public URL (handles auth automatically)
const urlIntent = new Intent("Resources", "generate-public-url", {
  resourceId: "uploaded-resource-id"
});
const publicUrl = await valuApi.callService(urlIntent);
```

**Key Features**:
- **File Upload**: Via `ApplicationStorage.resource-upload`
- **Deduplication**: Check existing files via `resource-search` before uploading
- **Public URLs**: Via `Resources.generate-public-url` - automatically handles auth redirects
- **Error Handling**: Retry 2-3x with exponential backoff, then skip and continue
- **Concurrency**: Process 3 resources in parallel

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
  - `/app/layout.tsx` - Root layout with providers ✅
  - `/app/page.tsx` - Authenticated home page ✅
  - `/app/providers.tsx` - Client-side provider hierarchy ✅
  - `/app/globals.css` - Global styles with Hebrew/RTL ✅
  - `/app/admin` - Admin processing pages ✅
    - `/app/admin/layout.tsx` - Authenticated wrapper ✅
    - `/app/admin/page.tsx` - Admin dashboard with tabbed interface ✅
  - `/app/api` - API route handlers ✅
    - `/app/api/parse/route.ts` - HTML parsing endpoint ✅
    - `/app/api/fetch-html/route.ts` - Server-side URL fetcher with rate limiting ✅
- `/components` - React components ✅ Directory created
  - `/components/valu` - Valu authentication components ✅
    - `ValuFrameGuard.tsx` - Iframe enforcement ✅
    - `AccessDenied.tsx` - Access denied UI ✅
  - `/components/LoadingSpinner.tsx` - Loading states ✅
  - `/components/admin` - Processing UI components ✅
    - `HtmlInput.tsx` - Dual-mode input (URL fetch + paste HTML) with base URL field ✅
    - `UrlInput.tsx` - URL fetch interface with automatic relative URL resolution ✅
    - `ParseResults.tsx` - Resource grid with filtering and statistics ✅
    - `ResourcePreview.tsx` - Individual resource cards ✅
    - `HtmlPreview.tsx` - Code viewer with syntax highlighting ✅
  - `/components/ui` - Reusable UI components (to be created)
- `/lib` - Core libraries ✅ Directory created
  - `/lib/valu-api-singleton.ts` - Valu API instance manager ✅
  - `/lib/parser` - HTML parsing logic ✅ COMPLETE
    - `html-parser.ts` - Cheerio-based parser ✅
    - `resource-identifier.ts` - Identifies 21 file formats ✅
    - `index.ts` - Public API ✅
    - `demo.ts` - Example usage ✅
    - Full documentation in `/lib/parser/README.md` ✅
    - 181 comprehensive tests - all passing across 7 test suites ✅
  - `/lib/fetcher` - URL fetching logic ✅ COMPLETE
    - `url-fetcher.ts` - Server-side HTML fetcher with relative URL resolution ✅
    - Comprehensive tests for S3 URLs and various URL formats ✅
  - `/lib/downloader` - Resource downloading (Phase 3)
    - `resource-downloader.ts` - Download files from URLs
    - `index.ts` - Public exports
  - `/lib/cms` - CMS upload via Valu API (Phase 3)
    - `cms-uploader.ts` - Upload using Service Intents
    - `file-converter.ts` - ArrayBuffer → File/FileList conversion
    - `types.ts` - TypeScript types
    - `index.ts` - Public exports
  - `/lib/replacer` - URL replacement (Phase 3)
    - `url-replacer.ts` - Cheerio-based URL swapping
    - `index.ts` - Public exports
  - `/lib/processor` - Processing orchestration (Phase 3)
    - `resource-processor.ts` - Full pipeline coordinator
    - `types.ts` - Processing types
    - `index.ts` - Public exports
  - `/lib/db` - Database connection (future)
- `/contexts` - React contexts ✅ Directory created
  - `ValuApiContext.tsx` - Valu API context ✅
  - `AuthContext.tsx` - Authentication context ✅
- `/hooks` - Custom React hooks ✅ Directory created
  - `useValuApi.ts` - Low-level API connection hook ✅
  - `useValuAuth.ts` - High-level authentication hook ✅
- `/types` - TypeScript types ✅ Core types defined
- `/utils` - Utility functions ✅
  - `env.ts` and `logger.ts` ✅
  - `valuAuthCookie.ts` - Cookie-based caching ✅
- `/scripts` - Node.js CLI scripts ✅ Directory created
- `/public` - Static assets ✅ Directory created
  - `test-harness.html` - Development iframe simulator ✅

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

**Day 1: Valu API Authentication** ✅ COMPLETE
- [x] Install and configure `@arkeytyp/valu-api@^1.1.0`
- [x] Implement `/lib/valu-api-singleton.ts` (186 lines)
- [x] Create `/utils/valuAuthCookie.ts` for caching (104 lines)
- [x] Build `/hooks/useValuApi.ts` connection hook (169 lines)
- [x] Build `/hooks/useValuAuth.ts` authentication hook (243 lines)
- [x] Create `/contexts/ValuApiContext.tsx` (49 lines)
- [x] Create `/contexts/AuthContext.tsx` (32 lines)
- [x] Implement `/components/valu/ValuFrameGuard.tsx` (100 lines)
- [x] Create `/components/valu/AccessDenied.tsx` (65 lines)
- [x] Create `/components/LoadingSpinner.tsx` (28 lines)
- [x] Update `/app/layout.tsx` with providers
- [x] Update `/app/page.tsx` with authentication
- [x] Create `/public/test-harness.html` for development (252 lines)
- [x] Configure environment variables for dev mode
- [x] Verify builds and production readiness

**Days 2-3: HTML Input & Parser** ✅ COMPLETE
- [x] Admin page at `/app/admin/page.tsx` with tabbed interface (Resources, HTML Preview, Statistics)
- [x] Admin layout with authentication at `/app/admin/layout.tsx`
- [x] Dual-mode HTML input component at `/components/admin/HtmlInput.tsx`
  - URL fetch mode (default): Fetches HTML from S3/web URLs
  - Paste mode (fallback): Manual HTML paste
- [x] URL input component at `/components/admin/UrlInput.tsx`
- [x] Server-side URL fetcher at `/lib/fetcher/url-fetcher.ts`
- [x] Base URL field for resolving relative URLs manually
- [x] Automatic relative URL resolution in URL fetch mode
- [x] Cheerio parser to extract linked documents from `<a>` tags
- [x] Resource identifier supporting 21 file formats
- [x] Preview components (ParseResults, ResourcePreview, HtmlPreview)
- [x] API endpoints: `/api/parse` and `/api/fetch-html` with rate limiting
- [x] 181 comprehensive tests - all passing across 7 test suites
- [x] Full documentation in `/lib/parser/README.md` and `/lib/fetcher/README.md`

**Important Implementation Decision**:
The parser ONLY extracts linked documents (PDFs, Word docs, etc.) from `<a href>` tags, NOT inline images from `<img src>` tags. This is intentional - inline images are part of the email's visual content and should remain as-is, while only downloadable resources need CMS hosting.

**Key Feature - Dual-Mode Input**:
URL fetch is the DEFAULT mode, automatically resolving all relative URLs using the base URL. Paste mode with base URL field is available as fallback for cases where URL fetching isn't possible.

**Phase 3: Resource Processing** (NEXT - Using Real Valu API)

**Step 1: Update Dependencies**
- [ ] Update `@arkeytyp/valu-api` from 1.1.0 → 1.1.1 for Service Intents

**Step 2: Resource Downloader (`/lib/downloader/`)**
- [ ] `resource-downloader.ts` - Download files from original URLs
- [ ] Server-side API route `/api/download-resource` to avoid CORS
- [ ] Parallel downloads with concurrency limit (3)
- [ ] Retry logic with exponential backoff

**Step 3: CMS Upload Service (`/lib/cms/`)**
- [ ] `cms-uploader.ts` - Upload to Valu via Service Intents
- [ ] `file-converter.ts` - Convert ArrayBuffer → File/FileList
- [ ] Check for duplicates using `resource-search` before upload
- [ ] Get public URLs via `generate-public-url`

**Step 4: URL Replacement Engine (`/lib/replacer/`)**
- [ ] `url-replacer.ts` - Swap URLs in HTML using Cheerio
- [ ] Preserve all HTML attributes
- [ ] Track replacement statistics

**Step 5: Processing Orchestrator (`/lib/processor/`)**
- [ ] `resource-processor.ts` - Full pipeline: Parse → Download → Upload → Replace
- [ ] Processing hook `useProcessing.ts` for React state management

**Step 6: UI Updates**
- [ ] Processing progress indicators
- [ ] Before/after HTML preview
- [ ] Copy-to-clipboard for output

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

### ✅ Complete (Infrastructure, Authentication, and Parser)
- Next.js 15 setup with App Router
- TypeScript configuration
- Tailwind CSS with Hebrew/RTL support
- Directory structure
- Core type definitions
- Development workflow
- Sample newsletter for testing
- **Valu API Authentication System (Day 1)** - 12 files, 1,356 lines
  - Iframe-only access enforcement
  - Admin permission verification
  - Cookie-based user caching
  - Health monitoring
  - Multiple fallback methods
  - Development test harness
  - ChabadUniverse user format compatibility
  - postRunResult bug fix applied
- **HTML Input and Parser System (Days 2-3)** - 30+ files, 3,000+ lines
  - Admin dashboard with tabbed interface (Resources, HTML Preview, Statistics)
  - Dual-mode HTML input (URL fetch as default, paste as fallback)
  - Server-side URL fetcher avoiding CORS issues
  - Automatic relative URL resolution in URL fetch mode
  - Base URL field for manual relative URL resolution
  - Cheerio-based parser (linked documents only from <a> tags)
  - Resource identifier (21 file formats)
  - Preview components with filtering and statistics
  - API routes: /api/parse and /api/fetch-html with rate limiting
  - 181 comprehensive tests - all passing across 7 test suites
  - Full documentation in /lib/parser/README.md and /lib/fetcher/README.md

### 🎯 Phase 3: Resource Processing (NEXT - Real Valu API)

**Dependencies**:
- [ ] Update `@arkeytyp/valu-api` 1.1.0 → 1.1.1

**Core Modules** (GitHub #31):
- [ ] `/lib/downloader/` - Download resources from original URLs
- [ ] `/lib/cms/` - Upload to Valu CMS via Service Intents
- [ ] `/lib/replacer/` - URL replacement engine (GitHub #32)
- [ ] `/lib/processor/` - Pipeline orchestrator
- [ ] `/hooks/useProcessing.ts` - React state management

**API Routes**:
- [ ] `/api/download-resource` - Server-side download (avoid CORS)
- [ ] `/api/process` - Full processing endpoint

**UI Updates** (GitHub #34):
- [ ] Processing progress indicators
- [ ] Before/after HTML preview
- [ ] Copy-to-clipboard for output

### 📦 Future Enhancements (Post-MVP)
- MongoDB processing history
- Before/after preview
- Batch processing
- Full authentication
- Error recovery UI
- Analytics dashboard

### 🚀 Getting Started for Phase 3
1. Review this document and the plan at `/.claude/plans/rippling-exploring-rain.md`
2. Update dependency: `npm install @arkeytyp/valu-api@1.1.1`
3. Review Valu API file storage docs at `../valu-api/FILE_STORAGE_API.md`
4. Start with GitHub issue #31 - Integrate Valu API for CMS uploads
5. Create modules in order: downloader → cms → replacer → processor
6. Test with `/public/samples/5785/yom_kippur.html`

**Key Reference Files**:
- `/lib/parser/html-parser.ts` - Understand ParsedResource structure
- `/types/parser.ts` - Resource type definitions
- `/hooks/useValuAuth.ts` - How Valu API is accessed
- `../valu-api/FILE_STORAGE_API.md` - Valu file storage API