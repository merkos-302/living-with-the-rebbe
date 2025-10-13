ב״ה
# Architectural Decisions & Resolved Issues

This document records all finalized decisions and resolved issues for the Living with the Rebbe project.

## Core Scope Decision

### ✅ MVP Scope: 3 + Weekly (NOT 400)
- **Decision**: Process only 3 most recent newsletters initially, then weekly updates
- **Rationale**: Dramatically reduces complexity and allows immediate development
- **Impact**: Changes from massive migration to simple publishing tool

## Technical Stack Decisions

### ✅ Framework: Next.js App Router
- **Decision**: Use Next.js 15 with App Router (not Pages Router)
- **Confirmed**: Modern approach with better TypeScript support

### ✅ Database: MongoDB with Mongoose
- **Decision**: Use MongoDB for state management
- **Purpose**:
  - Track processed newsletters
  - Prevent duplicates
  - Store media mappings
  - Enable recovery from failures

### ✅ Authentication: Valu API
- **Decision**: Use @arkeytyp/valu-api for iframe authentication
- **Method**: OAuth-style through parent window
- **API Key**: Static key stored in environment variables

## API Strategy

### ✅ Mock API Approach
- **Decision**: Build complete system with mock API
- **Implementation**: JSON Server mimicking expected endpoints
- **Transition**: Swap to real API when available (no ETA)
- **Export**: JSON export for manual posting until API ready

## Media Handling

### ✅ Media Ownership: We Own All Media
- **Decision**: All media is owned, no authentication required
- **Implementation**:
  - Direct download from S3
  - Local caching with hash-based deduplication
  - No Google Docs authentication issues

## Development & Testing

### ✅ Valu Social Dev Tool
- **Decision**: Use Valu Social's iframe development tool
- **Benefits**:
  - Test localhost in production iframe context
  - Real authentication flow
  - No mocking required

## Content Requirements

### ✅ HTML Preservation: Exact Replica
- **Decision**: Preserve exact HTML styling from newsletters
- **Implementation**: Download and serve as-is, only rewrite media URLs

### ✅ Duplicate Prevention
- **Decision**: Each newsletter posted once, no updates
- **Implementation**: MongoDB unique index on slug field

## Notification System

### ✅ Email Notifications
- **Recipient**: retzion@merkos302.com
- **Trigger**: When newsletter ready for publishing
- **Content**: Newsletter details and status

## Performance Requirements

### ✅ Processing Time (Simplified)
- **3 newsletters**: ~6 minutes total
- **Weekly newsletter**: ~2 minutes
- **Conclusion**: Performance no longer a concern with reduced scope

## Error Recovery

### ✅ Simple Recovery Strategy
- **Decision**: Basic retry with exponential backoff
- **Rationale**: With only 3 + weekly, can easily restart if failure
- **State**: MongoDB tracks processing status

## Deployment

### ✅ Hosting: Vercel
- **Database**: MongoDB Atlas for production
- **Environment**: Configured for iframe-only access

## Archive Structure

### ✅ S3 Archive URL Pattern
```
https://merkos-living.s3.us-west-2.amazonaws.com/Chazak/[year]/LivingWithTheRebbe.html
```

## Database Schema Decisions

### ✅ Newsletter Model
```typescript
{
  slug: unique identifier (year-parsha format)
  status: ['scraped', 'processing', 'ready_to_publish', 'published']
  mediaMapping: array of original→cached→cms URLs
  timestamps: automatic created/updated tracking
}
```

## URL Resolution

### ✅ Media URL Patterns
- Relative paths resolved against merkos302.com
- All media cached locally first
- CMS URLs replace originals when API available

## Questions No Longer Relevant

These concerns have been eliminated by scope reduction:
- ❌ Processing 400 newsletters (only 3 + weekly)
- ❌ Complex parallelization (sequential is fine)
- ❌ Large-scale error recovery (can restart easily)
- ❌ Performance optimization (2 minutes is acceptable)
- ❌ Stateless architecture (MongoDB added)
- ❌ Update mechanism (no duplicates, post once)

## Pending Decisions

### ⏳ API Availability
- **Status**: No ETA provided
- **Workaround**: Mock API + JSON export

### ⏳ Tag Format
- **Options**: Hebrew vs English, format TBD
- **Can decide**: During implementation

### ⏳ Channel Structure
- **Question**: Single channel or multiple?
- **Can decide**: When API available

---

**Last Updated**: Current
**Status**: All critical decisions made, ready for development