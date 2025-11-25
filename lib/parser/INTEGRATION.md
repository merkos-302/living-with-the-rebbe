# HTML Parser Integration Guide

This guide shows how to integrate the HTML parser with the rest of the newsletter processing pipeline.

## Overview

The parser extracts resources from newsletter HTML. These resources then need to be:
1. Downloaded from their original URLs
2. Uploaded to ChabadUniverse CMS
3. Replaced in the HTML with new CMS URLs

## Integration Flow

```typescript
// Full processing pipeline example
import { parseHtml, ResourceType } from '@/lib/parser';
// import { downloadResource } from '@/lib/downloader'; // TODO: Implement
// import { uploadToCMS } from '@/lib/cms/uploader';    // TODO: Implement

async function processNewsletter(html: string): Promise<{
  processedHtml: string;
  urlMappings: Record<string, string>;
  stats: any;
}> {
  // Step 1: Parse HTML and extract all resources
  console.log('Parsing HTML...');
  const parseResult = parseHtml(html, {
    externalOnly: true,
    includeBackgrounds: true,
  });

  console.log(`Found ${parseResult.summary.totalResources} resources`);

  // Step 2: Process each resource
  const urlMappings: Record<string, string> = {};
  const errors: string[] = [];

  for (const resource of parseResult.resources) {
    try {
      console.log(`Processing ${resource.type}: ${resource.normalizedUrl}`);

      // Download from original URL
      // const fileBuffer = await downloadResource(resource.normalizedUrl);

      // Upload to CMS
      // const cmsResponse = await uploadToCMS(fileBuffer, {
      //   type: resource.type,
      //   filename: resource.normalizedUrl.split('/').pop() || 'file',
      //   originalUrl: resource.normalizedUrl,
      //   context: resource.context,
      // });

      // Store mapping
      // urlMappings[resource.normalizedUrl] = cmsResponse.cmsUrl;

      // Mock for now
      urlMappings[resource.normalizedUrl] =
        `https://cms.chabaduniverse.com/api/resource/${Math.random().toString(36).substring(7)}`;

    } catch (error) {
      const errorMsg = `Failed to process ${resource.normalizedUrl}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  // Step 3: Replace URLs in HTML
  let processedHtml = html;
  for (const [originalUrl, cmsUrl] of Object.entries(urlMappings)) {
    // Escape special regex characters in URL
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedUrl, 'g');
    processedHtml = processedHtml.replace(regex, cmsUrl);
  }

  return {
    processedHtml,
    urlMappings,
    stats: {
      totalResources: parseResult.summary.totalResources,
      processedResources: Object.keys(urlMappings).length,
      failedResources: parseResult.summary.totalResources - Object.keys(urlMappings).length,
      errors,
      parseTime: parseResult.metadata.parseTime,
    },
  };
}
```

## API Route Example

```typescript
// app/api/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseHtml } from '@/lib/parser';

export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'Invalid HTML content' },
        { status: 400 }
      );
    }

    // Parse HTML
    const result = parseHtml(html, {
      externalOnly: true,
      includeBackgrounds: true,
    });

    // Return parsing results for UI to display
    return NextResponse.json({
      success: true,
      data: {
        summary: result.summary,
        resources: result.resources.map(r => ({
          url: r.normalizedUrl,
          type: r.type,
          element: r.element.tag,
          context: r.context,
        })),
        errors: result.errors,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    console.error('Parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse HTML' },
      { status: 500 }
    );
  }
}
```

## React Component Example

```typescript
// components/admin/HtmlProcessor.tsx
'use client';

import { useState } from 'react';
import { parseHtml, ResourceType } from '@/lib/parser';
import type { ParserResult } from '@/lib/parser';

export function HtmlProcessor() {
  const [html, setHtml] = useState('');
  const [parseResult, setParseResult] = useState<ParserResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleParse = () => {
    setIsProcessing(true);

    try {
      const result = parseHtml(html, {
        externalOnly: true,
        includeBackgrounds: true,
      });

      setParseResult(result);
    } catch (error) {
      console.error('Parsing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="html-input" className="block text-sm font-medium mb-2">
          Paste Newsletter HTML
        </label>
        <textarea
          id="html-input"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="w-full h-64 p-4 border rounded font-mono text-sm"
          placeholder="Paste your newsletter HTML here..."
        />
      </div>

      <button
        onClick={handleParse}
        disabled={!html || isProcessing}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isProcessing ? 'Parsing...' : 'Parse HTML'}
      </button>

      {parseResult && (
        <div className="border rounded p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total Resources: {parseResult.summary.totalResources}</div>
              <div>External: {parseResult.summary.externalResources}</div>
              <div>Images: {parseResult.summary.byType[ResourceType.IMAGE]}</div>
              <div>PDFs: {parseResult.summary.byType[ResourceType.PDF]}</div>
              <div>Documents: {parseResult.summary.byType[ResourceType.DOCUMENT]}</div>
              <div>Parse Time: {parseResult.metadata.parseTime}ms</div>
            </div>
          </div>

          {parseResult.errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-red-600">Errors</h3>
              <ul className="text-sm space-y-1">
                {parseResult.errors.map((error, index) => (
                  <li key={index} className="text-red-600">
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Resources</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {parseResult.resources.map((resource, index) => (
                <div key={index} className="text-sm border-l-2 border-blue-500 pl-2">
                  <div className="font-mono text-xs text-blue-600 truncate">
                    {resource.normalizedUrl}
                  </div>
                  <div className="text-gray-600">
                    Type: {resource.type} | Element: &lt;{resource.element.tag}&gt;
                    {resource.context?.altText && ` | Alt: ${resource.context.altText}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Server-Side Processing Example

```typescript
// lib/processor/newsletter-processor.ts
import { parseHtml } from '@/lib/parser';
import type { ParserResult } from '@/lib/parser';

export async function processNewsletterHtml(
  html: string,
  options: {
    channelId: string;
    userId: string;
  }
): Promise<{
  success: boolean;
  processedHtml?: string;
  urlMappings?: Record<string, string>;
  stats?: any;
  error?: string;
}> {
  try {
    // Step 1: Parse HTML
    const parseResult = parseHtml(html, {
      externalOnly: true,
      includeBackgrounds: true,
    });

    console.log(`Parsed HTML: found ${parseResult.summary.totalResources} resources`);

    // Step 2: Download and upload resources
    const urlMappings = await processResources(parseResult, options);

    // Step 3: Replace URLs in HTML
    const processedHtml = replaceUrls(html, urlMappings);

    // Step 4: Save processing session to database
    // await saveProcessingSession({...});

    return {
      success: true,
      processedHtml,
      urlMappings,
      stats: {
        totalResources: parseResult.summary.totalResources,
        processedResources: Object.keys(urlMappings).length,
        byType: parseResult.summary.byType,
        parseTime: parseResult.metadata.parseTime,
      },
    };
  } catch (error) {
    console.error('Newsletter processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function processResources(
  parseResult: ParserResult,
  options: { channelId: string; userId: string }
): Promise<Record<string, string>> {
  const urlMappings: Record<string, string> = {};

  // Process in batches to avoid overwhelming the CMS
  const BATCH_SIZE = 5;
  const resources = parseResult.resources;

  for (let i = 0; i < resources.length; i += BATCH_SIZE) {
    const batch = resources.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (resource) => {
        // TODO: Implement actual download and upload
        // const fileBuffer = await downloadResource(resource.normalizedUrl);
        // const cmsResponse = await uploadToCMS(fileBuffer, {
        //   channelId: options.channelId,
        //   type: resource.type,
        //   metadata: resource.context,
        // });

        // Mock for now
        const cmsUrl = `https://cms.chabaduniverse.com/api/resource/${Math.random().toString(36).substring(7)}`;

        return {
          original: resource.normalizedUrl,
          cms: cmsUrl,
        };
      })
    );

    // Collect successful mappings
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        urlMappings[result.value.original] = result.value.cms;
      }
    });
  }

  return urlMappings;
}

function replaceUrls(
  html: string,
  urlMappings: Record<string, string>
): string {
  let processedHtml = html;

  // Sort by URL length (longest first) to avoid partial replacements
  const entries = Object.entries(urlMappings).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [originalUrl, cmsUrl] of entries) {
    // Escape special regex characters
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedUrl, 'g');
    processedHtml = processedHtml.replace(regex, cmsUrl);
  }

  return processedHtml;
}
```

## Testing Integration

```typescript
// Example integration test
import { parseHtml } from '@/lib/parser';

describe('Newsletter Processing Integration', () => {
  it('should process newsletter HTML end-to-end', async () => {
    const html = `
      <html>
        <body>
          <img src="https://example.com/image.jpg" />
          <a href="https://example.com/doc.pdf">Download</a>
        </body>
      </html>
    `;

    // Parse
    const parseResult = parseHtml(html);
    expect(parseResult.summary.totalResources).toBe(2);

    // Process (mock)
    const urlMappings: Record<string, string> = {};
    parseResult.resources.forEach((resource) => {
      urlMappings[resource.normalizedUrl] = `https://cms.example.com/${Math.random()}`;
    });

    // Replace
    let processedHtml = html;
    Object.entries(urlMappings).forEach(([original, cms]) => {
      processedHtml = processedHtml.replace(original, cms);
    });

    // Verify replacements
    expect(processedHtml).not.toContain('https://example.com/image.jpg');
    expect(processedHtml).not.toContain('https://example.com/doc.pdf');
    expect(processedHtml).toContain('https://cms.example.com/');
  });
});
```

## Next Steps

The parser is now ready for integration. The next components needed are:

### 1. Resource Downloader (`lib/downloader/resource-downloader.ts`)
```typescript
export async function downloadResource(url: string): Promise<Buffer> {
  // Implementation needed
  // - Fetch resource from URL
  // - Validate content type
  // - Handle errors and retries
  // - Return file buffer
}
```

### 2. CMS Uploader (`lib/cms/uploader.ts`)
```typescript
export async function uploadToCMS(
  fileBuffer: Buffer,
  metadata: {
    type: ResourceType;
    filename: string;
    originalUrl: string;
    channelId: string;
  }
): Promise<{ cmsUrl: string; resourceId: string }> {
  // Implementation needed
  // - Upload to ChabadUniverse CMS API
  // - Use Valu authentication
  // - Return new CMS URL
}
```

### 3. URL Replacer (`lib/processor/url-replacer.ts`)
```typescript
export function replaceUrlsInHtml(
  html: string,
  mappings: Record<string, string>
): string {
  // Implementation needed
  // - Replace all occurrences of original URLs
  // - Handle edge cases (encoded URLs, etc.)
  // - Preserve HTML structure
}
```

## Database Schema

Track processing sessions in MongoDB:

```typescript
// models/ProcessingSession.ts
import mongoose from 'mongoose';

const ProcessingSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    required: true,
  },
  originalHtml: { type: String, required: true },
  processedHtml: { type: String },
  resourcesFound: { type: Number, required: true },
  resourcesProcessed: { type: Number },
  urlMappings: { type: Map, of: String },
  errors: [{ type: String }],
  parseTime: { type: Number },
  totalTime: { type: Number },
});
```

## Usage in Admin UI

```typescript
// app/admin/process/page.tsx
'use client';

import { useState } from 'react';
import { parseHtml } from '@/lib/parser';

export default function ProcessPage() {
  const [html, setHtml] = useState('');
  const [result, setResult] = useState(null);

  const handleProcess = async () => {
    // Step 1: Parse locally to validate
    const parseResult = parseHtml(html);

    if (parseResult.errors.length > 0) {
      alert('HTML contains errors. Please review.');
      return;
    }

    // Step 2: Send to API for full processing
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <div>
      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        placeholder="Paste newsletter HTML..."
      />
      <button onClick={handleProcess}>Process Newsletter</button>
      {result && (
        <div>
          <h3>Results</h3>
          {/* Display results */}
        </div>
      )}
    </div>
  );
}
```

## Performance Considerations

- **Parse time**: Typical newsletter HTML (50-100KB) parses in <10ms
- **Memory**: Entire HTML is loaded into memory via Cheerio
- **Batch processing**: Process resources in batches (5-10 at a time)
- **Caching**: Consider caching parsed results for large newsletters

## Error Handling

```typescript
import { parseHtml, hasErrors, getErrorMessages } from '@/lib/parser';

const result = parseHtml(html);

if (hasErrors(result)) {
  console.error('Parsing errors:');
  getErrorMessages(result).forEach((msg) => {
    console.error(`  - ${msg}`);
  });

  // Decide how to handle:
  // - Show errors to user
  // - Retry with different options
  // - Process anyway with warnings
}
```

## Future Enhancements

1. **Progress callbacks**: Report progress during parsing
2. **Custom validators**: Allow plugins for custom resource validation
3. **Resource previews**: Generate thumbnails or previews
4. **Deduplication**: Check if resource already exists in CMS
5. **Batch optimization**: Smart batching based on file size
6. **Error recovery**: Automatic retry with fallback options
