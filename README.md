ב׳׳ה
# Living with the Rebbe - Newsletter Resource Processor

Administrative tool for ChabadUniverse that processes newsletter HTML to centralize resources on the CMS platform.

## 🎯 Phase 2 MVP - 1-2 Week Sprint

**Current Focus**: Build minimal viable HTML processor with stub CMS integration
**Timeline**: 1-2 weeks to functional MVP
**Approach**: Stub-first development - mock CMS API, replace when available

## What This Tool Does

Administrators paste newsletter HTML into the app, which then:
1. **Extracts** all external resources (PDFs, images, documents)
2. **Downloads** the resources from their original locations
3. **Uploads** them to ChabadUniverse CMS via Valu API
4. **Replaces** original URLs with secure CMS URLs
5. **Returns** modified HTML ready for distribution

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

**MVP Sprint (🚀 In Progress - Week 1)**:
- HTML textarea input for paste
- Cheerio parser to extract resources
- URL replacement engine
- CMS stub functions (mock uploads)
- Basic processing status display
- Copy-to-clipboard for output
- Deploy to Vercel

**Future Enhancements (📦 Post-MVP)**:
- Real CMS API integration
- File upload interface
- Before/after preview
- MongoDB processing history
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

**Current Phase**: Phase 2 MVP Development - Week 1 (Day 1 Complete)

### Week 1 Tasks (Core Processing)
- [x] **Day 1: Valu API Authentication** ✅ COMPLETE
  - Iframe-only access enforcement
  - Admin permission verification
  - Cookie-based caching
  - Health monitoring
  - Development test harness
- [ ] Day 2-3: HTML input component & Cheerio parser
- [ ] Day 4: Resource extraction & URL replacement
- [ ] Day 5: CMS stub functions

### Week 2 Tasks (UI & Deployment)
- [ ] Day 6-7: Basic UI with status & output
- [ ] Day 8-9: Integration testing & edge cases
- [ ] Day 10: Deploy to Vercel

### Infrastructure Complete
- ✅ Next.js 15 with App Router configured
- ✅ TypeScript with strict mode enabled
- ✅ Tailwind CSS with Hebrew/RTL support
- ✅ Jest testing framework configured
- ✅ ESLint and Prettier configured
- ✅ Git hooks with Husky and lint-staged
- ✅ Complete directory structure created
- ✅ Sample newsletter for testing
- ✅ **Valu API authentication system (12 files, 1,356 lines)**

## Development Workflow

This project uses a structured, self-documenting workflow with Claude Code. See [Claude Code Workflow Guide](docs/CLAUDE-CODE-WORKFLOW.md) for details.

### Key Commands
- `/session-start [name]` - Begin new development session
- `/session-update` - Document progress
- `/session-end` - Complete session with summary
- `/save` - Create conventional commit

---

**License**: Proprietary - Internal use only