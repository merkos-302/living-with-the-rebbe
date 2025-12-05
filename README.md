ב׳׳ה
# Living with the Rebbe - Newsletter Resource Processor

Administrative tool for ChabadUniverse that processes newsletter HTML to centralize resources on the CMS platform.

## 🎯 Phase 3 Complete - Full Pipeline Implemented

**Current Status**: Phase 3 Complete - Full resource processing pipeline operational
**Progress**: 305 passing tests across all modules
**Remaining**: End-to-end testing with real newsletters, CMS 801 error investigation (server-side)

## What This Tool Does

Administrators provide newsletter HTML (via URL fetch or paste), which then:
1. **Extracts** linked documents (PDFs, Word docs) from <a> tags
2. **Downloads** the resources from their original locations
3. **Uploads** them to ChabadUniverse CMS via Valu API
4. **Replaces** original URLs with secure CMS URLs
5. **Returns** modified HTML ready for distribution

**Important**: The parser ONLY extracts linked documents (PDFs, Word docs from <a> tags), NOT inline images (<img> tags). Inline images remain part of the email content.

The CMS URLs automatically handle viewer authentication - authenticated users see resources in-app, while others are redirected to the website.

## Quick Links

| Essential Docs | Description |
|----------------|-------------|
| [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) | High-level overview with workflow diagram |
| [QUICKSTART.md](./QUICKSTART.md) | Get running in 5 minutes |
| [Claude Code Workflow](./docs/CLAUDE-CODE-WORKFLOW.md) | Development workflow guide |
| [PROJECT_STATUS_SUMMARY.md](./PROJECT_STATUS_SUMMARY.md) | Detailed status and roadmap |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design (needs update) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |

## Phase 2 MVP Features

**Foundation (✅ Complete)**:
- Next.js 15 with App Router configured
- TypeScript with strict mode
- Tailwind CSS with Hebrew/RTL support
- Cheerio installed for HTML parsing
- ESLint and Prettier configured
- Complete directory structure
- Sample newsletter for testing
- **Valu API Authentication System** (Day 1 Complete)

**Authentication Implementation (✅ Complete)**:
- Iframe-only access enforcement
- Valu API integration (@arkeytyp/valu-api v1.1.0)
- Admin permission verification
- Cookie-based user caching
- Health monitoring with adaptive intervals
- Multiple fallback methods for user fetching
- Development mode with test harness
- ChabadUniverse user format compatibility

**Phase 2 Complete (✅ Days 1-3)**:
- ✅ Valu API authentication with admin verification
- ✅ Dual-mode HTML input (URL fetch as default, paste as fallback)
- ✅ Server-side URL fetcher avoiding CORS issues
- ✅ Base URL field for resolving relative URLs automatically
- ✅ Cheerio parser extracting ONLY linked documents (PDFs, Word docs from <a> tags)
- ✅ Resource identification for 21 file formats
- ✅ Admin dashboard with tabbed interface (Resources, HTML Preview, Statistics)
- ✅ Preview components with filtering and statistics
- ✅ API routes: /api/parse and /api/fetch-html with rate limiting

**Phase 3 Complete (✅ Resource Processing)**:
- ✅ Resource downloader with parallel processing (`/lib/downloader/` - 23 tests)
- ✅ CMS upload via Valu Service Intents (`/lib/cms/` - 56 tests)
- ✅ URL replacement engine (`/lib/replacer/` - 36 tests)
- ✅ Pipeline orchestrator (`/lib/processor/`)
- ✅ Processing hook (`/hooks/useProcessing.ts`)
- ✅ Admin UI with progress tracking and output viewer
- ✅ **305 tests - all passing**

**Remaining**:
- End-to-end testing with real newsletters
- CMS 801 error investigation (server-side Roomful API issue)
- Deploy to Vercel

**Future Enhancements (📦 Post-MVP)**:
- MongoDB processing history
- Before/after preview comparison
- Batch processing
- Analytics dashboard

## Quick Start for MVP Development

```bash
# Install dependencies
npm install

# Configure environment (optional for local dev)
cp .env.example .env.local
# Set NEXT_PUBLIC_VALU_DEV_MODE=true for local development

# Start development server
npm run dev

# For iframe testing, open test harness:
# http://localhost:3000/test-harness.html

# Or access directly (requires dev mode):
# http://localhost:3000
```

### MVP Implementation Path
1. Start with `/app/admin/page.tsx` - Create HTML input interface
2. Implement `/lib/parser/htmlParser.ts` - Extract resources with Cheerio
3. Create `/lib/cms/cmsStubs.ts` - Mock CMS upload functions
4. Build `/lib/parser/urlReplacer.ts` - Replace URLs in HTML
5. Test with `/public/samples/5785/yom_kippur.html`

## Installation (Full Setup)

```bash
# Clone and install
git clone [repository-url]
cd living-with-the-rebbe
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Start development
npm run dev
# Visit http://localhost:3000
```

## Environment Variables

```env
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=your-api-key  # For CMS uploads
CHABAD_UNIVERSE_CHANNEL_ID=<target-channel>
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe
```

## Tech Stack

### Framework & Build Tools
- **Next.js 15.0.0** with App Router
- **React 18.2.0**
- **TypeScript 5.3.3** with strict mode
- **Tailwind CSS 3.4.0** with animations

### UI & Components
- **Radix UI** primitives (Dialog, Dropdown, Tabs, Toast)
- **Lucide React** for icons
- **Framer Motion** for animations

### Backend & Data
- **MongoDB/Mongoose 8.0.3** for processing history
- **@arkeytyp/valu-api** for CMS integration
- **Cheerio** for HTML parsing
- **Axios** for HTTP requests

### Development Tools
- **Jest 29.7.0** with React Testing Library
- **ESLint 8.56.0** with TypeScript support
- **Prettier 3.6.2** for code formatting
- **Husky 9.1.7** with lint-staged for pre-commit hooks

## Processing Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  📝 PASTE HTML  │────▶│  🔍 PARSE LINKS │────▶│ 📥 DOWNLOAD     │
│                 │     │                 │     │    RESOURCES    │
│ Admin pastes    │     │ Find all PDFs,  │     │ Fetch files     │
│ newsletter HTML │     │ images, docs    │     │ from sources    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ ✅ GET OUTPUT   │◀────│ 🔄 REPLACE URLs │◀────│ ☁️ UPLOAD TO    │
│                 │     │                 │     │     CMS         │
│ Modified HTML   │     │ Swap external   │     │ Via Valu API    │
│ ready to send   │     │ links with CMS  │     │ get new URLs    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Project Status

**Current Phase**: Phase 3 Complete - Full Pipeline Operational

### Phase 2: HTML Input and Parsing (✅ COMPLETE)
- [x] **Day 1: Valu API Authentication** ✅
- [x] **Days 2-3: HTML Input & Parser** ✅

### Phase 3: Resource Processing (✅ COMPLETE)
- [x] Resource downloader with parallel processing (`/lib/downloader/` - 23 tests)
- [x] CMS upload via Valu Service Intents (`/lib/cms/` - 56 tests)
- [x] URL replacement engine (`/lib/replacer/` - 36 tests)
- [x] Pipeline orchestrator (`/lib/processor/`)
- [x] Processing hook (`/hooks/useProcessing.ts`)
- [x] Admin UI with progress tracking and output viewer
- [x] Loading screen until authenticated
- [x] User name display in header

### Remaining Tasks
- [ ] End-to-end testing with real newsletters
- [ ] Investigate CMS 801 error (server-side Roomful API issue)
- [ ] Deploy to Vercel

### Infrastructure Complete
- ✅ Next.js 15 with App Router configured
- ✅ TypeScript with strict mode enabled
- ✅ Tailwind CSS with Hebrew/RTL support
- ✅ Jest testing framework configured
- ✅ ESLint and Prettier configured
- ✅ Git hooks with Husky and lint-staged
- ✅ Complete directory structure created
- ✅ Sample newsletter for testing
- ✅ **Valu API authentication system (12 files)**
- ✅ **HTML input and parser system (30+ files)**
- ✅ **Resource processing pipeline (4 new modules)**
- ✅ **305 comprehensive tests - all passing**

## Development Workflow

This project uses a structured, self-documenting workflow with Claude Code. See [Claude Code Workflow Guide](docs/CLAUDE-CODE-WORKFLOW.md) for details.

### Key Commands
- `/session-start [name]` - Begin new development session
- `/session-update` - Document progress
- `/session-end` - Complete session with summary
- `/save` - Create conventional commit

---

**License**: Proprietary - Internal use only