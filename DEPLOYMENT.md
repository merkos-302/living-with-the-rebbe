ב״ה
# Deployment Guide

Production deployment guide for Vercel and MongoDB Atlas.

## Prerequisites

- GitHub repository
- Vercel account (free tier works)
- MongoDB Atlas account (free tier works)
- Domain configured in ChabadUniverse for iframe

## Step 1: MongoDB Atlas Setup

### Create Cluster
1. Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free M0 cluster
3. Choose region closest to users
4. Name: `living-with-rebbe-prod`

### Configure Access
```bash
# Database User
Username: rebbe-admin
Password: [generate secure password]
Privileges: Read/Write to living-with-rebbe

# Network Access
Add IP: 0.0.0.0/0 (allows Vercel access)
```

### Get Connection String
```
mongodb+srv://rebbe-admin:PASSWORD@cluster.mongodb.net/living-with-rebbe?retryWrites=true&w=majority
```

## Step 2: Vercel Deployment

### Connect Repository
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

### Configure Environment
```bash
# Add production variables
vercel env add MONGODB_URI production
vercel env add ARCHIVE_BASE_URL production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add NEXT_PUBLIC_CHABAD_UNIVERSE_URL production

# When API available, add:
vercel env add CHABAD_UNIVERSE_API_KEY production
vercel env add CHABAD_UNIVERSE_CHANNEL_ID production
```

### Deploy
```bash
# Production deployment
vercel --prod

# Get deployment URL
https://living-with-rebbe.vercel.app
```

## Step 3: Configure for Iframe

### Vercel Settings
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors https://chabaduniverse.com https://*.valu.social"
        },
        {
          "key": "X-Frame-Options",
          "value": "ALLOW-FROM https://chabaduniverse.com"
        }
      ]
    }
  ]
}
```

### Test Iframe Access
```javascript
// In ChabadUniverse admin panel
<iframe
  src="https://living-with-rebbe.vercel.app"
  width="100%"
  height="800"
  frameborder="0"
/>
```

## Step 4: Email Configuration

### Gmail (Easy Setup)
1. Enable 2FA on Google account
2. Generate app password
3. Use in environment:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-specific-password
```

### SendGrid (Production)
1. Sign up at sendgrid.com
2. Verify sender domain
3. Get API key
4. Configure:
```env
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM=noreply@yourdomain.com
```

## Step 5: Weekly Automation

### Vercel Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly",
      "schedule": "0 10 * * 1"
    }
  ]
}
```

### Manual Trigger
```bash
# Test cron endpoint
curl https://living-with-rebbe.vercel.app/api/cron/weekly \
  -H "Authorization: Bearer CRON_SECRET"
```

## Monitoring

### Vercel Dashboard
- View deployments
- Check function logs
- Monitor performance
- Set up alerts

### MongoDB Atlas
- View collections
- Monitor queries
- Check indexes
- Set up alerts

### Email Logs
Check Vercel logs for email status:
```bash
vercel logs --follow
```

## Troubleshooting

### Iframe Not Loading
```bash
# Check CSP headers
curl -I https://your-app.vercel.app

# Verify frame-ancestors includes ChabadUniverse
```

### MongoDB Connection Failed
```bash
# Test connection string
mongosh "mongodb+srv://..." --eval "db.version()"

# Check network access in Atlas
```

### Email Not Sending
```bash
# Check logs
vercel logs | grep email

# Verify SMTP settings
npm run test:email
```

## Production Checklist

- [ ] MongoDB Atlas configured
- [ ] Vercel environment variables set
- [ ] CSP headers configured
- [ ] Email service configured
- [ ] Iframe tested in ChabadUniverse
- [ ] Weekly cron job scheduled
- [ ] Error monitoring enabled
- [ ] Backup strategy defined

## Rollback Procedure

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]

# Or instant rollback in dashboard
```

## Support

- Vercel Status: [status.vercel.com](https://status.vercel.com)
- MongoDB Atlas Status: [status.cloud.mongodb.com](https://status.cloud.mongodb.com)
- Application Logs: Vercel Dashboard → Functions → Logs

---

**Deployment Time**: ~15 minutes
**Cost**: Free tier sufficient for MVP