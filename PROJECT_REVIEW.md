ב׳׳ה
# PROJECT REVIEW - Living with the Rebbe

**Date**: November 25, 2025
**Status**: Phase 2 MVP Complete (Days 1-3) - HTML Input & Parser with 181 Passing Tests

## Executive Summary

The Living with the Rebbe project is pivoting to focus on delivering a Phase 2 MVP within 1-2 weeks. This represents a strategic shift from the original broad scope to a focused, achievable deliverable that provides immediate value.

## Phase 2: API Integration for Living with the Rebbe CMS

### Overview

Implement API integration layer and micro application to enable seamless processing of newsletter content for ChabadUniverse CMS, with granular access controls and automated URL generation capabilities.

### Background

Following the successful Phase 1 proof of concept (CV-4) which established content posting to the ChabadUniverse CMS, Phase 2 will build the core infrastructure needed for production-ready newsletter management within ChabadUniverse.

**Sample Issue Reference**: https://living-with-the-rebbe.vercel.app/samples/5785/yom_kippur.html

### Objectives

1. Create robust API endpoints for file management and access control
2. Implement flexible permission system with multiple access levels
3. Develop admin tool for newsletter content processing and HTML revision
4. Enable automatic URL generation and HTML content updates

## Scope

### Server-Side Development

#### API Endpoints for File Operations
- Upload, retrieve, and manage CMS files
- Return accessible URLs in API responses
- Handle file metadata and relationships

#### Access Control Endpoint
- Authenticate users and validate permissions
- Manage channel membership verification
- Return appropriate access level responses

### File Access Management

#### File Permission Configuration
Files uploaded through the API can be configured with three permission levels:

1. **Public**: No authentication required - accessible to anyone
2. **Private**: Authentication required - accessible to logged-in users only
3. **Permissioned**: Authentication + channel membership required - accessible only to members of specified channels

Each file's permission level is set during upload, along with optional channel associations. Files can be connected to multiple channels, and permissions can be modified after upload.

#### 302 Redirect Hierarchy
When users request a file through our API endpoint, they receive different redirect destinations based on their authentication status and permissions:

- **Unauthenticated users**: Redirected to a direct file URL (public files only)
- **Authenticated non-members**: Redirected to the CMS view, displaying the file maximized inside a directory/file tree interface
- **Authenticated channel members**: Redirected to the channel view, displaying the file maximized inside a discussion forum post

This ensures users always see content in the appropriate context while maintaining access control. The API endpoint acts as a gatekeeper, preventing external sites from directly hotlinking our content.

#### Expiration Settings
To maintain control over distributed content, files can be configured with:

- **Perpetual access**: No expiration (default)
- **Complete expiration**: After a set time, public access ends (404 response), while authenticated users retain access
- **Time-limited URLs**: The API continuously generates fresh temporary URLs that expire after a set duration, preventing unauthorized hosting while maintaining legitimate access

This protects our content from being permanently embedded in external sites or emails without our ongoing control.

### Micro Application Development

#### Content Processing Tool
- Provide interface for manual newsletter submission and processing
- Parse HTML to identify external resources
- Fetch supporting files (linked content)
- Upload supporting files with appropriate permissions
- Generate public/private URLs based on access settings
- Update HTML with new ChabadUniverse URLs
- Maintain content integrity and formatting

## Technical Requirements

- RESTful API design principles
- ChabadUniverse authentication mechanism integration
- Scalable file storage architecture
- HTML parsing and URL replacement engine
- Admin UI with streamlined content processing workflow

## Success Criteria

- Supporting files successfully uploaded and accessible via CMS URLs
- Access controls properly enforced based on configured permissions
- HTML content displays correctly with updated ChabadUniverse URLs
- Admin can process individual newsletters through the tool interface
- URL generation respects access level configurations

## Dependencies

- Phase 1 completion (CV-4) ✅
- Valu team API infrastructure availability (pending)
- ChabadUniverse micro app to facilitate email HTML processing

## Out of Scope (On Hold)

- Batch processing and archive imports
- Automated publishing workflows
- Version history management
- Newsletter Issue to Discussion Forum Post support
- Draft/published state support

## Implementation Approach

### MVP Strategy (1-2 Week Sprint)

Given the CMS API is not yet available, we're adopting a stub-first approach:

1. **Week 1**: Build core HTML processing with stub CMS functions
2. **Week 2**: Add UI polish and deploy to Vercel
3. **Post-MVP**: Swap stubs for real API when available

### Key Deliverables

1. HTML input interface (textarea for paste)
2. Cheerio-based resource parser
3. URL replacement engine
4. CMS stub functions (mock uploads)
5. Basic admin UI with copy-to-clipboard
6. Deployed to Vercel

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Parsing**: Cheerio for HTML processing
- **Styling**: Tailwind CSS with Radix UI
- **Deployment**: Vercel
- **Future**: MongoDB for history, Valu API for auth

## Current Status

### Completed ✅
- Project infrastructure setup
- Next.js 15 with App Router
- TypeScript configuration
- Development environment
- Sample newsletter for testing
- Documentation aligned with new scope
- **Phase 2 MVP Day 1: Valu API Authentication** ✅ COMPLETE
  - Iframe-only access enforcement (ValuFrameGuard)
  - Admin permission verification
  - Cookie-based user caching (24-hour duration)
  - Health monitoring with adaptive intervals
  - Multiple fallback methods for user fetching
  - Development test harness
  - ChabadUniverse user format compatibility
  - postRunResult bug fix applied
  - 12 files created, 1,356 lines of code
  - Production ready (TypeScript builds successfully)

### Next Steps 🚀
- Phase 3: Resource Processing
- Next: Resource downloader with parallel processing
- Next: CMS upload integration (stub functions first)
- Next: URL replacement engine
- Next: Enhanced output viewer with before/after comparison

### Recently Completed (November 24-25, 2025)
- ✅ **Days 2-3: HTML Input and Parser Implementation** (COMPLETE)
  - Admin dashboard with tabbed interface: Resources, HTML Preview, Statistics (`/app/admin/page.tsx`)
  - Dual-mode HTML input component (`/components/admin/HtmlInput.tsx`)
    - URL fetch mode (DEFAULT): Fetches HTML from S3/web URLs with automatic relative URL resolution
    - Paste mode (fallback): Manual HTML paste with base URL field
  - URL input component (`/components/admin/UrlInput.tsx`)
  - Server-side URL fetcher (`/lib/fetcher/url-fetcher.ts`) avoiding CORS issues
  - Cheerio-based parser extracting ONLY linked documents from <a> tags (PDFs, Word docs)
  - Resource identifier supporting 21 file formats
  - Preview components with filtering and statistics (ParseResults, ResourcePreview, HtmlPreview)
  - API endpoints: `/api/parse` and `/api/fetch-html` with rate limiting
  - 181 comprehensive tests - all passing across 7 test suites
  - Full documentation in `/lib/parser/README.md` and `/lib/fetcher/README.md`
  - 30+ files created, ~3,000+ lines of code

### Blocked/Waiting ⏸️
- Real CMS API endpoints (using stubs instead - not blocking)
- Valu API documentation (authentication complete, no longer blocking)

## Risks & Mitigations

### Technical Risks
- **CMS API Availability**: Mitigated by stub-first approach
- **HTML Format Variations**: Testing with multiple samples
- **Performance**: Optimizing Cheerio parsing

### Schedule Risks
- **1-2 Week Timeline**: Strictly enforcing MVP scope
- **Integration Dependencies**: Eliminated via stubs
- **Testing Time**: Allocated days 8-9 for testing

## Next Steps

### Phase 2 Complete ✅
1. ✅ Create dual-mode HTML input component (URL fetch + paste)
2. ✅ Implement server-side URL fetcher
3. ✅ Implement Cheerio parser (linked documents only from <a> tags)
4. ✅ Build admin dashboard with tabbed interface
5. ✅ Create preview components with filtering and statistics
6. ✅ Add comprehensive test coverage (181 tests)

### Phase 3 Next ⏳
1. ⏳ Implement resource downloader with parallel processing
2. ⏳ Create CMS upload integration (stub functions first)
3. ⏳ Build URL replacement engine
4. ⏳ Add enhanced output viewer

### Next Week
1. Add UI components
2. Integration testing
3. Deploy to Vercel
4. Document migration path

### Post-MVP
1. Integrate real CMS API when available
2. Add MongoDB for processing history
3. Implement full authentication
4. Add before/after preview
5. Enable batch processing

## Decision Log

### November 25, 2025
- **Decision**: URL fetch is the DEFAULT mode, paste mode is fallback
- **Rationale**: Most newsletters come from S3 URLs; automatic relative URL resolution is more convenient
- **Impact**: Better UX, automatic handling of relative URLs, paste mode available when needed

### November 24-25, 2025
- **Decision**: Parser extracts ONLY linked documents from `<a>` tags, NOT inline images
- **Rationale**: Inline images are part of email visual content; only downloadable resources need CMS hosting
- **Impact**: Clearer scope, prevents unnecessary resource uploads, aligns with actual use case

- **Decision**: Server-side URL fetching to avoid CORS issues
- **Rationale**: Client-side fetching blocked by CORS policies on S3/external URLs
- **Impact**: Reliable URL fetching, automatic relative URL resolution, rate limiting protection

### November 24, 2025
- **Decision**: Pivot to Phase 2 MVP with 1-2 week timeline
- **Rationale**: Deliver immediate value while waiting for dependencies
- **Impact**: Simplified scope, stub-first approach

### Previous Decisions
- Moved from scraping historical newsletters to real-time HTML processing
- Chose Next.js 15 App Router over Pages Router
- Selected Cheerio for HTML parsing over alternatives

## Resources

- **Sample Newsletter**: `/public/samples/5785/yom_kippur.html`
- **Implementation Plan**: `PHASE2_MVP.md`
- **Technical Guide**: `CLAUDE.md`
- **Architecture**: `ARCHITECTURE.md` (needs updating)

## Contact & Support

- **Project Lead**: [TBD]
- **Technical Questions**: See `CLAUDE.md`
- **Deployment**: See `DEPLOYMENT.md`

---

*This document represents the current state of the Living with the Rebbe project as of November 24, 2025, focusing on the Phase 2 MVP implementation.*