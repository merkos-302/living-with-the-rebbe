# Setup Instructions

This document provides step-by-step instructions for setting up the Living with the Rebbe development environment.

**Status**: Epic #2 Complete - Foundation is ready for development!

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- MongoDB (local or cloud instance)
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd living-with-the-rebbe
```

### 2. Install Dependencies

```bash
npm install
```

This installs 30+ packages including:
- Next.js 15.0.0 with App Router
- React 18.2.0
- TypeScript 5.3.3
- Tailwind CSS 3.4.0
- MongoDB/Mongoose 8.0.3
- Radix UI components
- Valu API SDK
- Jest testing framework
- ESLint and Prettier
- Husky and lint-staged

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure the following variables:

```env
# ChabadUniverse/Valu Social Configuration
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=your-api-key-here
CHABAD_UNIVERSE_CHANNEL_ID=your-channel-id-here

# Archive Configuration
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com

# Database
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe

# Email Configuration
EMAIL_NOTIFICATION_RECIPIENT=retzion@merkos302.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password

# Development
NODE_ENV=development
```

### 4. Set Up MongoDB (Optional for Now)

MongoDB will be needed once database models are implemented (Epic #3).

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify connection
mongosh
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env.local`

**For Now**: You can skip MongoDB setup and still run the dev server.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

You should see:
- "Living with the Rebbe - Admin Tool" heading
- Status message showing Epic #2 complete
- Clean styling with Hebrew font support

## Project Structure

```
living-with-the-rebbe/
├── app/                    # Next.js 15 App Router ✅
│   ├── layout.tsx         # Root layout with fonts ✅
│   ├── page.tsx           # Home page ✅
│   ├── globals.css        # Global styles ✅
│   ├── admin/             # Admin pages (to be created)
│   └── api/               # API routes (to be created)
├── components/            # React components ✅
│   ├── admin/            # Admin UI (to be created)
│   └── ui/               # Reusable UI (to be created)
├── lib/                  # Core libraries ✅
│   ├── scraper/         # Scraping logic (to be created)
│   ├── cms/             # CMS integration (to be created)
│   └── db/              # Database (to be created)
├── hooks/                # Custom hooks ✅
├── models/               # Mongoose schemas ✅
├── utils/                # Utilities ✅
│   ├── env.ts           # Environment vars ✅
│   └── logger.ts        # Logging ✅
├── types/                # TypeScript types ✅
│   └── index.ts         # Core types ✅
├── scripts/              # CLI scripts ✅
├── public/               # Static assets ✅
├── __tests__/            # Test files ✅
├── docs/                 # Documentation ✅
└── Configuration files ✅
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── jest.config.js
    ├── .eslintrc.json
    └── .prettierrc
```

## Development Workflow

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Format code
npm run format

# Check code formatting
npm run format:check
```

### Testing in Valu Social

To test the application within the ChabadUniverse/Valu Social iframe:

1. Start the development server: `npm run dev`
2. Open the Valu Social Dev Tool
3. Configure the iframe to point to `http://localhost:3000`
4. Test authentication and admin features

See `docs/valu-social-dev-tool.md` for detailed instructions.

## Next Implementation Steps

Epic #2 (Foundation) is complete. Choose your next epic:

### Epic #3: Database Layer (Recommended Next)
1. Create MongoDB connection utility (`lib/db/connection.ts`)
2. Implement Newsletter Mongoose model (`models/Newsletter.ts`)
3. Implement ProcessingSession model (`models/ProcessingSession.ts`)
4. Write unit tests for models

### Epic #4: Authentication & Providers
1. Create ValuApiProvider (`lib/providers/ValuApiProvider.tsx`)
2. Create AuthProvider (`lib/providers/AuthProvider.tsx`)
3. Create useValuAuth hook (`hooks/useValuAuth.ts`)
4. Integrate providers into root layout

### Epic #5: Core Scraping Logic
1. Implement archive scraper (`lib/scraper/archive.ts`)
2. Implement newsletter parser (`lib/scraper/newsletter.ts`)
3. Implement media extractor (`lib/scraper/media.ts`)
4. Write unit tests

### Future Epics
- Epic #6: Admin UI Components
- Epic #7: API Routes
- Epic #8: CMS Integration
- Epic #9: Email Notifications
- Epic #10: Testing & Quality
- Epic #11: Deployment

Refer to `PROJECT_STATUS.md` for detailed epic breakdowns.

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Use a different port
PORT=3001 npm run dev
```

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Restart MongoDB
brew services restart mongodb-community

# Check logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

### TypeScript Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Valu API Documentation](https://github.com/Roomful/valu-api)

## Support

For questions or issues, contact: retzion@merkos302.com
