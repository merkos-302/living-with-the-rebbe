ב׳׳ה
# Phase 2 & 3 Implementation - COMPLETE ✅

## Executive Summary

**Status**: ✅ Phase 2 & 3 Complete - Full Pipeline Operational
**Delivered**: Admin tool that processes newsletter HTML, uploads resources to CMS via Valu API, and replaces URLs
**Tests**: 305 passing tests across all modules

## Implementation Summary

| Phase | Status | Components | Tests |
|-------|--------|------------|-------|
| Phase 2: Auth & Parsing | ✅ Complete | Valu Auth, HTML Parser, URL Fetcher | 181 |
| Phase 3: Processing | ✅ Complete | Downloader, CMS Upload, URL Replacer | 124 |
| **Total** | **✅ Complete** | **Full Pipeline** | **305** |

## Completed Features

### Phase 2 (Authentication & Parsing) ✅
- **Valu API authentication** (iframe-only access, admin verification)
- **Dual-mode HTML input** (URL fetch default, paste fallback)
- **Server-side URL fetcher** (CORS-free)
- **Cheerio HTML parser** (extracts linked documents from `<a>` tags)
- **Resource identifier** (21 file formats)
- **API routes**: `/api/parse`, `/api/fetch-html`

### Phase 3 (Resource Processing) ✅
- **Resource downloader** (`/lib/downloader/` - 23 tests)
- **CMS upload via Valu Service Intents** (`/lib/cms/` - 56 tests)
- **URL replacement engine** (`/lib/replacer/` - 36 tests)
- **Pipeline orchestrator** (`/lib/processor/`)
- **Processing hook** (`/hooks/useProcessing.ts`)
- **Progress tracking UI** with stage indicators
- **Output viewer** with copy button
- **API routes**: `/api/process`, `/api/download-resource`

### Not Yet Implemented 📦
- MongoDB processing history
- Before/after visual preview
- Batch processing
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

### Phase 3: Resource Processing ✅ COMPLETE
**Goal**: Build full resource processing pipeline with real CMS integration

**Completed**:
1. ✅ Created `/lib/downloader/` - Resource download with retry logic (23 tests)
2. ✅ Created `/lib/cms/` - CMS upload via Valu Service Intents (56 tests)
3. ✅ Created `/lib/replacer/` - Cheerio-based URL replacement (36 tests)
4. ✅ Created `/lib/processor/` - Pipeline orchestrator
5. ✅ Created `/hooks/useProcessing.ts` - React state management
6. ✅ Created `/api/process` and `/api/download-resource` endpoints
7. ✅ Updated Admin UI with progress tracking and output viewer
8. ✅ Full integration with real Valu API v1.1.1

**Key Implementation Details**:
- Uses Valu Service Intents (`resource-upload`, `resource-search`, `generate-public-url`)
- Upload response format: `{ resolved: [...], rejected: [...] }`
- Public URLs from `api.roomful.net/api/v0/resource/{resourceId}`
- Parallel processing with configurable concurrency
- Progress callbacks for real-time UI updates

**Success Criteria**: ✅ ALL MET
- Resources downloaded with retry logic
- Files uploaded to CMS via Valu API
- URLs replaced in HTML output
- Progress tracking in UI
- Copy-to-clipboard for output

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

## Production Status

### Current Implementation:
The application uses **real CMS API integration** via Valu API v1.1.1 Service Intents:
- `resource-upload` - Upload files to CMS
- `resource-search` - Check for existing resources
- `generate-public-url` - Get public URLs for resources

### Environment Variables:
```env
NEXT_PUBLIC_CHABAD_UNIVERSE_URL=https://chabaduniverse.com
# No API key needed - Valu API handles authentication
# MongoDB not yet implemented
```

### Resolved Issues:
- **CMS 801 Error** - Fixed (2025-12-09). Was using wrong resource ID format (`uuid` instead of `id`). See session file for details.

## Success Metrics

### Implementation Status:
- ✅ Admin can paste newsletter HTML or fetch from URL
- ✅ System extracts all linked documents (PDFs, Word docs from `<a>` tags)
- ✅ Resources uploaded to CMS via Valu Service Intents
- ✅ URLs replaced with CMS URLs from `api.roomful.net`
- ✅ Modified HTML copyable from output
- ⏳ Deploy to Vercel (pending)

### Performance Targets:
- Process typical newsletter in <5 seconds ✅
- Handle newsletters up to 100KB HTML ✅
- Extract up to 50 resources per newsletter ✅

## Risk Mitigation

### Technical Risks:
- **HTML Format Variations**: Test with multiple newsletter samples
- **URL Edge Cases**: Build comprehensive test cases
- **Performance**: Optimize Cheerio parsing, consider streaming

### Schedule Risks:
- **Scope Creep**: Strictly enforce MVP scope
- **Integration Issues**: Use stubs to eliminate dependencies
- **Testing Time**: Allocate days 8-9 entirely to testing

## Key Implementation Files

### Core Modules:
| Module | Path | Tests | Purpose |
|--------|------|-------|---------|
| Parser | `/lib/parser/` | 181 | Extract resources from HTML |
| Downloader | `/lib/downloader/` | 23 | Download files with retry |
| CMS | `/lib/cms/` | 56 | Upload via Valu Service Intents |
| Replacer | `/lib/replacer/` | 36 | Swap URLs in HTML |
| Processor | `/lib/processor/` | - | Pipeline orchestrator |

### API Routes:
- `/api/parse` - Parse HTML for resources
- `/api/fetch-html` - Server-side URL fetcher
- `/api/process` - Full processing pipeline
- `/api/download-resource` - Download single resource

### Hooks:
- `/hooks/useValuAuth.ts` - Authentication state
- `/hooks/useHtmlParser.ts` - Parser state
- `/hooks/useProcessing.ts` - Processing state

## Questions & Decisions

### Resolved:
- ✅ Use real Valu API v1.1.1 with Service Intents (not stubs)
- ✅ Dual-mode input (URL fetch default, paste fallback)
- ✅ Only extract linked documents from `<a>` tags (not inline `<img>`)
- ✅ Public URLs from `api.roomful.net`, not `cms.chabaduniverse.com`
- ✅ No MongoDB for MVP (future enhancement)

### Valu API Response Formats:
- **Upload**: `{ resolved: [...], rejected: [...] }` with resource `uuid` or `id`
- **Public URL**: Returns URL string directly, not wrapped object
- **Search**: Array of matching resources

---

**Status**: Phase 2 & 3 Complete ✅ | 305 tests passing | Ready for Vercel deployment