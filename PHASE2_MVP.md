ב׳׳ה
# Phase 2 MVP Implementation Plan

## Executive Summary

**Goal**: Deliver a functional HTML processing tool for Living with the Rebbe newsletters within 1-2 weeks
**Approach**: Stub-first development with mock CMS API, replace when real API available
**Deliverable**: Admin tool that processes HTML and replaces resource URLs with CMS URLs

## Phase 2 MVP Scope

### In Scope ✅
- HTML input via textarea (paste)
- Parse HTML to extract external resources
- Replace resource URLs with CMS URLs (using stubs)
- Display processed HTML for copying
- Basic error handling
- Deploy to Vercel

### Out of Scope ❌
- MongoDB processing history
- Before/after visual preview
- Batch processing
- Full Valu authentication (stub admin access)
- Real CMS API integration (use stubs)
- File upload interface
- Analytics dashboard

## Technical Implementation

### 1. Core Components to Build

#### `/app/admin/page.tsx` - Admin Interface
```typescript
// Main admin page with:
- HTML input textarea
- Process button
- Status display
- Output textarea
- Copy-to-clipboard button
```

#### `/lib/parser/htmlParser.ts` - HTML Processing
```typescript
interface ParsedResource {
  originalUrl: string;
  type: 'pdf' | 'image' | 'document';
  filename: string;
}

// Functions:
- parseHTML(html: string): ParsedResource[]
- extractResources(cheerio$): ParsedResource[]
- validateResourceUrl(url: string): boolean
```

#### `/lib/cms/cmsStubs.ts` - Mock CMS API
```typescript
interface CMSUploadResponse {
  success: boolean;
  cmsUrl: string;
  resourceId: string;
}

// Stub function that simulates CMS upload:
- uploadToCMS(resource: ParsedResource): Promise<CMSUploadResponse>
- Returns: https://cms.chabaduniverse.com/api/resource/mock-{uuid}
```

#### `/lib/parser/urlReplacer.ts` - URL Replacement
```typescript
interface URLMapping {
  original: string;
  replacement: string;
}

// Functions:
- replaceURLsInHTML(html: string, mappings: URLMapping[]): string
- preserveHTMLStructure(html: string): string
```

### 2. File Structure

```
/app
  /admin
    page.tsx            # Admin interface page
    layout.tsx          # Admin layout (optional)
/components
  /admin
    HtmlInput.tsx       # Textarea input component
    HtmlOutput.tsx      # Processed HTML display
    ProcessingStatus.tsx # Status indicators
/lib
  /parser
    htmlParser.ts       # Parse HTML and extract resources
    resourceExtractor.ts # Extract specific resource types
    urlReplacer.ts      # Replace URLs in HTML
  /cms
    cmsStubs.ts         # Stub CMS upload functions
    types.ts            # CMS-related types
/types
  processing.ts         # Processing-related types
  resources.ts          # Resource-related types
```

## Week 1: Core Processing (Days 1-5)

### Days 1-2: HTML Input & Parser
**Goal**: Create working HTML input and resource extraction

**Tasks**:
1. Create `/app/admin/page.tsx` with basic layout
2. Add HTML textarea component
3. Implement Cheerio parser in `/lib/parser/htmlParser.ts`
4. Extract all external URLs from HTML
5. Categorize resources by type (PDF, image, document)
6. Test with sample newsletter

**Success Criteria**:
- Can paste HTML into textarea
- Parser extracts all external resource URLs
- Resources properly categorized by type

### Days 3-4: Resource Processing & URL Replacement
**Goal**: Build URL mapping and replacement system

**Tasks**:
1. Create `/lib/parser/resourceExtractor.ts` for detailed extraction
2. Build URL mapping system (original → CMS)
3. Implement `/lib/parser/urlReplacer.ts`
4. Preserve HTML structure during replacement
5. Handle edge cases (relative URLs, malformed URLs)

**Success Criteria**:
- All resource URLs identified correctly
- URL replacement maintains HTML structure
- Edge cases handled gracefully

### Day 5: CMS Stub Functions
**Goal**: Create mock CMS upload functionality

**Tasks**:
1. Create `/lib/cms/cmsStubs.ts` with upload simulation
2. Generate mock CMS URLs with pattern `mock-{uuid}`
3. Add configurable delay to simulate network
4. Return realistic response structure
5. Wire stubs to processing pipeline

**Success Criteria**:
- Stub generates unique CMS URLs
- Processing pipeline uses stub successfully
- Can process entire newsletter end-to-end

## Week 2: UI & Polish (Days 6-10)

### Days 6-7: Basic User Interface
**Goal**: Create functional admin UI

**Tasks**:
1. Add processing status indicators
2. Create output textarea for processed HTML
3. Implement copy-to-clipboard functionality
4. Add basic error messages
5. Style with Tailwind CSS

**Success Criteria**:
- Clear visual feedback during processing
- Easy to copy processed HTML
- Errors displayed clearly

### Days 8-9: Integration & Testing
**Goal**: Ensure robust end-to-end functionality

**Tasks**:
1. Test with full Yom Kippur sample newsletter
2. Handle various HTML formats
3. Add retry logic for "failed" uploads
4. Test edge cases and malformed HTML
5. Basic performance optimization

**Success Criteria**:
- Processes sample newsletter correctly
- Handles errors gracefully
- Acceptable performance (<5 seconds for typical newsletter)

### Day 10: Documentation & Deployment
**Goal**: Deploy MVP to Vercel

**Tasks**:
1. Update documentation for MVP
2. Create migration notes for real API
3. Configure Vercel deployment
4. Deploy to production
5. Create handoff documentation

**Success Criteria**:
- Successfully deployed to Vercel
- Documentation complete
- Clear migration path documented

## Code Examples

### Example: HTML Parser Implementation
```typescript
// /lib/parser/htmlParser.ts
import * as cheerio from 'cheerio';

export interface ParsedResource {
  originalUrl: string;
  type: 'pdf' | 'image' | 'document' | 'other';
  filename: string;
}

export function parseHTML(html: string): ParsedResource[] {
  const $ = cheerio.load(html);
  const resources: ParsedResource[] = [];

  // Find all links
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && isExternalResource(href)) {
      resources.push(categorizeResource(href));
    }
  });

  // Find all images
  $('img[src]').each((_, element) => {
    const src = $(element).attr('src');
    if (src && isExternalResource(src)) {
      resources.push({
        originalUrl: src,
        type: 'image',
        filename: extractFilename(src)
      });
    }
  });

  return resources;
}
```

### Example: CMS Stub Implementation
```typescript
// /lib/cms/cmsStubs.ts
import { v4 as uuidv4 } from 'uuid';

export interface CMSUploadResponse {
  success: boolean;
  cmsUrl: string;
  resourceId: string;
  error?: string;
}

export async function uploadToCMS(
  resourceUrl: string,
  resourceType: string
): Promise<CMSUploadResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate 95% success rate
  if (Math.random() > 0.95) {
    return {
      success: false,
      cmsUrl: '',
      resourceId: '',
      error: 'Mock upload failed'
    };
  }

  const resourceId = `mock-${uuidv4()}`;
  return {
    success: true,
    cmsUrl: `https://cms.chabaduniverse.com/api/resource/${resourceId}`,
    resourceId
  };
}
```

### Example: URL Replacer Implementation
```typescript
// /lib/parser/urlReplacer.ts
export interface URLMapping {
  original: string;
  replacement: string;
}

export function replaceURLsInHTML(
  html: string,
  mappings: URLMapping[]
): string {
  let processedHtml = html;

  // Sort by length (longest first) to avoid partial replacements
  const sortedMappings = [...mappings].sort(
    (a, b) => b.original.length - a.original.length
  );

  for (const mapping of sortedMappings) {
    // Escape special regex characters
    const escaped = mapping.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    processedHtml = processedHtml.replace(regex, mapping.replacement);
  }

  return processedHtml;
}
```

## Testing Strategy

### Unit Tests (Optional for MVP)
- Parser correctly extracts resources
- URL replacement preserves HTML
- Stub functions return expected format

### Integration Tests (Required)
- End-to-end processing with sample newsletter
- Error handling for malformed HTML
- Performance with large newsletters

### Manual Testing Checklist
- [ ] Paste Yom Kippur sample HTML
- [ ] Verify all PDFs identified
- [ ] Verify all images identified
- [ ] Check CMS URLs generated
- [ ] Verify HTML structure preserved
- [ ] Copy output and validate

## Migration to Production

### When Real CMS API Available:
1. Replace `/lib/cms/cmsStubs.ts` with real implementation
2. Add proper authentication via Valu API
3. Implement actual file download before upload
4. Add proper error handling and retry logic
5. Enable MongoDB for processing history
6. Add before/after preview feature

### Environment Variables for Production:
```env
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
CHABAD_UNIVERSE_API_KEY=<real-api-key>
CHABAD_UNIVERSE_CHANNEL_ID=<channel-id>
MONGODB_URI=<production-mongodb-url>
```

## Success Metrics

### MVP Success Criteria:
- ✅ Admin can paste newsletter HTML
- ✅ System extracts all external resources
- ✅ Resources "uploaded" to CMS (stubbed)
- ✅ URLs replaced with CMS URLs
- ✅ Modified HTML copyable from output
- ✅ Deployed to Vercel

### Performance Targets:
- Process typical newsletter in <5 seconds
- Handle newsletters up to 100KB HTML
- Extract up to 50 resources per newsletter

## Risk Mitigation

### Technical Risks:
- **HTML Format Variations**: Test with multiple newsletter samples
- **URL Edge Cases**: Build comprehensive test cases
- **Performance**: Optimize Cheerio parsing, consider streaming

### Schedule Risks:
- **Scope Creep**: Strictly enforce MVP scope
- **Integration Issues**: Use stubs to eliminate dependencies
- **Testing Time**: Allocate days 8-9 entirely to testing

## Handoff Documentation

### For Next Phase:
1. Location of stub functions to replace
2. Required CMS API endpoints
3. Authentication flow needed
4. Database schema for processing history
5. UI components ready for enhancement

### Key Files to Modify:
- `/lib/cms/cmsStubs.ts` → Real CMS implementation
- `/app/admin/page.tsx` → Add authentication
- `/types/processing.ts` → Add production types

## Questions & Decisions

### Resolved:
- ✅ Use stubs instead of mock server
- ✅ Focus on paste input only (no file upload)
- ✅ Skip before/after preview for MVP
- ✅ No MongoDB for MVP

### Open Questions:
- Exact CMS API endpoint structure?
- Authentication token format?
- File size limits for resources?
- Timeout settings for uploads?

---

This plan provides a clear, achievable path to delivering the Phase 2 MVP within the 1-2 week timeline.