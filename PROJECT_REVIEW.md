ב׳׳ה
# PROJECT REVIEW - Living with the Rebbe

**Date**: November 24, 2025
**Status**: Phase 2 MVP Development Starting

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

### In Progress 🚀
- Starting Phase 2 MVP implementation
- Creating HTML processing components
- Building stub CMS functions

### Blocked/Waiting ⏸️
- Real CMS API endpoints (using stubs instead)
- Valu API documentation (minimal integration for MVP)

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

### Immediate (This Week)
1. Create HTML input component
2. Implement Cheerio parser
3. Build URL replacement logic
4. Create CMS stub functions

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