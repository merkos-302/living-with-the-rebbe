ב׳׳ה
# Living with the Rebbe - Admin Tool

An administrative tool for ChabadUniverse channel administrators to scrape and publish "Living with the Rebbe" newsletters to community channels.

## Overview

This application runs exclusively as an iframe within ChabadUniverse and provides:
- **MVP Scope**: Scraping of 3 most recent newsletters + weekly updates going forward
- Media asset caching (all media owned, no authentication required)
- Email notifications to retzion@merkos302.com for new newsletters
- Export to JSON until ChabadUniverse API is available
- Automated posting to community channels when API is ready

## Access Requirements

- **Admin Authentication Required**: Must be authenticated as a ChabadUniverse channel administrator
- **Iframe Only**: This tool only functions within the ChabadUniverse platform
- **No Public Access**: All features require admin permissions

## Features

### MVP Features (Week 1)
- Fetch 3 most recent newsletters from S3 archives
- Weekly check for new newsletters (automated or manual)
- Parse HTML content while preserving exact formatting
- Download and cache all media locally (no auth required)
- Email notifications to retzion@merkos302.com
- Export to JSON for manual posting (until API ready)

### Future Features (When API Available)
- Automatic upload of media to ChabadUniverse CMS
- Direct posting to community channels
- Automatic URL rewriting to CMS locations
- Tags for organization (parsha, year)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (local or Atlas account)
- Admin API key for ChabadUniverse

### Installation

```bash
# Clone repository
git clone [repository-url]
cd living-with-the-rebbe

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=your-api-key
CHABAD_UNIVERSE_CHANNEL_ID=target-channel-id
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe
# For production, use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/living-with-rebbe
```

## Usage Workflow

1. **Login**: Authenticate through ChabadUniverse/Valu Social
2. **Select Year**: Choose which year's newsletters to process
3. **Scrape**: Fetch newsletter list from archive
4. **Preview**: Review newsletter content before publishing
5. **Publish**: Upload media and post to community channel

## API Integration

This tool integrates with ChabadUniverse APIs:
- **Authentication**: Via Valu API
- **Media Upload**: PUT to CMS endpoints
- **Channel Posting**: POST to community channel

## Tech Stack

- Next.js 15 with TypeScript (App Router)
- React 18
- MongoDB/Mongoose for state management
- @arkeytyp/valu-api for iframe integration
- Cheerio for HTML parsing
- Tailwind CSS for styling
- Vercel for deployment
- Nodemailer for email notifications
- Mock API for development (until real API available)

## Project Structure

```
├── pages/          # Next.js pages and API routes
├── components/     # React components
├── lib/           # Core business logic
├── models/        # Mongoose schemas
├── hooks/         # Custom React hooks
└── utils/         # Helper functions
```

## Deployment

The application is deployed on Vercel and configured to run as an iframe within ChabadUniverse.

```bash
# Deploy to Vercel
vercel deploy
```

## Support

For issues or questions, contact the ChabadUniverse development team.

---

## License

Proprietary - internal use only.
