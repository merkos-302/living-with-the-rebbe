# URL Replacer Module

The URL Replacer module provides functionality to replace original resource URLs with CMS URLs in HTML content. It's designed specifically for the "Living with the Rebbe" newsletter processing pipeline.

## Overview

After resources (PDFs, documents) are uploaded to the CMS, this module updates the HTML to replace original URLs with CMS URLs. It uses Cheerio for DOM manipulation and provides comprehensive statistics and error tracking.

## Features

- **Accurate Replacement**: Uses DOM manipulation (Cheerio) for reliable URL replacement
- **Flexible Matching**: Configurable URL normalization and matching options
- **Statistics Tracking**: Detailed metrics about replacements
- **Error Detection**: Tracks URLs that couldn't be replaced
- **Preservation**: Maintains HTML structure, attributes, and formatting
- **Edge Cases**: Handles duplicates, encoding, fragments, query parameters
- **Helper Functions**: Validation, preview, and extraction utilities

## Usage

### Basic Example

```typescript
import { replaceUrls } from '@/lib/replacer';

// Create URL mapping (original → CMS)
const urlMap = new Map([
  ['https://s3.amazonaws.com/newsletters/file.pdf', 'https://cms.chabaduniverse.com/api/resource/abc123'],
  ['https://example.com/document.docx', 'https://cms.chabaduniverse.com/api/resource/def456']
]);

// Replace URLs in HTML
const result = replaceUrls(html, urlMap);

console.log(`Replaced ${result.replacementCount} URLs`);
console.log(`Modified ${result.statistics.modifiedElements} elements`);
console.log(`Unreplaced URLs:`, result.unreplacedUrls);
```

### With Options

```typescript
import { replaceUrls } from '@/lib/replacer';

const result = replaceUrls(html, urlMap, {
  caseSensitive: false,        // Case-insensitive matching (default)
  normalizeUrls: true,         // Normalize URLs before matching (default)
  matchQueryParams: true,      // Match query parameters (default)
  matchFragments: false,       // Ignore URL fragments (default)
  preserveFormatting: true     // Preserve HTML formatting (default)
});
```

## API Reference

### `replaceUrls(html, urlMap, options?)`

Main function to replace URLs in HTML.

**Parameters:**
- `html: string` - The HTML content to process
- `urlMap: Map<string, string>` - Mapping from original URLs to CMS URLs
- `options?: ReplacementOptions` - Optional configuration

**Returns:** `ReplacementResult`
- `html: string` - Modified HTML with replaced URLs
- `replacementCount: number` - Number of unique URLs replaced
- `unreplacedUrls: string[]` - URLs in map but not found in HTML
- `statistics: ReplacementStatistics` - Detailed metrics
- `warnings: ReplacementWarning[]` - Any issues encountered

### Helper Functions

#### `createUrlMap(originalUrls, cmsUrls)`

Creates a URL map from two arrays.

```typescript
const originalUrls = ['https://example.com/file1.pdf', 'https://example.com/file2.pdf'];
const cmsUrls = ['https://cms.example.com/resource/1', 'https://cms.example.com/resource/2'];

const urlMap = createUrlMap(originalUrls, cmsUrls);
```

#### `validateUrlMap(urlMap)`

Validates a URL mapping.

```typescript
const validation = validateUrlMap(urlMap);

if (!validation.isValid) {
  console.error('URL map errors:', validation.errors);
}
```

#### `extractHrefUrls(html)`

Extracts all href URLs from HTML (useful for debugging).

```typescript
const urls = extractHrefUrls(html);
console.log('Found URLs:', urls);
```

#### `previewReplacements(html, urlMap, options?)`

Previews what would be replaced without modifying HTML.

```typescript
const preview = previewReplacements(html, urlMap);

console.log(`Would replace ${preview.totalReplacements} occurrences`);
for (const match of preview.matches) {
  console.log(`${match.originalUrl} → ${match.cmsUrl} (${match.count} times)`);
}
```

## Options

### `ReplacementOptions`

```typescript
interface ReplacementOptions {
  caseSensitive?: boolean;      // Match URLs case-sensitively (default: false)
  normalizeUrls?: boolean;      // Normalize URLs before matching (default: true)
  matchQueryParams?: boolean;   // Match query parameters exactly (default: true)
  matchFragments?: boolean;     // Match URL fragments/hash (default: false)
  preserveFormatting?: boolean; // Preserve HTML formatting (default: true)
}
```

### Option Details

#### `caseSensitive`
- **Default:** `false`
- **Description:** Whether to match URLs case-sensitively
- **Example:**
  ```typescript
  // With caseSensitive: false (default)
  'HTTPS://EXAMPLE.COM/file.pdf' matches 'https://example.com/file.pdf'

  // With caseSensitive: true
  'HTTPS://EXAMPLE.COM/file.pdf' does NOT match 'https://example.com/file.pdf'
  ```

#### `normalizeUrls`
- **Default:** `true`
- **Description:** Normalize URLs (decode, remove trailing slashes)
- **Example:**
  ```typescript
  // Normalized:
  'https://example.com/file%20name.pdf' → 'https://example.com/file name.pdf'
  'https://example.com/path/' → 'https://example.com/path'
  ```

#### `matchQueryParams`
- **Default:** `true`
- **Description:** Whether to match query parameters exactly
- **Example:**
  ```typescript
  // With matchQueryParams: true (default)
  'file.pdf?v=1' does NOT match 'file.pdf?v=2'

  // With matchQueryParams: false
  'file.pdf?v=1' matches 'file.pdf?v=2' (query params ignored)
  ```

#### `matchFragments`
- **Default:** `false`
- **Description:** Whether to match URL fragments (hash)
- **Example:**
  ```typescript
  // With matchFragments: false (default)
  'file.pdf#section1' matches 'file.pdf#section2'

  // With matchFragments: true
  'file.pdf#section1' does NOT match 'file.pdf#section2'
  ```

#### `preserveFormatting`
- **Default:** `true`
- **Description:** Preserve original HTML formatting and whitespace
- **Recommendation:** Keep as `true` to maintain HTML readability

## Return Types

### `ReplacementResult`

```typescript
interface ReplacementResult {
  html: string;                        // Modified HTML
  replacementCount: number;            // Unique URLs replaced
  unreplacedUrls: string[];            // URLs not found in HTML
  statistics: ReplacementStatistics;   // Detailed metrics
  warnings: ReplacementWarning[];      // Issues encountered
}
```

### `ReplacementStatistics`

```typescript
interface ReplacementStatistics {
  totalMappings: number;               // Total URLs in the mapping
  successfulReplacements: number;      // URLs successfully replaced
  unmatchedMappings: number;           // URLs not found in HTML
  modifiedElements: number;            // Number of <a> tags modified
  processingTime: number;              // Time in milliseconds
}
```

### `ReplacementWarning`

```typescript
interface ReplacementWarning {
  message: string;                     // Warning message
  type: 'url-not-found' | 'duplicate-url' | 'malformed-url' | 'encoding-issue';
  context?: {
    url?: string;
    element?: string;
    position?: number;
  };
}
```

## Edge Cases

### Duplicate URLs

When the same URL appears multiple times in HTML, it will be replaced in all locations.

```typescript
// HTML with duplicate links
const html = `
  <a href="https://example.com/file.pdf">First link</a>
  <a href="https://example.com/file.pdf">Second link</a>
`;

const result = replaceUrls(html, urlMap);
// replacementCount: 1 (unique URL)
// modifiedElements: 2 (both links modified)
```

### URL Encoding

The replacer handles URL-encoded characters automatically.

```typescript
// These will match:
'https://example.com/file%20name.pdf'
'https://example.com/file name.pdf'
```

### Relative URLs

Relative URLs are matched as-is (without base URL resolution).

```typescript
const urlMap = new Map([
  ['/files/document.pdf', 'https://cms.example.com/resource/1']
]);

const html = '<a href="/files/document.pdf">Download</a>';
const result = replaceUrls(html, urlMap);
// Will replace successfully
```

### Query Parameters & Fragments

By default, fragments are ignored but query parameters must match.

```typescript
// Default behavior:
'file.pdf#section1' matches 'file.pdf#section2'      // Fragments ignored
'file.pdf?v=1' does NOT match 'file.pdf?v=2'         // Params must match

// Configure as needed:
replaceUrls(html, urlMap, {
  matchFragments: true,    // Match fragments exactly
  matchQueryParams: false  // Ignore query parameters
});
```

## Integration with Parser

The URL Replacer works seamlessly with the HTML Parser module.

```typescript
import { parseHtml } from '@/lib/parser';
import { replaceUrls, createUrlMap } from '@/lib/replacer';

// Step 1: Parse HTML to extract resources
const parseResult = parseHtml(html, { baseUrl: 'https://example.com' });

// Step 2: Upload resources to CMS (implementation depends on CMS API)
const cmsUrls = await uploadResourcesToCms(parseResult.resources);

// Step 3: Create URL mapping
const originalUrls = parseResult.resources.map(r => r.normalizedUrl);
const urlMap = createUrlMap(originalUrls, cmsUrls);

// Step 4: Replace URLs in HTML
const replaceResult = replaceUrls(html, urlMap);

// Step 5: Use modified HTML
console.log(replaceResult.html);
```

## Testing

Run tests with Jest:

```bash
npm test lib/replacer/url-replacer.test.ts
```

The test suite includes:
- Basic replacement scenarios
- URL normalization tests
- Edge case handling
- Real-world newsletter examples
- Helper function tests

## Performance

The URL replacer is optimized for typical newsletter processing:

- **Typical Processing Time:** 5-20ms for newsletters with 10-50 links
- **Memory Usage:** Minimal - operates on DOM in memory
- **Scalability:** Handles newsletters with hundreds of links efficiently

## Error Handling

The replacer is designed to never throw errors:

- **Invalid HTML:** Returns original HTML with warnings
- **Empty inputs:** Returns appropriate empty result
- **Malformed URLs:** Attempts best-effort matching
- **Missing URLs:** Tracks in `unreplacedUrls` array

```typescript
const result = replaceUrls(html, urlMap);

if (result.warnings.length > 0) {
  console.warn('Replacement warnings:');
  result.warnings.forEach(w => console.warn(`- ${w.message}`));
}

if (result.unreplacedUrls.length > 0) {
  console.error('URLs not found in HTML:', result.unreplacedUrls);
}
```

## Best Practices

1. **Validate URL Map First**
   ```typescript
   const validation = validateUrlMap(urlMap);
   if (!validation.isValid) {
     throw new Error(`Invalid URL map: ${validation.errors.join(', ')}`);
   }
   ```

2. **Preview Before Replacing**
   ```typescript
   const preview = previewReplacements(html, urlMap);
   console.log(`Will replace ${preview.totalReplacements} occurrences`);
   // Proceed if numbers look correct
   ```

3. **Check Statistics**
   ```typescript
   const result = replaceUrls(html, urlMap);
   if (result.statistics.unmatchedMappings > 0) {
     console.warn('Some URLs were not found in HTML');
   }
   ```

4. **Handle Unreplaced URLs**
   ```typescript
   if (result.unreplacedUrls.length > 0) {
     // Log for debugging or notify admins
     logger.warn('Unreplaced URLs:', result.unreplacedUrls);
   }
   ```

## Dependencies

- **cheerio** - DOM manipulation and HTML parsing
- **TypeScript** - Type safety and interfaces

## Related Modules

- **`/lib/parser`** - HTML parsing and resource extraction
- **`/lib/fetcher`** - URL fetching and HTML retrieval
- **`/lib/cms`** - CMS upload integration (to be implemented)

## Future Enhancements

- Support for replacing URLs in `<img>` tags (if needed)
- Support for CSS background URLs
- Batch processing for multiple HTML documents
- URL transformation functions (custom mapping logic)
- Rollback functionality (restore original URLs)
