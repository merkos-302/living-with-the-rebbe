/**
 * Resource Downloader Demo
 *
 * Example usage of the resource downloader module.
 */

import { downloadResource, downloadResources, downloadFromUrl } from './resource-downloader';
import { parseHtml } from '@/lib/parser';
import { ParsedResource, ResourceType } from '@/types/parser';

/**
 * Example 1: Download a single resource
 */
async function example1_singleDownload() {
  console.log('\n=== Example 1: Single Resource Download ===\n');

  const resource: ParsedResource = {
    url: 'document.pdf',
    normalizedUrl: 'https://merkos-living.s3.us-west-2.amazonaws.com/Email85/document.pdf',
    type: ResourceType.PDF,
    extension: '.pdf',
    element: {
      tag: 'a',
      attribute: 'href',
      outerHTML: '<a href="document.pdf">Download PDF</a>',
    },
    isExternal: true,
  };

  try {
    const result = await downloadResource(resource, {
      timeout: 30000,
      calculateHash: true,
    });

    console.log('Download successful!');
    console.log(`  Filename: ${result.filename}`);
    console.log(`  Size: ${result.size} bytes (${(result.size / 1024).toFixed(2)} KB)`);
    console.log(`  MIME Type: ${result.mimeType}`);
    console.log(`  Download Time: ${result.downloadTime}ms`);
    console.log(`  Hash: ${result.hash}`);
  } catch (error) {
    console.error('Download failed:', error);
  }
}

/**
 * Example 2: Download multiple resources with progress tracking
 */
async function example2_batchDownload() {
  console.log('\n=== Example 2: Batch Download with Progress ===\n');

  const resources: ParsedResource[] = [
    {
      url: 'file1.pdf',
      normalizedUrl: 'https://example.com/file1.pdf',
      type: ResourceType.PDF,
      extension: '.pdf',
      element: { tag: 'a', attribute: 'href', outerHTML: '' },
      isExternal: true,
    },
    {
      url: 'file2.pdf',
      normalizedUrl: 'https://example.com/file2.pdf',
      type: ResourceType.PDF,
      extension: '.pdf',
      element: { tag: 'a', attribute: 'href', outerHTML: '' },
      isExternal: true,
    },
    {
      url: 'image.jpg',
      normalizedUrl: 'https://example.com/image.jpg',
      type: ResourceType.IMAGE,
      extension: '.jpg',
      element: { tag: 'img', attribute: 'src', outerHTML: '' },
      isExternal: true,
    },
  ];

  const result = await downloadResources(resources, {
    concurrency: 3,
    maxRetries: 3,
    calculateHash: true,
    onProgress: (progress) => {
      console.log(
        `Progress: ${progress.percentComplete}% ` +
          `(${progress.completed}/${progress.total}) ` +
          `[✓ ${progress.successful} | ✗ ${progress.failed}] ` +
          `${(progress.totalBytes / 1024).toFixed(2)} KB`
      );
    },
    onDownloadComplete: (downloadResult) => {
      console.log(`✓ Downloaded: ${downloadResult.filename} (${downloadResult.size} bytes)`);
    },
    onDownloadFail: (failure) => {
      console.error(`✗ Failed: ${failure.resource.normalizedUrl}`);
      console.error(`  Error: ${failure.error}`);
      console.error(`  Retries: ${failure.retryAttempts}`);
    },
  });

  console.log('\n=== Summary ===');
  console.log(`Total: ${result.summary.total}`);
  console.log(`Successful: ${result.summary.successful}`);
  console.log(`Failed: ${result.summary.failed}`);
  console.log(`Total Size: ${(result.summary.totalSize / 1024).toFixed(2)} KB`);
  console.log(`Total Time: ${result.summary.totalTime}ms`);

  // Show detailed failures
  if (result.failed.length > 0) {
    console.log('\n=== Failed Downloads ===');
    result.failed.forEach((failure) => {
      console.log(`\n${failure.resource.normalizedUrl}`);
      console.log(`  Error: ${failure.error}`);
      console.log(`  Status: ${failure.statusCode || 'N/A'}`);
    });
  }
}

/**
 * Example 3: Parse HTML and download all resources
 */
async function example3_parseAndDownload() {
  console.log('\n=== Example 3: Parse HTML and Download Resources ===\n');

  const html = `
    <html>
      <body>
        <a href="https://example.com/document1.pdf">Document 1</a>
        <a href="https://example.com/document2.pdf">Document 2</a>
        <a href="https://example.com/sheet.xlsx">Spreadsheet</a>
      </body>
    </html>
  `;

  // Parse HTML to extract resources
  const parseResult = await parseHtml(html);

  console.log(`Found ${parseResult.summary.totalResources} resources`);
  console.log(`  PDFs: ${parseResult.summary.byType.pdf}`);
  console.log(`  Documents: ${parseResult.summary.byType.document}`);
  console.log(`  Images: ${parseResult.summary.byType.image}`);

  // Download only PDFs and documents
  const resourcesToDownload = [...parseResult.byType.pdf, ...parseResult.byType.document];

  console.log(`\nDownloading ${resourcesToDownload.length} resources...\n`);

  const downloadResult = await downloadResources(resourcesToDownload, {
    concurrency: 2,
    onProgress: (progress) => {
      const bar = '█'.repeat(Math.floor(progress.percentComplete / 5));
      const empty = '░'.repeat(20 - Math.floor(progress.percentComplete / 5));
      console.log(`[${bar}${empty}] ${progress.percentComplete}%`);
    },
  });

  console.log('\n✓ Download complete!');
  console.log(`Successfully downloaded ${downloadResult.successful.length} files`);
}

/**
 * Example 4: Download from URL (convenience method)
 */
async function example4_downloadFromUrl() {
  console.log('\n=== Example 4: Download from URL ===\n');

  const url = 'https://example.com/important-document.pdf';

  try {
    const result = await downloadFromUrl(url, {
      timeout: 60000,
      calculateHash: true,
    });

    console.log('Download successful!');
    console.log(`  URL: ${url}`);
    console.log(`  Filename: ${result.filename}`);
    console.log(`  Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Hash: ${result.hash}`);
    console.log(`  Time: ${(result.downloadTime / 1000).toFixed(2)}s`);
  } catch (error) {
    console.error('Download failed:', error);
  }
}

/**
 * Example 5: Error handling and retry
 */
async function example5_errorHandling() {
  console.log('\n=== Example 5: Error Handling and Retry ===\n');

  const resources: ParsedResource[] = [
    {
      url: 'valid.pdf',
      normalizedUrl: 'https://example.com/valid.pdf',
      type: ResourceType.PDF,
      extension: '.pdf',
      element: { tag: 'a', attribute: 'href', outerHTML: '' },
      isExternal: true,
    },
    {
      url: 'not-found.pdf',
      normalizedUrl: 'https://example.com/not-found.pdf', // Will 404
      type: ResourceType.PDF,
      extension: '.pdf',
      element: { tag: 'a', attribute: 'href', outerHTML: '' },
      isExternal: true,
    },
    {
      url: 'timeout.pdf',
      normalizedUrl: 'https://example.com/slow-server.pdf', // Will timeout
      type: ResourceType.PDF,
      extension: '.pdf',
      element: { tag: 'a', attribute: 'href', outerHTML: '' },
      isExternal: true,
    },
  ];

  const result = await downloadResources(resources, {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 5000,
    onDownloadFail: (failure) => {
      console.log(`\nDownload failed for: ${failure.resource.url}`);
      console.log(`  Error: ${failure.error}`);
      console.log(`  Status Code: ${failure.statusCode || 'N/A'}`);
      console.log(`  Retry Attempts: ${failure.retryAttempts}`);

      // Determine error type
      if (failure.statusCode === 404) {
        console.log('  → Resource not found (non-retryable)');
      } else if (failure.error.includes('timeout')) {
        console.log('  → Request timeout (retried with backoff)');
      } else if (failure.statusCode && failure.statusCode >= 500) {
        console.log('  → Server error (retried with backoff)');
      }
    },
  });

  console.log('\n=== Final Results ===');
  console.log(`Successful: ${result.summary.successful}/${result.summary.total}`);
  console.log(`Failed: ${result.summary.failed}/${result.summary.total}`);

  // Continue with successful downloads
  console.log('\nProcessing successful downloads...');
  for (const download of result.successful) {
    console.log(`  ✓ ${download.filename} ready for upload`);
    // await uploadToCMS(download);
  }

  // Log failures for later retry or manual intervention
  if (result.failed.length > 0) {
    console.log('\nFailed downloads (may require manual intervention):');
    result.failed.forEach((failure) => {
      console.log(`  ✗ ${failure.resource.url} - ${failure.error}`);
    });
  }
}

/**
 * Example 6: Client-side usage via API
 */
async function example6_clientSideAPI() {
  console.log('\n=== Example 6: Client-Side Download via API ===\n');

  const resource: ParsedResource = {
    url: 'document.pdf',
    normalizedUrl: 'https://example.com/document.pdf',
    type: ResourceType.PDF,
    extension: '.pdf',
    element: { tag: 'a', attribute: 'href', outerHTML: '' },
    isExternal: true,
  };

  try {
    // Call the API endpoint
    const response = await fetch('/api/download-resource', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resource,
        options: {
          timeout: 30000,
          calculateHash: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('Download successful via API!');
      console.log(`  Filename: ${result.data.filename}`);
      console.log(`  Size: ${result.data.size} bytes`);
      console.log(`  Hash: ${result.data.hash}`);

      // Decode base64 buffer
      const buffer = Uint8Array.from(atob(result.data.buffer), (c) => c.charCodeAt(0));
      console.log(`  Buffer decoded: ${buffer.length} bytes`);
    }
  } catch (error) {
    console.error('API download failed:', error);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     Resource Downloader Demo - Usage Examples        ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  // Note: These are example functions
  // In practice, you would call them individually as needed

  // await example1_singleDownload();
  // await example2_batchDownload();
  // await example3_parseAndDownload();
  // await example4_downloadFromUrl();
  // await example5_errorHandling();
  // await example6_clientSideAPI();

  console.log('\n✓ All examples completed!');
}

// Export for use in other files
export {
  example1_singleDownload,
  example2_batchDownload,
  example3_parseAndDownload,
  example4_downloadFromUrl,
  example5_errorHandling,
  example6_clientSideAPI,
  runAllExamples,
};

// Uncomment to run examples
// runAllExamples().catch(console.error);
