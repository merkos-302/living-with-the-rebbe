ב׳׳ה
# Deployment Guide

## Overview

Complete deployment guide for the Living with the Rebbe admin tool, covering Vercel deployment, MongoDB Atlas setup, iframe integration, and production configuration.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#mongodb-atlas-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Iframe Integration](#iframe-integration)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Security Configuration](#security-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Rollback Procedures](#rollback-procedures)
10. [Production Checklist](#production-checklist)

## Prerequisites

### Required Accounts
- [ ] Vercel account (Pro recommended for team features)
- [ ] MongoDB Atlas account
- [ ] GitHub repository access
- [ ] ChabadUniverse admin credentials
- [ ] AWS account (for CloudWatch logs)

### Required Tools
```bash
# Install Vercel CLI
npm install -g vercel

# Install MongoDB tools
brew install mongodb-database-tools

# Verify installations
vercel --version
mongodump --version
```

## MongoDB Atlas Setup

### 1. Create Cluster
```bash
# MongoDB Atlas Configuration
Cluster Tier: M10 (minimum for production)
Region: us-east-1 (same as Vercel)
MongoDB Version: 6.0
Backup: Enabled
```

### 2. Database User Creation
```javascript
// Create application user
db.createUser({
  user: "living-rebbe-app",
  pwd: "GENERATE_SECURE_PASSWORD",
  roles: [
    { role: "readWrite", db: "living-with-rebbe" }
  ]
});
```

### 3. Network Access
```yaml
IP Whitelist:
  - Vercel IP ranges (dynamic)
  - Use Atlas PrivateLink for production
  - Or allow 0.0.0.0/0 with strong auth
```

### 4. Connection String
```bash
# Production connection string format
mongodb+srv://living-rebbe-app:PASSWORD@cluster.mongodb.net/living-with-rebbe?retryWrites=true&w=majority
```

### 5. Database Indexes
```javascript
// Run after first deployment
use living-with-rebbe;

// Newsletter indexes
db.newsletters.createIndex({ slug: 1 }, { unique: true });
db.newsletters.createIndex({ status: 1 });
db.newsletters.createIndex({ year: 1, parsha: 1 });
db.newsletters.createIndex({ createdAt: -1 });

// Session indexes
db.processingsessions.createIndex({ sessionId: 1 }, { unique: true });
db.processingsessions.createIndex({ status: 1 });
db.processingsessions.createIndex({ createdAt: -1 });
```

## Vercel Deployment

### 1. Initial Setup
```bash
# Link repository to Vercel
vercel link

# Configure project
vercel init

# Select options:
? What's your project's name? living-with-rebbe
? In which directory is your code located? ./
? Which framework? Next.js
? Override build settings? No
```

### 2. Environment Variables
```bash
# Set production environment variables
vercel env add MONGODB_URI production
vercel env add CHABAD_UNIVERSE_API_KEY production
vercel env add CHABAD_UNIVERSE_CHANNEL_ID production
vercel env add ARCHIVE_BASE_URL production
vercel env add NEXT_PUBLIC_CHABAD_UNIVERSE_URL production

# Set staging environment variables
vercel env add MONGODB_URI preview
vercel env add CHABAD_UNIVERSE_API_KEY preview
vercel env add CHABAD_UNIVERSE_CHANNEL_ID preview
# Use test channel for staging
```

### 3. Build Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "ALLOWALL"
        },
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors https://chabaduniverse.com https://*.valu.social;"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 4. Deployment Commands
```bash
# Deploy to production
vercel --prod

# Deploy to staging (preview)
vercel

# Deploy specific branch
vercel --force

# View deployment logs
vercel logs living-with-rebbe.vercel.app
```

## Environment Configuration

### Development (.env.local)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/living-with-rebbe-dev

# ChabadUniverse API (development)
CHABAD_UNIVERSE_API_KEY=dev_key_local_testing_only
CHABAD_UNIVERSE_CHANNEL_ID=channel_dev
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=http://localhost:3001

# Archive
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com

# Debug
DEBUG=true
LOG_LEVEL=debug
```

### Staging (.env.staging)
```env
# Database
MONGODB_URI=mongodb+srv://staging-user:PASSWORD@staging-cluster.mongodb.net/living-with-rebbe-staging?retryWrites=true

# ChabadUniverse API (staging)
CHABAD_UNIVERSE_API_KEY=staging_key_abcd1234
CHABAD_UNIVERSE_CHANNEL_ID=channel_test
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://staging.chabaduniverse.com

# Archive
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com

# Debug
DEBUG=false
LOG_LEVEL=info
```

### Production (.env.production)
```env
# Database
MONGODB_URI=mongodb+srv://prod-user:SECURE_PASSWORD@prod-cluster.mongodb.net/living-with-rebbe?retryWrites=true&w=majority

# ChabadUniverse API (production)
CHABAD_UNIVERSE_API_KEY=prod_key_xyz789_secure
CHABAD_UNIVERSE_CHANNEL_ID=channel_main
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com

# Archive
ARCHIVE_BASE_URL=https://merkos-living.s3.us-west-2.amazonaws.com

# Monitoring
SENTRY_DSN=https://abc123@sentry.io/project
NEW_RELIC_LICENSE_KEY=nrlic_xyz123

# Debug
DEBUG=false
LOG_LEVEL=warn
```

## Iframe Integration

### 1. ChabadUniverse Configuration
```javascript
// Configuration on ChabadUniverse side
{
  "apps": {
    "living-with-rebbe": {
      "name": "Living with the Rebbe",
      "url": "https://living-with-rebbe.vercel.app",
      "icon": "/icons/living-rebbe.svg",
      "permissions": ["channel_admin"],
      "iframe": {
        "width": "100%",
        "height": "100vh",
        "sandbox": "allow-same-origin allow-scripts allow-forms allow-popups"
      }
    }
  }
}
```

### 2. CSP Headers
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://chabaduniverse.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              frame-ancestors https://chabaduniverse.com https://*.valu.social;
              connect-src 'self' https://api.chabaduniverse.com https://merkos-living.s3.us-west-2.amazonaws.com;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ]
  }
}
```

### 3. Valu API Integration
```typescript
// pages/_app.tsx
import { ValuApiProvider } from '@arkeytyp/valu-api';

function MyApp({ Component, pageProps }) {
  return (
    <ValuApiProvider
      config={{
        parentOrigin: process.env.NEXT_PUBLIC_CHABAD_UNIVERSE_URL,
        debug: process.env.DEBUG === 'true',
        healthCheck: true,
        healthCheckInterval: 30000,
      }}
    >
      <Component {...pageProps} />
    </ValuApiProvider>
  );
}
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - main
      - staging

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          MONGODB_URI: ${{ secrets.TEST_MONGODB_URI }}

      - name: Build application
        run: npm run build

      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
            vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
            vercel deploy --prod --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
          else
            vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
            vercel build --token=${{ secrets.VERCEL_TOKEN }}
            vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
          fi

      - name: Run E2E tests
        run: |
          npx wait-on ${{ steps.deploy.outputs.url }}
          npm run test:e2e
        env:
          CYPRESS_BASE_URL: ${{ steps.deploy.outputs.url }}
```

### Deployment Hooks
```javascript
// scripts/post-deploy.js
const axios = require('axios');

async function postDeploy() {
  // Verify deployment
  const healthCheck = await axios.get(`${process.env.DEPLOYMENT_URL}/api/health`);

  if (healthCheck.data.status !== 'ok') {
    throw new Error('Health check failed');
  }

  // Warm up functions
  await Promise.all([
    axios.get(`${process.env.DEPLOYMENT_URL}/api/scrape/warmup`),
    axios.get(`${process.env.DEPLOYMENT_URL}/api/cms/warmup`),
  ]);

  // Notify monitoring
  await axios.post('https://api.newrelic.com/deployments', {
    deployment: {
      revision: process.env.VERCEL_GIT_COMMIT_SHA,
      user: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME,
    }
  });
}

postDeploy().catch(console.error);
```

## Security Configuration

### 1. API Key Rotation
```bash
# Rotate API keys quarterly
# Store in Vercel environment variables
vercel env rm CHABAD_UNIVERSE_API_KEY production
vercel env add CHABAD_UNIVERSE_API_KEY production

# Update in MongoDB Atlas
# Update in monitoring services
```

### 2. Security Headers
```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'ALLOWALL'); // Required for iframe
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}
```

### 3. Rate Limiting
```typescript
// lib/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  skipSuccessfulRequests: false,
});
```

## Monitoring & Logging

### 1. Application Monitoring
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';
import { Logger } from 'winston';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Scrub sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
    }
    return event;
  },
});

// Winston logger configuration
export const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
  ],
});
```

### 2. Health Checks
```typescript
// pages/api/health.ts
export default async function handler(req, res) {
  const checks = {
    database: 'unknown',
    cms: 'unknown',
    archive: 'unknown',
  };

  try {
    // Check MongoDB
    await mongoose.connection.db.admin().ping();
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
  }

  try {
    // Check CMS API
    const response = await fetch(`${process.env.CMS_URL}/health`);
    checks.cms = response.ok ? 'ok' : 'error';
  } catch {
    checks.cms = 'error';
  }

  try {
    // Check Archive access
    const response = await fetch(`${process.env.ARCHIVE_BASE_URL}/test.html`);
    checks.archive = response.ok ? 'ok' : 'error';
  } catch {
    checks.archive = 'error';
  }

  const allOk = Object.values(checks).every(status => status === 'ok');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
}
```

### 3. Metrics Dashboard
```javascript
// monitoring/dashboard.js
const metrics = {
  // Track processing metrics
  newslettersProcessed: new Counter({
    name: 'newsletters_processed_total',
    help: 'Total newsletters processed',
    labelNames: ['status'],
  }),

  // Track media uploads
  mediaUploads: new Counter({
    name: 'media_uploads_total',
    help: 'Total media uploads',
    labelNames: ['type', 'status'],
  }),

  // Track API latency
  apiDuration: new Histogram({
    name: 'api_duration_seconds',
    help: 'API request duration',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
  }),
};
```

## Rollback Procedures

### 1. Automatic Rollback
```yaml
# vercel.json
{
  "github": {
    "autoRollback": true,
    "deploymentProtection": {
      "rules": [
        {
          "type": "http_check",
          "url": "/api/health",
          "expectedStatus": 200
        }
      ]
    }
  }
}
```

### 2. Manual Rollback
```bash
# List recent deployments
vercel ls living-with-rebbe

# Rollback to specific deployment
vercel alias set living-with-rebbe-abc123.vercel.app living-with-rebbe.vercel.app

# Or use Vercel dashboard
# Navigate to project > Deployments > Select deployment > Promote to Production
```

### 3. Database Rollback
```bash
# Backup before deployment
mongodump --uri="$MONGODB_URI" --out=backup-$(date +%Y%m%d)

# Restore if needed
mongorestore --uri="$MONGODB_URI" --drop backup-20240101/
```

## Production Checklist

### Pre-deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Database migrations prepared
- [ ] API keys rotated if needed
- [ ] Backup created

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Verify iframe integration
- [ ] Check all environment variables
- [ ] Monitor error rates
- [ ] Verify database connections

### Post-deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] First newsletter processed successfully
- [ ] Performance metrics normal

### Emergency Contacts
```yaml
On-Call Rotation:
  Primary: engineering@chabaduniverse.com
  Secondary: devops@chabaduniverse.com

Escalation:
  Level 1: Team Lead
  Level 2: Engineering Manager
  Level 3: CTO

External Dependencies:
  Vercel Support: support@vercel.com
  MongoDB Atlas: support@mongodb.com
  AWS Support: [Support Center]
```

## Troubleshooting

### Common Issues

**504 Gateway Timeout**
```bash
# Increase function timeout in vercel.json
"functions": {
  "pages/api/scrape/*.ts": {
    "maxDuration": 60
  }
}
```

**MongoDB Connection Issues**
```javascript
// Add connection pooling
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
};
```

**CORS Errors in Iframe**
```javascript
// Verify CSP headers
// Check parent origin configuration
// Ensure cookies have correct SameSite attribute
```

**Memory Issues**
```javascript
// Increase memory limit
"functions": {
  "pages/api/process/*.ts": {
    "memory": 3008
  }
}
```

## Maintenance

### Regular Tasks
- **Weekly**: Review error logs and metrics
- **Monthly**: Update dependencies
- **Quarterly**: Rotate API keys
- **Annually**: Review architecture and scaling

### Scaling Considerations
```yaml
When to Scale:
  - Processing time > 5 min per newsletter
  - Memory usage > 80%
  - Database connections > 80% of pool
  - API rate limits frequently hit

Scaling Options:
  - Upgrade Vercel plan (more concurrent functions)
  - Increase MongoDB cluster tier
  - Implement queue system (Redis/SQS)
  - Add CDN for static assets
```

---

**Note**: This deployment guide should be reviewed with the DevOps team and updated based on actual infrastructure requirements and security policies.