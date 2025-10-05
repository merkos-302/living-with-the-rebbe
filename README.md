ב׳׳ה
# Living with the Rebbe - Admin Tool

An administrative tool for ChabadUniverse channel administrators to scrape and publish "Living with the Rebbe" newsletters to community channels.

## Overview

This application runs exclusively as an iframe within ChabadUniverse and provides:
- Newsletter scraping from archived sources (~400 issues from years 5773-5785)
- Media asset upload to ChabadUniverse CMS
- Automated posting to community channels with appropriate tags

## Access Requirements

- **Admin Authentication Required**: Must be authenticated as a ChabadUniverse channel administrator
- **Iframe Only**: This tool only functions within the ChabadUniverse platform
- **No Public Access**: All features require admin permissions

## Features

### Scraping
- Fetches newsletters from S3 archives
- Parses HTML content while preserving original styling
- Extracts media assets (images, PDFs, audio files)

### Publishing
- Uploads media to ChabadUniverse CMS
- Rewrites media URLs to CMS locations
- Posts newsletters to community channels
- Adds tags (parsha, year) for organization

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

- Next.js 15 with TypeScript
- React 18
- MongoDB/Mongoose for state management
- @arkeytyp/valu-api for iframe integration
- Cheerio for HTML parsing
- Tailwind CSS for styling
- Vercel for deployment

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
