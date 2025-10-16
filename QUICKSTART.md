ב״ה
# Quick Start Guide

Get the Living with the Rebbe admin tool running in 5 minutes (once implemented).

**Note**: This guide describes the intended workflow. The application code is not yet implemented.

## Before You Start - Implementation Required

The following components need to be implemented:
1. Next.js application structure (`/app` directory)
2. React components (`/components`)
3. API routes (`/app/api`)
4. MongoDB models (`/models`)
5. Scraping logic (`/lib/scraper`)
6. Mock API server (`/mock-api`)
7. Configuration files (tsconfig.json, next.config.js, etc.)

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally (or Atlas account)
- Git installed

## 5-Minute Setup

### 1. Clone and Install (1 minute)
```bash
git clone [repository-url]
cd living-with-the-rebbe
npm install
```

### 2. Start MongoDB (1 minute)
```bash
# If using local MongoDB
mongod --dbpath ~/data/db

# Or use Docker
docker run -d -p 27017:27017 mongo:latest
```

### 3. Configure Environment (1 minute)
```bash
# Create env file
cat > .env.local << EOF
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
MOCK_API_PORT=3001
EOF
```

### 4. Start Mock API (1 minute)
```bash
# In terminal 1
npm run mock-api
# Mock API running at http://localhost:3001
```

### 5. Start Development Server (1 minute)
```bash
# In terminal 2
npm run dev
# App running at http://localhost:3000
```

## Verify Everything Works

### Test Scraping
1. Open http://localhost:3000/admin
2. Click "Fetch Recent Newsletters"
3. Should see 3 newsletters appear

### Test Processing
1. Click "Process" on any newsletter
2. Check MongoDB for saved data:
```bash
mongosh
use living-with-rebbe
db.newsletters.find().pretty()
```

### Test Mock API
```bash
# Test media upload endpoint
curl -X POST http://localhost:3001/api/v1/cms/media \
  -H "Content-Type: application/json" \
  -d '{"url": "test.jpg"}'

# Should return mock response
```

## Common Issues

### MongoDB Connection Failed
```bash
# Check MongoDB is running
ps aux | grep mongod

# If not, start it
mongod --dbpath ~/data/db
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Project Structure
```
├── app/
│   ├── admin/          # Admin dashboard
│   ├── api/           # API routes
│   └── lib/           # Core logic
├── components/        # UI components
├── models/           # MongoDB schemas
├── mock-api/         # Mock CMS API
└── public/          # Static assets
```

## Next Steps

1. **Explore Admin UI**: http://localhost:3000/admin
2. **Check Mock API**: http://localhost:3001
3. **View Logs**: Check terminal for processing details
4. **Modify Code**: Changes auto-reload

## Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run mock-api    # Start mock API server
npm test           # Run tests
npm run lint       # Check code quality
```

## Testing in ChabadUniverse Iframe

1. Get access to Valu Social Dev Tool
2. Configure localhost:3000 as allowed origin
3. Open ChabadUniverse
4. Navigate to admin tool location
5. Your local app loads in production iframe context

## Need Help?

- Check [MVP_SCOPE.md](./MVP_SCOPE.md) for feature details
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Review [DECISIONS.md](./DECISIONS.md) for resolved questions

---

**Ready!** You should now have the app running locally with mock API. 🚀