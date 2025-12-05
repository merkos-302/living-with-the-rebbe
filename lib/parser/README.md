# HTML Parser Module

Extracts all external resources (PDFs, images, documents) from newsletter HTML for processing and upload to ChabadUniverse CMS.

## Quick Start

```typescript
import { parseHtml, ResourceType } from '@/lib/parser';

const html = `
  <html>
    <body>
      <img src="https://example.com/photo.jpg" alt="Newsletter Photo" />
      <a href="https://example.com/study-guide.pdf">Study Guide</a>
    </body>
  </html>
`;

const result = parseHtml(html);

console.log(`Found ${result.summary.totalResources} resources`);
console.log(`Images: ${result.byType[ResourceType.IMAGE].length}`);
console.log(`PDFs: ${result.byType[ResourceType.PDF].length}`);
```

## Features

### Supported Resource Types (21 File Types)

**PDFs** (1 type)
- `.pdf` - PDF documents

**Images** (8 types) - *Only when linked via `<a>` tags*
- `.jpg`, `.jpeg` - JPEG images
- `.png` - PNG images
- `.gif` - GIF images
- `.webp` - WebP images
- `.svg` - SVG vector images
- `.bmp` - Bitmap images
- `.ico` - Icon files

**Documents** (12 types)
- `.doc`, `.docx` - Microsoft Word
- `.xls`, `.xlsx` - Microsoft Excel
- `.ppt`, `.pptx` - Microsoft PowerPoint
- `.odt` - OpenDocument Text
- `.ods` - OpenDocument Spreadsheet
- `.odp` - OpenDocument Presentation
- `.rtf` - Rich Text Format
- `.txt` - Plain text files
- `.csv` - Comma-separated values

### Extraction Sources

> **IMPORTANT**: The parser only extracts **linked documents** from `<a href>` tags.
> Inline images from `<img src>` tags are **NOT extracted** - they are part of the email's visual content and remain unchanged. Only downloadable resources need CMS hosting.

The parser extracts resources from:

1. **`<a>` tags** - `href` attribute pointing to supported file types (PDFs, documents, etc.)

The parser **skips**:
- `<img>` tags (inline images are visual content, not downloadable resources)
- `<embed>` and `<object>` tags (embedded media)
- CSS background images
- Data URIs

### Features

- Handles malformed HTML gracefully
- Supports absolute, relative, and protocol-relative URLs
- Deduplicates resources automatically
- Extracts context (alt text, title, aria-label)
- Validates URLs and reports errors
- Configurable options for fine control

## API Reference

### Main Functions

#### `parseHtml(html: string, options?: ParserOptions): ParserResult`

Parses HTML and extracts all resources.

**Options:**

```typescript
{
  baseUrl?: string;           // Base URL for resolving relative URLs
  externalOnly?: boolean;     // Only include external resources (default: true)
  includeBackgrounds?: boolean; // Include CSS background images (default: true)
  maxUrlLength?: number;      // Maximum URL length (default: 2048)
  customTypeDetector?: (url: string) => ResourceType | null;
}
```

**Returns:**

```typescript
{
  resources: ParsedResource[];  // All extracted resources
  byType: {                     // Resources grouped by type
    [ResourceType.PDF]: ParsedResource[];
    [ResourceType.IMAGE]: ParsedResource[];
    [ResourceType.DOCUMENT]: ParsedResource[];
    [ResourceType.UNKNOWN]: ParsedResource[];
  };
  summary: {                    // Statistics
    totalResources: number;
    externalResources: number;
    byType: Record<ResourceType, number>;
  };
  errors: ParserError[];        // Any parsing errors
  metadata: {                   // Processing info
    parseTime: number;
    htmlLength: number;
    options: ParserOptions;
  };
}
```

### Helper Functions

#### `extractResourceUrls(html: string): string[]`

Quick extraction of all resource URLs.

```typescript
const urls = extractResourceUrls(html);
// ['https://example.com/image.jpg', 'https://example.com/doc.pdf']
```

#### `hasExternalResources(html: string): boolean`

Check if HTML contains any external resources.

```typescript
if (hasExternalResources(html)) {
  console.log('Processing required');
}
```

#### `getResourceSummary(html: string)`

Get a quick summary without full details.

```typescript
const summary = getResourceSummary(html);
console.log(`Total: ${summary.total}, Images: ${summary.byType.image}`);
```

### Resource Identification

#### `identifyResourceType(url: string, mimeType?: string): ResourceIdentification`

Identifies resource type from URL and optional MIME type.

```typescript
const identification = identifyResourceType('https://example.com/file.pdf');
console.log(identification.type); // ResourceType.PDF
console.log(identification.extension); // '.pdf'
```

#### `validateUrl(url: string, baseUrl?: string): URLValidation`

Validates and normalizes URLs.

```typescript
const validation = validateUrl('/images/photo.jpg', 'https://example.com');
if (validation.isValid) {
  console.log(validation.normalizedUrl); // 'https://example.com/images/photo.jpg'
}
```

## Usage Examples

### Basic Resource Extraction

```typescript
import { parseHtml, ResourceType } from '@/lib/parser';

const html = await fetch('newsletter.html').then(r => r.text());
const result = parseHtml(html);

// Get all images
const images = result.byType[ResourceType.IMAGE];
images.forEach(img => {
  console.log(`Image: ${img.normalizedUrl}`);
  console.log(`Alt text: ${img.context?.altText}`);
});

// Get all PDFs
const pdfs = result.byType[ResourceType.PDF];
pdfs.forEach(pdf => {
  console.log(`PDF: ${pdf.normalizedUrl}`);
});
```

### Processing for CMS Upload

```typescript
import { parseHtml, shouldProcessResourceType } from '@/lib/parser';

const result = parseHtml(html, {
  externalOnly: true,
  includeBackgrounds: true
});

// Process only resources that need uploading
const resourcesToUpload = result.resources.filter(resource =>
  shouldProcessResourceType(resource.type)
);

for (const resource of resourcesToUpload) {
  console.log(`Processing ${resource.type}: ${resource.normalizedUrl}`);
  // Download and upload to CMS
}
```

### Error Handling

```typescript
import { parseHtml, hasErrors, getErrorMessages } from '@/lib/parser';

const result = parseHtml(html);

if (hasErrors(result)) {
  console.error('Parsing errors:', getErrorMessages(result));
}

// Check individual resource errors
result.resources.forEach(resource => {
  if (!resource.isExternal && options.externalOnly) {
    console.warn(`Skipped relative URL: ${resource.url}`);
  }
});
```

### Custom Type Detection

```typescript
import { parseHtml, ResourceType } from '@/lib/parser';

const result = parseHtml(html, {
  customTypeDetector: (url) => {
    // Custom logic for your specific URLs
    if (url.includes('merkos.org/media/')) {
      return ResourceType.PDF;
    }
    return null;
  }
});
```

### Handling Relative URLs

```typescript
import { parseHtml } from '@/lib/parser';

// With base URL for relative path resolution
const result = parseHtml(html, {
  baseUrl: 'https://merkos.org/newsletter',
  externalOnly: false  // Include relative URLs
});

// All URLs will be normalized to absolute
result.resources.forEach(resource => {
  console.log(resource.normalizedUrl); // Always absolute
});
```

## Integration with CMS Upload

```typescript
import { parseHtml, ResourceType } from '@/lib/parser';
import { uploadToCMS } from '@/lib/cms/uploader';

async function processNewsletterHtml(html: string) {
  // Step 1: Parse HTML and extract resources
  const parseResult = parseHtml(html, {
    externalOnly: true,
    includeBackgrounds: true
  });

  console.log(`Found ${parseResult.summary.totalResources} resources`);

  // Step 2: Download and upload each resource
  const urlMappings: Record<string, string> = {};

  for (const resource of parseResult.resources) {
    try {
      // Download from original URL
      const fileBuffer = await downloadResource(resource.normalizedUrl);

      // Upload to CMS
      const cmsUrl = await uploadToCMS(fileBuffer, {
        type: resource.type,
        filename: resource.normalizedUrl.split('/').pop() || 'file',
        originalUrl: resource.normalizedUrl
      });

      // Store mapping for URL replacement
      urlMappings[resource.normalizedUrl] = cmsUrl;

    } catch (error) {
      console.error(`Failed to process ${resource.normalizedUrl}:`, error);
    }
  }

  // Step 3: Replace URLs in HTML
  const processedHtml = replaceUrlsInHtml(html, urlMappings);

  return {
    originalHtml: html,
    processedHtml,
    urlMappings,
    resourceCount: parseResult.summary.totalResources
  };
}
```

## Performance Considerations

- **Parsing Speed**: Typical newsletter HTML (50-100KB) parses in <10ms
- **Memory Usage**: Cheerio loads entire DOM into memory
- **Large HTML**: For very large HTML (>1MB), consider streaming approaches
- **Deduplication**: Automatic deduplication reduces redundant processing

## Error Handling

The parser is designed to be resilient:

- **Malformed HTML**: Cheerio handles most HTML errors gracefully
- **Invalid URLs**: Logged as errors but don't stop parsing
- **Missing attributes**: Safely skipped
- **Unknown resource types**: Categorized as UNKNOWN

Always check `result.errors` after parsing to handle validation issues.

## Testing

```bash
npm test lib/parser
```

See `__tests__/` directory for comprehensive test coverage.
