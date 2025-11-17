ב׳׳ה
# Living with the Rebbe - Newsletter Resource Processor

Administrative tool for ChabadUniverse that processes newsletter HTML to centralize resources on the CMS platform.

## Overview

**Purpose**: Process newsletter HTML before distribution by uploading all linked resources to ChabadUniverse CMS
**Environment**: Runs as iframe within ChabadUniverse only
**Status**: Foundation Complete - Ready for implementation

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

## Core Features

**Foundation (Complete)**:
- ✅ Next.js 15 with App Router configured
- ✅ TypeScript with strict mode
- ✅ Tailwind CSS with Hebrew/RTL support
- ✅ Cheerio for HTML parsing
- ✅ ESLint and Prettier configured
- ✅ Complete directory structure

**To Implement**:
- 📋 HTML input interface (paste/upload)
- 📋 Resource extraction from HTML
- 📋 Parallel resource downloading
- 📋 CMS upload via Valu API
- 📋 URL replacement in HTML
- 📋 Preview before/after comparison
- 📋 Processing history tracking

## Installation

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

**Epic #2 Complete**: Foundation and project setup finished

### Completed
- ✅ Next.js 15 with App Router configured
- ✅ TypeScript with strict mode enabled
- ✅ Tailwind CSS with Hebrew/RTL support
- ✅ Jest testing framework configured
- ✅ ESLint and Prettier configured
- ✅ Git hooks with Husky and lint-staged
- ✅ Complete directory structure created
- ✅ Type definitions established
- ✅ Environment utilities created
- ✅ Comprehensive documentation

### Next Implementation Phases
- 📋 Phase 1: HTML Parser & Resource Extractor
- 📋 Phase 2: Resource Download & CMS Upload
- 📋 Phase 3: Admin UI Components
- 📋 Phase 4: Processing History
- 📋 Phase 5: Testing & Quality Assurance
- 📋 Phase 6: Production Deployment

## Development Workflow

This project uses a structured, self-documenting workflow with Claude Code. See [Claude Code Workflow Guide](docs/CLAUDE-CODE-WORKFLOW.md) for details.

### Key Commands
- `/session-start [name]` - Begin new development session
- `/session-update` - Document progress
- `/session-end` - Complete session with summary
- `/save` - Create conventional commit

---

**License**: Proprietary - Internal use only