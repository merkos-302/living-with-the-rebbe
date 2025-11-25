# Complete Example: Using the HTML Parser

This example shows a complete workflow from pasting newsletter HTML to getting processed results.

## Scenario

An admin wants to process a Living with the Rebbe newsletter that contains:
- Newsletter header image
- Rebbe photo
- PDF study guide
- Word document download
- Background images

## Step 1: Input HTML

```typescript
const newsletterHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .header {
      background-image: url('https://merkos.org/images/header-bg.jpg');
      height: 200px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://merkos.org/images/logo.png"
         alt="Living with the Rebbe"
         title="Newsletter Logo" />
  </div>

  <main>
    <h1>Parshas Vayeira - Cheshvan 15, 5785</h1>

    <div class="rebbe-photo">
      <img src="https://merkos.org/photos/rebbe-teaching.jpg"
           alt="The Rebbe teaching at a Farbrengen"
           title="The Rebbe, 1985" />
    </div>

    <p>Download this week's study materials:</p>
    <ul>
      <li>
        <a href="https://merkos.org/pdfs/vayeira-5785-study-guide.pdf">
          Complete Study Guide (PDF)
        </a>
      </li>
      <li>
        <a href="https://merkos.org/docs/vayeira-5785-notes.docx">
          Study Notes (Word Document)
        </a>
      </li>
    </ul>

    <div style="background-image: url('https://merkos.org/images/divider.png')">
      <blockquote>
        "A person must have complete trust in the Creator..."
      </blockquote>
    </div>
  </main>

  <footer>
    <p>© 5785 Merkos L'Inyonei Chinuch</p>
  </footer>
</body>
</html>
`;
```

## Step 2: Parse the HTML

```typescript
import { parseHtml, ResourceType } from '@/lib/parser';

const result = parseHtml(newsletterHtml, {
  externalOnly: true,      // Only process external URLs
  includeBackgrounds: true, // Include CSS backgrounds
});

console.log('Parsing complete!');
console.log(`Found ${result.summary.totalResources} resources`);
```

## Step 3: Examine Results

```typescript
// Summary statistics
console.log('\n=== Summary ===');
console.log(`Total resources: ${result.summary.totalResources}`);
console.log(`External resources: ${result.summary.externalResources}`);
console.log(`Parse time: ${result.metadata.parseTime}ms`);

console.log('\nBy type:');
console.log(`  PDFs: ${result.summary.byType[ResourceType.PDF]}`);        // 1
console.log(`  Images: ${result.summary.byType[ResourceType.IMAGE]}`);    // 4
console.log(`  Documents: ${result.summary.byType[ResourceType.DOCUMENT]}`); // 1

// Detailed resource list
console.log('\n=== Images Found ===');
result.byType[ResourceType.IMAGE].forEach((img, index) => {
  console.log(`${index + 1}. ${img.normalizedUrl}`);
  if (img.context?.altText) {
    console.log(`   Alt: ${img.context.altText}`);
  }
  console.log(`   Found in: <${img.element.tag}> ${img.element.attribute}`);
});

/*
Output:
1. https://merkos.org/images/header-bg.jpg
   Found in: <style> css-background
2. https://merkos.org/images/logo.png
   Alt: Living with the Rebbe
   Found in: <img> src
3. https://merkos.org/photos/rebbe-teaching.jpg
   Alt: The Rebbe teaching at a Farbrengen
   Found in: <img> src
4. https://merkos.org/images/divider.png
   Found in: <div> style
*/

console.log('\n=== PDFs Found ===');
result.byType[ResourceType.PDF].forEach((pdf, index) => {
  console.log(`${index + 1}. ${pdf.normalizedUrl}`);
});

/*
Output:
1. https://merkos.org/pdfs/vayeira-5785-study-guide.pdf
*/

console.log('\n=== Documents Found ===');
result.byType[ResourceType.DOCUMENT].forEach((doc, index) => {
  console.log(`${index + 1}. ${doc.normalizedUrl}`);
});

/*
Output:
1. https://merkos.org/docs/vayeira-5785-notes.docx
*/
```

## Step 4: Process Resources (Mock Implementation)

```typescript
// In real implementation, this would download and upload to CMS
const urlMappings: Record<string, string> = {};

for (const resource of result.resources) {
  console.log(`Processing ${resource.type}: ${resource.normalizedUrl}`);

  // TODO: Implement actual download and upload
  // const fileBuffer = await downloadResource(resource.normalizedUrl);
  // const cmsResponse = await uploadToCMS(fileBuffer, {
  //   type: resource.type,
  //   channelId: process.env.CHABAD_UNIVERSE_CHANNEL_ID,
  //   metadata: resource.context,
  // });

  // Mock CMS URL for demonstration
  const cmsUrl = `https://cms.chabaduniverse.com/api/resource/${
    Math.random().toString(36).substring(2, 15)
  }`;

  urlMappings[resource.normalizedUrl] = cmsUrl;

  console.log(`  ✓ Uploaded to: ${cmsUrl}`);
}

/*
Output:
Processing image: https://merkos.org/images/header-bg.jpg
  ✓ Uploaded to: https://cms.chabaduniverse.com/api/resource/abc123xyz
Processing image: https://merkos.org/images/logo.png
  ✓ Uploaded to: https://cms.chabaduniverse.com/api/resource/def456uvw
...
*/
```

## Step 5: Replace URLs in HTML

```typescript
// Replace all original URLs with CMS URLs
let processedHtml = newsletterHtml;

// Sort by URL length (longest first) to avoid partial replacements
const sortedMappings = Object.entries(urlMappings).sort(
  (a, b) => b[0].length - a[0].length
);

for (const [originalUrl, cmsUrl] of sortedMappings) {
  // Escape special regex characters
  const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedUrl, 'g');

  const countBefore = (processedHtml.match(regex) || []).length;
  processedHtml = processedHtml.replace(regex, cmsUrl);

  console.log(`Replaced ${originalUrl} (${countBefore} occurrences)`);
}

/*
Output:
Replaced https://merkos.org/images/header-bg.jpg (1 occurrences)
Replaced https://merkos.org/images/logo.png (1 occurrences)
Replaced https://merkos.org/photos/rebbe-teaching.jpg (1 occurrences)
...
*/
```

## Step 6: Verify Results

```typescript
// Verify all URLs were replaced
const finalCheck = parseHtml(processedHtml);

console.log('\n=== Final Verification ===');
console.log(`Original resources: ${result.summary.totalResources}`);
console.log(`Remaining external resources: ${finalCheck.summary.externalResources}`);

if (finalCheck.summary.externalResources === 0) {
  console.log('✓ All external resources successfully replaced!');
} else {
  console.log('⚠ Some resources were not replaced:');
  finalCheck.resources.forEach((r) => {
    console.log(`  - ${r.normalizedUrl}`);
  });
}

// Output processed HTML snippet
console.log('\n=== Processed HTML Sample ===');
console.log(processedHtml.substring(0, 500));
console.log('...');
```

## Step 7: Return to Admin

```typescript
const processingResult = {
  success: true,
  originalHtml: newsletterHtml,
  processedHtml: processedHtml,
  stats: {
    totalResources: result.summary.totalResources,
    processedResources: Object.keys(urlMappings).length,
    byType: {
      pdfs: result.summary.byType[ResourceType.PDF],
      images: result.summary.byType[ResourceType.IMAGE],
      documents: result.summary.byType[ResourceType.DOCUMENT],
    },
    processingTime: Date.now() - startTime,
  },
  urlMappings: urlMappings,
  errors: result.errors,
};

// Admin can now:
// 1. Review the processed HTML
// 2. Copy to clipboard
// 3. Distribute via ChabadUniverse
```

## Complete API Route Example

```typescript
// app/api/process-newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseHtml } from '@/lib/parser';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { html } = await request.json();

    // Validate input
    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'Invalid HTML content' },
        { status: 400 }
      );
    }

    // Step 1: Parse HTML
    const parseResult = parseHtml(html, {
      externalOnly: true,
      includeBackgrounds: true,
    });

    // Step 2: Process resources (mock for now)
    const urlMappings: Record<string, string> = {};
    for (const resource of parseResult.resources) {
      // TODO: Implement actual download/upload
      const cmsUrl = `https://cms.chabaduniverse.com/api/resource/${
        Math.random().toString(36).substring(2, 15)
      }`;
      urlMappings[resource.normalizedUrl] = cmsUrl;
    }

    // Step 3: Replace URLs
    let processedHtml = html;
    const sortedMappings = Object.entries(urlMappings).sort(
      (a, b) => b[0].length - a[0].length
    );

    for (const [originalUrl, cmsUrl] of sortedMappings) {
      const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedHtml = processedHtml.replace(new RegExp(escapedUrl, 'g'), cmsUrl);
    }

    // Return results
    return NextResponse.json({
      success: true,
      data: {
        processedHtml,
        originalHtml: html,
        stats: {
          totalResources: parseResult.summary.totalResources,
          processedResources: Object.keys(urlMappings).length,
          byType: parseResult.summary.byType,
          processingTime: Date.now() - startTime,
        },
        urlMappings,
        errors: parseResult.errors,
      },
    });

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
```

## React Component Example

```typescript
// components/admin/NewsletterProcessor.tsx
'use client';

import { useState } from 'react';
import { parseHtml, ResourceType } from '@/lib/parser';
import type { ParserResult } from '@/lib/parser';

export function NewsletterProcessor() {
  const [html, setHtml] = useState('');
  const [result, setResult] = useState<ParserResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    setProcessing(true);

    try {
      // Client-side parse for preview
      const parseResult = parseHtml(html);
      setResult(parseResult);

      // Send to server for full processing
      const response = await fetch('/api/process-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Processed ${data.data.stats.processedResources} resources!`);
        // Display processed HTML for copying
      }
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Newsletter HTML
        </label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="w-full h-64 p-4 border rounded font-mono text-sm"
          placeholder="Paste your newsletter HTML here..."
        />
      </div>

      <button
        onClick={handleProcess}
        disabled={!html || processing}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {processing ? 'Processing...' : 'Process Newsletter'}
      </button>

      {result && (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Resources Found</h3>

          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold">
                {result.summary.byType[ResourceType.PDF]}
              </div>
              <div className="text-gray-600">PDFs</div>
            </div>

            <div className="p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold">
                {result.summary.byType[ResourceType.IMAGE]}
              </div>
              <div className="text-gray-600">Images</div>
            </div>

            <div className="p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold">
                {result.summary.byType[ResourceType.DOCUMENT]}
              </div>
              <div className="text-gray-600">Documents</div>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {result.resources.map((resource, index) => (
              <div
                key={index}
                className="p-2 bg-gray-50 rounded text-sm"
              >
                <div className="font-mono text-xs text-blue-600 truncate">
                  {resource.normalizedUrl}
                </div>
                <div className="text-gray-600">
                  {resource.type} • &lt;{resource.element.tag}&gt;
                  {resource.context?.altText && ` • ${resource.context.altText}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Expected Output

### Console Output
```
Parsing complete!
Found 6 resources

=== Summary ===
Total resources: 6
External resources: 6
Parse time: 8ms

By type:
  PDFs: 1
  Images: 4
  Documents: 1

=== Images Found ===
1. https://merkos.org/images/header-bg.jpg
   Found in: <style> css-background
2. https://merkos.org/images/logo.png
   Alt: Living with the Rebbe
   Found in: <img> src
3. https://merkos.org/photos/rebbe-teaching.jpg
   Alt: The Rebbe teaching at a Farbrengen
   Found in: <img> src
4. https://merkos.org/images/divider.png
   Found in: <div> style

=== PDFs Found ===
1. https://merkos.org/pdfs/vayeira-5785-study-guide.pdf

=== Documents Found ===
1. https://merkos.org/docs/vayeira-5785-notes.docx
```

### API Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalResources": 6,
      "externalResources": 6,
      "byType": {
        "pdfs": 1,
        "images": 4,
        "documents": 1,
        "unknown": 0
      }
    },
    "resources": [
      {
        "url": "https://merkos.org/images/header-bg.jpg",
        "type": "image",
        "extension": ".jpg",
        "element": {
          "tag": "style",
          "attribute": "css-background"
        }
      },
      {
        "url": "https://merkos.org/images/logo.png",
        "type": "image",
        "extension": ".png",
        "element": {
          "tag": "img",
          "attribute": "src"
        },
        "context": {
          "altText": "Living with the Rebbe",
          "title": "Newsletter Logo"
        }
      }
      // ... 4 more resources
    ],
    "metadata": {
      "parseTime": 8,
      "htmlLength": 1543
    },
    "errors": []
  }
}
```

## Error Handling Example

```typescript
// What happens with problematic HTML
const problematicHtml = `
<html>
  <body>
    <img src="">  <!-- Empty URL -->
    <img src="data:image/png;base64,ABC123">  <!-- Data URI -->
    <img src="https://example.com/image.jpg">  <!-- Valid -->
    <a href="not-a-valid-url">Link</a>  <!-- Invalid URL -->
  </body>
</html>
`;

const result = parseHtml(problematicHtml);

console.log('Results:');
console.log(`  Valid resources: ${result.summary.totalResources}`);  // 1
console.log(`  Errors logged: ${result.errors.length}`);  // 2

result.errors.forEach((error) => {
  console.log(`  - ${error.message}`);
});

/*
Output:
Results:
  Valid resources: 1
  Errors logged: 2
  - Invalid URL: URL is empty
  - Invalid URL: Invalid URL format: Invalid URL
*/

// Parser continues gracefully - only valid resource is included
console.log('Valid resource:', result.resources[0].normalizedUrl);
// https://example.com/image.jpg
```

## Performance Example

```typescript
// Testing with large newsletter
const largeHtml = generateLargeNewsletter(100); // 100 images

console.time('Parse large HTML');
const result = parseHtml(largeHtml);
console.timeEnd('Parse large HTML');

console.log(`Parsed ${result.summary.totalResources} resources`);
console.log(`Parse time: ${result.metadata.parseTime}ms`);

/*
Output:
Parse large HTML: 45ms
Parsed 100 resources
Parse time: 45ms
*/
```

## Real-World Usage

```typescript
// In actual admin processing flow
export async function processNewsletterForDistribution(html: string) {
  // 1. Parse
  const parseResult = parseHtml(html, {
    externalOnly: true,
    includeBackgrounds: true,
  });

  if (parseResult.summary.totalResources === 0) {
    return {
      message: 'No external resources to process',
      html: html, // Return as-is
    };
  }

  // 2. Download all resources in parallel (max 5 concurrent)
  const BATCH_SIZE = 5;
  const urlMappings: Record<string, string> = {};

  for (let i = 0; i < parseResult.resources.length; i += BATCH_SIZE) {
    const batch = parseResult.resources.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (resource) => {
        try {
          // Download
          const fileBuffer = await downloadResource(resource.normalizedUrl);

          // Upload to CMS
          const cmsUrl = await uploadToCMS(fileBuffer, {
            type: resource.type,
            originalUrl: resource.normalizedUrl,
          });

          urlMappings[resource.normalizedUrl] = cmsUrl;
        } catch (error) {
          console.error(`Failed to process ${resource.normalizedUrl}:`, error);
        }
      })
    );
  }

  // 3. Replace URLs
  let processedHtml = html;
  Object.entries(urlMappings)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([original, cms]) => {
      const regex = new RegExp(
        original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'g'
      );
      processedHtml = processedHtml.replace(regex, cms);
    });

  // 4. Return results
  return {
    message: `Processed ${Object.keys(urlMappings).length} resources`,
    html: processedHtml,
    stats: {
      total: parseResult.summary.totalResources,
      processed: Object.keys(urlMappings).length,
      failed: parseResult.summary.totalResources - Object.keys(urlMappings).length,
    },
  };
}
```

## Try It Yourself

```bash
# Run the interactive demo
npm run demo:parser

# Or test directly in your code
npm run dev

# Then in browser console or API client:
fetch('http://localhost:3000/api/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    html: '<img src="https://example.com/image.jpg" />'
  })
}).then(r => r.json()).then(console.log);
```

## What You Get

From a single `parseHtml()` call, you get:

1. **All resources** - Every PDF, image, and document found
2. **Organized by type** - Easy filtering and processing
3. **Complete context** - Alt text, titles, ARIA labels
4. **Metadata** - Parse time, HTML length, options used
5. **Error tracking** - Any validation issues encountered
6. **Element info** - Original tag and attribute for each resource

This comprehensive output enables the rest of the processing pipeline to work efficiently.
