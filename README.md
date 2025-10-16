ב׳׳ה
# Living with the Rebbe - Admin Tool

Administrative tool for ChabadUniverse to scrape and publish "Living with the Rebbe" newsletters.

## Overview

**MVP Scope**: Process 3 recent newsletters + weekly updates
**Environment**: Runs as iframe within ChabadUniverse only
**Status**: Foundation Complete - Epic #2 Finished (Project Setup)

## Quick Links

| Essential Docs | Description |
|----------------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | Get running in 5 minutes |
| [MVP_SCOPE.md](./MVP_SCOPE.md) | What we're building |
| [DECISIONS.md](./DECISIONS.md) | Resolved architectural decisions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design with diagrams |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |

## Core Features

**Foundation (Complete)**:
- ✅ Next.js 15 with App Router configured
- ✅ TypeScript with strict mode
- ✅ Tailwind CSS with Hebrew/RTL support
- ✅ Jest testing framework
- ✅ ESLint and Prettier configured
- ✅ Complete directory structure

**Planned Features**:
- 📋 Scrape 3 recent newsletters from S3 archive
- 📋 Weekly check for new newsletters
- 📋 Cache all media locally (we own all assets)
- 📋 Email notification to retzion@merkos302.com
- 📋 Export to JSON (until API available)
- 🔜 Auto-publish when ChabadUniverse API ready

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

## Project Configuration (Completed)

All configuration files are in place:
- ✅ `tsconfig.json` - TypeScript with strict mode
- ✅ `next.config.js` - Next.js 15 with iframe support
- ✅ `tailwind.config.js` - Tailwind with Hebrew fonts
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `jest.config.js` - Jest testing framework
- ✅ `.eslintrc.json` - ESLint with TypeScript
- ✅ `.prettierrc` - Code formatting rules

## Environment Variables

```env
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=your-api-key  # When available
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com
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
- **MongoDB/Mongoose 8.0.3** for state management
- **@arkeytyp/valu-api** for iframe authentication
- **Cheerio** for HTML parsing
- **Axios** for HTTP requests

### Development Tools
- **Jest 29.7.0** with React Testing Library
- **ESLint 8.56.0** with TypeScript support
- **Prettier 3.6.2** for code formatting
- **Husky 9.1.7** with lint-staged for pre-commit hooks

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

### Next Steps
- 📋 Epic #3: Database layer (MongoDB models)
- 📋 Epic #4: Authentication providers (Valu integration)
- 📋 Epic #5: Core scraping logic
- 📋 Epic #6: Admin UI components
- 📋 Epic #7: API routes
- 📋 Epic #8: Testing implementation

---

**License**: Proprietary - Internal use only
