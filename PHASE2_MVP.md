ב׳׳ה
# Phase 2 MVP Implementation Plan

## Executive Summary

**Goal**: Deliver a functional HTML processing tool for Living with the Rebbe newsletters within 1-2 weeks
**Approach**: Stub-first development with mock CMS API, replace when real API available
**Deliverable**: Admin tool that processes HTML and replaces resource URLs with CMS URLs

## Phase 2 MVP Scope

### In Scope ✅
- **Valu API authentication** (iframe-only access, admin verification)
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
- Real CMS API integration (use stubs)
- File upload interface
- Analytics dashboard

## Technical Implementation

### 0. Valu API Authentication (REQUIRED FIRST)

This application **MUST** run exclusively inside an iframe within ChabadUniverse/Valu Social. Direct access must be blocked.

#### Authentication Components Required

##### `/lib/valu-api-singleton.ts` - API Instance Manager
```typescript
// Singleton pattern for Valu API instance
// Prevents multiple API connections and memory leaks
import { valuApi } from '@arkeytyp/valu-api';

class ValuApiSingleton {
  private static instance: any;

  static getInstance() {
    if (!this.instance) {
      this.instance = valuApi.createInstance();
    }
    return this.instance;
  }
}
```

##### `/components/valu/ValuFrameGuard.tsx` - Iframe Enforcement
```typescript
export function ValuFrameGuard({ children }: { children: React.ReactNode }) {
  const [isInFrame, setIsInFrame] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if running in iframe
    const inFrame = window !== window.parent;
    setIsInFrame(inFrame);

    // Also verify parent origin
    if (inFrame) {
      window.parent.postMessage({ type: 'valu-verify' }, '*');
    }
  }, []);

  if (isInFrame === null) return null; // Prevent flash

  if (!isInFrame) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>This application must be accessed through ChabadUniverse.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

##### `/hooks/useValuAuth.ts` - Authentication Hook
```typescript
export function useValuAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const valuApi = ValuApiSingleton.getInstance();
        const currentUser = await valuApi.getCurrentUser();

        // Verify admin access
        const hasAdminAccess =
          currentUser?.roles?.includes('channel_admin') ||
          currentUser?.roles?.includes('admin') ||
          currentUser?.permissions?.includes('admin');

        if (!hasAdminAccess) {
          throw new Error('Admin access required');
        }

        setUser(currentUser);
        setIsAdmin(true);
      } catch (error) {
        console.error('Auth failed:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading, isAdmin };
}
```

##### `/app/layout.tsx` - Provider Setup
```typescript
import { ValuApiProvider } from '@arkeytyp/valu-api';
import { ValuFrameGuard } from '@/components/valu/ValuFrameGuard';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ValuApiProvider>
          <ValuFrameGuard>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ValuFrameGuard>
        </ValuApiProvider>
      </body>
    </html>
  );
}
```

#### Implementation Steps
1. **Install Valu API**: `npm install @arkeytyp/valu-api@^1.1.0`
2. **Copy authentication patterns** from universe-portal (see `/docs/VALU_AUTHENTICATION_REFERENCE.md`)
3. **Set up iframe detection** in root layout
4. **Implement admin verification** in auth hook
5. **Protect admin routes** with authentication guard

#### Security Requirements
- **Origin Validation**: Only accept messages from `chabaduniverse.com` or `valu.social`
- **Admin-Only Access**: Verify user has admin role or permission
- **No Direct Access**: Block any attempt to load outside of iframe
- **HTTPS Only**: All communication must be over secure connections

#### Development Testing
For local development without ChabadUniverse parent frame:

1. **Create Test Harness** (`/test-harness.html`):
```html
<!DOCTYPE html>
<html>
<head><title>Valu Test Harness</title></head>
<body>
  <iframe
    src="http://localhost:3000"
    width="100%"
    height="800px"
    id="app-frame">
  </iframe>
  <script>
    // Simulate Valu parent frame messages
    window.addEventListener('message', (event) => {
      if (event.data.type === 'valu-verify') {
        event.source.postMessage({
          type: 'valu-auth',
          user: {
            id: 'test-admin',
            email: 'admin@test.com',
            roles: ['admin'],
            permissions: ['admin']
          }
        }, '*');
      }
    });
  </script>
</body>
</html>
```

2. **Environment Variable for Dev Mode**:
```env
NEXT_PUBLIC_VALU_DEV_MODE=true  # Bypasses iframe check in development
```

3. **Conditional Guard in Development**:
```typescript
const isDev = process.env.NODE_ENV === 'development';
const devMode = process.env.NEXT_PUBLIC_VALU_DEV_MODE === 'true';

if (!isInFrame && !devMode) {
  return <AccessDenied />;
}
```

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

### Day 1: Valu API Authentication Setup ✅ COMPLETE
**Goal**: Implement iframe-only access with admin verification

**Tasks**:
1. ✅ Install `@arkeytyp/valu-api@^1.1.0` package
2. ✅ Create `/lib/valu-api-singleton.ts` for API instance management (186 lines)
3. ✅ Create `/utils/valuAuthCookie.ts` for cookie-based caching (104 lines)
4. ✅ Build `/hooks/useValuApi.ts` connection hook (169 lines)
5. ✅ Build `/hooks/useValuAuth.ts` authentication hook (243 lines)
6. ✅ Create `/contexts/ValuApiContext.tsx` provider (49 lines)
7. ✅ Create `/contexts/AuthContext.tsx` provider (32 lines)
8. ✅ Implement `/components/valu/ValuFrameGuard.tsx` for iframe enforcement (100 lines)
9. ✅ Create `/components/valu/AccessDenied.tsx` access denied UI (65 lines)
10. ✅ Create `/components/LoadingSpinner.tsx` loading states (28 lines)
11. ✅ Update `/app/layout.tsx` with provider hierarchy
12. ✅ Update `/app/page.tsx` with authentication guards (110 lines)
13. ✅ Create `/app/providers.tsx` client-side providers (18 lines)
14. ✅ Create `/public/test-harness.html` development tool (252 lines)
15. ✅ Configure `.env.local` with dev mode settings
16. ✅ Test authentication flow with mock parent frame
17. ✅ Verify TypeScript compilation and builds

**Success Criteria**: ✅ ALL MET
- ✅ App blocks direct access (non-iframe)
- ✅ Successfully authenticates admin users
- ✅ Proper error messages for non-admin users
- ✅ Loading states during authentication
- ✅ Cookie-based caching for fast loading
- ✅ Health monitoring with adaptive intervals
- ✅ Multiple fallback methods for user fetching
- ✅ ChabadUniverse user format compatibility
- ✅ postRunResult bug fix applied

**Implementation Summary**:
- **Files Created**: 12 new files
- **Lines of Code**: 1,356 total
- **Time Invested**: ~2 hours
- **Test Coverage**: Manual testing with dev harness
- **Production Ready**: TypeScript builds successfully, no errors

### Days 2-3: HTML Input & Parser ✅ COMPLETE
**Goal**: Create working HTML input and resource extraction

**Tasks**:
1. ✅ Create `/app/admin/page.tsx` with authenticated tabbed layout
2. ✅ Create `/app/admin/layout.tsx` with authentication wrapper
3. ✅ Add HTML textarea component (protected by auth)
4. ✅ Add file upload support for .html files
5. ✅ Add base URL field for resolving relative URLs
6. ✅ Implement Cheerio parser in `/lib/parser/html-parser.ts`
7. ✅ Extract linked documents from `<a>` tags (PDFs, Word docs, etc.)
8. ✅ Implement resource identifier for 21 file formats
9. ✅ Create preview components (ParseResults, ResourcePreview, HtmlPreview)
10. ✅ Create API endpoint at `/api/parse`
11. ✅ Write 68 comprehensive tests - all passing
12. ✅ Complete documentation in `/lib/parser/README.md`
13. ✅ Test with sample newsletter

**Implementation Summary**:
- **25 files created**, ~2,500+ lines of code
- **68 tests** - all passing
- **21 resource formats** supported
- **Admin dashboard** with tabbed interface
- **Full documentation** including architecture and examples

**Important Decision**:
Parser ONLY extracts linked documents from `<a href>` tags, NOT inline images from `<img src>` tags. Inline images are part of the email's visual content, while only downloadable resources need CMS hosting.

**Success Criteria**: ✅ ALL MET
- ✅ Only authenticated admins can access
- ✅ Can paste HTML into textarea
- ✅ Can upload HTML files
- ✅ Base URL field for relative URL resolution
- ✅ Parser extracts linked document URLs
- ✅ Resources properly categorized by type
- ✅ Preview shows filtered resources
- ✅ Comprehensive test coverage

### Day 4: Resource Processing & URL Replacement
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

#### Authentication Testing
- [ ] Direct access blocked (open URL directly - should show "Access Denied")
- [ ] Iframe access allowed (load within ChabadUniverse frame)
- [ ] Non-admin users rejected with proper message
- [ ] Admin users can access the tool
- [ ] Loading states display during auth

#### Processing Testing
- [ ] Paste Yom Kippur sample HTML
- [ ] Verify all PDFs identified
- [ ] Verify all images identified
- [ ] Check CMS URLs generated
- [ ] Verify HTML structure preserved
- [ ] Copy output and validate

## Migration to Production

### When Real CMS API Available:
1. Replace `/lib/cms/cmsStubs.ts` with real implementation
2. Implement actual file download before upload
3. Add proper error handling and retry logic
4. Enable MongoDB for processing history
5. Add before/after preview feature
6. Enhanced permission checks for file access levels

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