# URL Replacer - Quick Start Guide

## Basic Usage

```typescript
import { replaceUrls } from '@/lib/replacer';

// Create URL mapping
const urlMap = new Map([
  ['https://example.com/file.pdf', 'https://cms.chabaduniverse.com/api/resource/abc123']
]);

// Replace URLs in HTML
const result = replaceUrls(html, urlMap);

console.log(result.html);              // Modified HTML
console.log(result.replacementCount);  // Number of URLs replaced
```

## Common Patterns

### Pattern 1: Complete Processing Pipeline

```typescript
import { parseHtml } from '@/lib/parser';
import { replaceUrls, createUrlMap } from '@/lib/replacer';

// 1. Parse
const parseResult = parseHtml(html);

// 2. Upload (stub for now)
const cmsUrls = parseResult.resources.map((_, i) =>
  `https://cms.example.com/resource/${i}`
);

// 3. Create mapping
const originalUrls = parseResult.resources.map(r => r.normalizedUrl);
const urlMap = createUrlMap(originalUrls, cmsUrls);

// 4. Replace
const result = replaceUrls(html, urlMap);
```

### Pattern 2: Validate Before Replace

```typescript
import { replaceUrls, validateUrlMap } from '@/lib/replacer';

const validation = validateUrlMap(urlMap);
if (!validation.isValid) {
  throw new Error(`Invalid URL map: ${validation.errors.join(', ')}`);
}

const result = replaceUrls(html, urlMap);
```

### Pattern 3: Preview Changes

```typescript
import { previewReplacements } from '@/lib/replacer';

const preview = previewReplacements(html, urlMap);
console.log(`Will replace ${preview.totalReplacements} occurrences`);

// Proceed if looks good
const result = replaceUrls(html, urlMap);
```

### Pattern 4: Custom Options

```typescript
const result = replaceUrls(html, urlMap, {
  caseSensitive: false,       // Case-insensitive matching
  matchQueryParams: false,    // Ignore query parameters
  matchFragments: false,      // Ignore URL fragments
  normalizeUrls: true,        // Normalize before matching
  preserveFormatting: true    // Keep HTML formatting
});
```

## Checking Results

```typescript
const result = replaceUrls(html, urlMap);

// Success?
if (result.replacementCount === urlMap.size) {
  console.log('All URLs replaced successfully!');
}

// Any unreplaced?
if (result.unreplacedUrls.length > 0) {
  console.warn('URLs not found:', result.unreplacedUrls);
}

// Statistics
console.log('Statistics:', result.statistics);
// {
//   totalMappings: 3,
//   successfulReplacements: 3,
//   unmatchedMappings: 0,
//   modifiedElements: 5,
//   processingTime: 12
// }
```

## Debugging

```typescript
// Extract all URLs from HTML
import { extractHrefUrls } from '@/lib/replacer';

const urls = extractHrefUrls(html);
console.log('URLs in HTML:', urls);

// Preview without modifying
const preview = previewReplacements(html, urlMap);
preview.matches.forEach(match => {
  console.log(`${match.originalUrl} → ${match.cmsUrl} (${match.count}x)`);
});
```

## Helper Functions

### createUrlMap
```typescript
const originalUrls = ['url1', 'url2'];
const cmsUrls = ['cms1', 'cms2'];
const map = createUrlMap(originalUrls, cmsUrls);
```

### validateUrlMap
```typescript
const validation = validateUrlMap(urlMap);
if (!validation.isValid) {
  console.error(validation.errors);
}
```

### extractHrefUrls
```typescript
const urls = extractHrefUrls(html);
```

### previewReplacements
```typescript
const preview = previewReplacements(html, urlMap);
```

## Running Examples

```bash
# Run demo examples
tsx lib/replacer/demo.ts

# Run integration example
tsx lib/replacer/integration-example.ts

# Run tests
npm test lib/replacer/url-replacer.test.ts
```

## Common Issues

### Issue: URLs not being replaced

**Solution:** Check URL normalization
```typescript
// Try with different options
const result = replaceUrls(html, urlMap, {
  matchQueryParams: false,  // Ignore query params
  matchFragments: false     // Ignore fragments
});
```

### Issue: Case-sensitive mismatch

**Solution:** Use case-insensitive matching (default)
```typescript
const result = replaceUrls(html, urlMap, {
  caseSensitive: false  // default
});
```

### Issue: Relative URLs

**Solution:** Relative URLs are matched as-is
```typescript
// Include relative URLs in your map
const urlMap = new Map([
  ['/files/doc.pdf', 'https://cms.example.com/resource/1']
]);
```

## Complete Example

```typescript
import { parseHtml } from '@/lib/parser';
import {
  replaceUrls,
  createUrlMap,
  validateUrlMap,
  previewReplacements
} from '@/lib/replacer';

async function processNewsletter(html: string) {
  // 1. Parse HTML
  const parseResult = parseHtml(html);
  console.log(`Found ${parseResult.resources.length} resources`);

  // 2. Upload to CMS (stub)
  const cmsUrls = await uploadToCms(parseResult.resources);

  // 3. Create mapping
  const originalUrls = parseResult.resources.map(r => r.normalizedUrl);
  const urlMap = createUrlMap(originalUrls, cmsUrls);

  // 4. Validate
  const validation = validateUrlMap(urlMap);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  // 5. Preview
  const preview = previewReplacements(html, urlMap);
  console.log(`Will replace ${preview.totalReplacements} URLs`);

  // 6. Replace
  const result = replaceUrls(html, urlMap);

  // 7. Check result
  if (result.unreplacedUrls.length > 0) {
    console.warn('Unreplaced:', result.unreplacedUrls);
  }

  console.log(`Success! Replaced ${result.replacementCount} URLs`);
  return result.html;
}
```

## TypeScript Types

```typescript
import type {
  ReplacementResult,
  ReplacementOptions,
  ReplacementStatistics,
  ReplacementWarning,
  UrlMapping
} from '@/lib/replacer';
```

## Next Steps

- See [README.md](./README.md) for complete documentation
- See [demo.ts](./demo.ts) for usage examples
- See [integration-example.ts](./integration-example.ts) for full workflow
- See [url-replacer.test.ts](./url-replacer.test.ts) for test examples
