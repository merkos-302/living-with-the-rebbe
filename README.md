ב׳׳ה
# Living with the Rebbe - Admin Tool

Administrative tool for ChabadUniverse to scrape and publish "Living with the Rebbe" newsletters.

## Overview

**MVP Scope**: Process 3 recent newsletters + weekly updates
**Environment**: Runs as iframe within ChabadUniverse only
**Status**: Ready for development with mock API

## Quick Links

| Essential Docs | Description |
|----------------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | Get running in 5 minutes |
| [MVP_SCOPE.md](./MVP_SCOPE.md) | What we're building |
| [DECISIONS.md](./DECISIONS.md) | Resolved architectural decisions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design with diagrams |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |

## Core Features

- ✅ Scrape 3 recent newsletters from S3 archive
- ✅ Weekly check for new newsletters
- ✅ Cache all media locally (we own all assets)
- ✅ Email notification to retzion@merkos302.com
- ✅ Export to JSON (until API available)
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
```

## Environment Variables

```env
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=your-api-key  # When available
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe
```

## Tech Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **MongoDB** for state management
- **@arkeytyp/valu-api** for iframe auth
- **Mock API** until real endpoints available

## Project Status

- ✅ Architecture defined
- ✅ Scope reduced to MVP (3 + weekly)
- ✅ Mock API approach ready
- 🔄 Awaiting ChabadUniverse API
- 📅 Development ready to start

---

**License**: Proprietary - Internal use only
