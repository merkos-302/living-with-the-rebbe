/**
 * CMS Upload Module - Usage Examples
 *
 * This file demonstrates how to use the CMS upload module
 * to download resources and upload them to ChabadUniverse CMS.
 */

import type { ValuApi } from '@arkeytyp/valu-api';
import { parseHtml } from '@/lib/parser';
import { downloadResources, uploadResources } from '@/lib/cms';

/**
 * Example 1: Complete workflow - Parse, Download, and Upload
 *
 * This is the most common use case: take newsletter HTML,
 * extract resources, download them, upload to CMS, and
 * replace URLs in the HTML.
 */
export async function completeWorkflowExample(
  htmlContent: string,
  baseUrl: string,
  valuApi: ValuApi
): Promise<{ modifiedHtml: string; uploadedCount: number }> {
  console.log('Starting complete workflow...');

  // Step 1: Parse HTML to extract resources
  const parseResult = parseHtml(htmlContent, { baseUrl });
  console.log(`Found ${parseResult.resources.length} resources to process`);

  // Step 2: Download all resources
  const downloads = await downloadResources(parseResult.resources, {
    maxConcurrent: 5, // Download 5 at a time
    maxRetries: 3,
    timeout: 30000,
  });
  console.log(`Downloaded ${downloads.length} resources`);

  // Step 3: Upload to CMS
  const uploadResult = await uploadResources(downloads, valuApi, {
    checkDuplicates: true, // Skip files that already exist
    continueOnError: true, // Continue if some uploads fail
    maxRetries: 3,
  });

  console.log(
    `Upload complete: ${uploadResult.summary.successful}/${uploadResult.summary.total} succeeded`
  );
  console.log(`Duplicates skipped: ${uploadResult.summary.duplicates}`);

  // Step 4: Replace URLs in HTML
  let modifiedHtml = htmlContent;
  for (const [originalUrl, cmsUrl] of Object.entries(uploadResult.urlMappings)) {
    // Replace all occurrences of the original URL with the CMS URL
    modifiedHtml = modifiedHtml.replace(new RegExp(escapeRegex(originalUrl), 'g'), cmsUrl);
  }

  return {
    modifiedHtml,
    uploadedCount: uploadResult.summary.successful,
  };
}

/**
 * Example 2: Download resources only (without upload)
 *
 * Useful for testing or when you want to process files locally
 * before uploading.
 */
export async function downloadOnlyExample(htmlContent: string, baseUrl: string) {
  console.log('Downloading resources...');

  // Parse HTML
  const parseResult = parseHtml(htmlContent, { baseUrl });

  // Download resources with custom options
  const downloads = await downloadResources(parseResult.resources, {
    maxConcurrent: 3,
    maxRetries: 5,
    timeout: 60000, // 1 minute timeout for large files
    userAgent: 'Living-with-the-Rebbe/1.0',
  });

  // Process downloads
  for (const download of downloads) {
    console.log(`Downloaded: ${download.filename}`);
    console.log(`  Size: ${formatBytes(download.size)}`);
    console.log(`  Type: ${download.mimeType}`);
    console.log(`  From: ${download.resource.normalizedUrl}`);
  }

  return downloads;
}

/**
 * Example 3: Upload with progress tracking
 *
 * Monitor upload progress and handle errors gracefully.
 */
export async function uploadWithProgressExample(
  htmlContent: string,
  baseUrl: string,
  valuApi: ValuApi,
  onProgress?: (current: number, total: number, filename: string) => void
) {
  // Parse and download
  const parseResult = parseHtml(htmlContent, { baseUrl });
  const downloads = await downloadResources(parseResult.resources);

  console.log(`Starting upload of ${downloads.length} files...`);

  // Upload with progress tracking (sequential upload allows this)
  const results = [];
  const errors = [];

  for (let i = 0; i < downloads.length; i++) {
    const download = downloads[i];

    try {
      // Update progress
      if (onProgress && download) {
        onProgress(i + 1, downloads.length, download.filename);
      }

      if (download) {
        // Import individual upload function for progress tracking
        const { uploadToCMS } = await import('@/lib/cms');
        const result = await uploadToCMS(download, valuApi, {
          checkDuplicates: true,
          maxRetries: 3,
        });

        results.push(result);

        if (result.success) {
          console.log(`✓ Uploaded: ${download.filename} → ${result.cmsUrl}`);
        } else {
          console.error(`✗ Failed: ${download.filename} - ${result.error}`);
          errors.push({ filename: download.filename, error: result.error });
        }
      }
    } catch (error: any) {
      if (download) {
        console.error(`✗ Error: ${download.filename} - ${error.message}`);
        errors.push({ filename: download.filename, error: error.message });
      }
    }
  }

  console.log(
    `\nUpload complete: ${results.filter((r) => r.success).length}/${downloads.length} succeeded`
  );

  if (errors.length > 0) {
    console.error(`\nFailed uploads (${errors.length}):`);
    errors.forEach((e) => console.error(`  - ${e.filename}: ${e.error}`));
  }

  return { results, errors };
}

/**
 * Example 4: Batch processing with error handling
 *
 * Process multiple newsletters with comprehensive error handling.
 */
export async function batchProcessExample(
  newsletters: Array<{ html: string; baseUrl: string; title: string }>,
  valuApi: ValuApi
) {
  console.log(`Processing ${newsletters.length} newsletters...`);

  const results = [];

  for (const newsletter of newsletters) {
    console.log(`\nProcessing: ${newsletter.title}`);

    try {
      // Parse HTML
      const parseResult = parseHtml(newsletter.html, { baseUrl: newsletter.baseUrl });

      // Download resources
      const downloads = await downloadResources(parseResult.resources, {
        maxConcurrent: 3,
      });

      // Upload to CMS
      const uploadResult = await uploadResources(downloads, valuApi, {
        checkDuplicates: true,
        continueOnError: true,
        maxRetries: 3,
      });

      // Replace URLs
      let modifiedHtml = newsletter.html;
      for (const [original, cms] of Object.entries(uploadResult.urlMappings)) {
        modifiedHtml = modifiedHtml.replace(new RegExp(escapeRegex(original), 'g'), cms);
      }

      results.push({
        title: newsletter.title,
        success: true,
        modifiedHtml,
        stats: {
          resourcesFound: parseResult.resources.length,
          downloaded: downloads.length,
          uploaded: uploadResult.summary.successful,
          failed: uploadResult.summary.failed,
          duplicates: uploadResult.summary.duplicates,
        },
      });

      console.log(`✓ Success: ${newsletter.title}`);
      console.log(
        `  Resources: ${parseResult.resources.length} found, ${uploadResult.summary.successful} uploaded`
      );
    } catch (error: any) {
      console.error(`✗ Failed: ${newsletter.title} - ${error.message}`);

      results.push({
        title: newsletter.title,
        success: false,
        error: error.message,
        modifiedHtml: newsletter.html, // Return original HTML on error
        stats: null,
      });
    }
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\n=== Batch Processing Complete ===`);
  console.log(`Total: ${newsletters.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  return results;
}

/**
 * Example 5: Custom file filtering
 *
 * Process only specific types of resources (e.g., PDFs only).
 */
export async function filterByTypeExample(htmlContent: string, baseUrl: string, valuApi: ValuApi) {
  // Parse HTML
  const parseResult = parseHtml(htmlContent, { baseUrl });

  // Filter resources - only PDFs
  const pdfResources = parseResult.resources.filter((r) => r.type === 'pdf');
  console.log(
    `Found ${pdfResources.length} PDF resources out of ${parseResult.resources.length} total`
  );

  // Download and upload only PDFs
  const downloads = await downloadResources(pdfResources);
  const uploadResult = await uploadResources(downloads, valuApi);

  console.log(`Uploaded ${uploadResult.summary.successful} PDFs`);

  return uploadResult;
}

/**
 * Example 6: Deduplication check
 *
 * Check if resources already exist before uploading.
 */
export async function deduplicationExample(htmlContent: string, baseUrl: string, valuApi: ValuApi) {
  const parseResult = parseHtml(htmlContent, { baseUrl });
  const downloads = await downloadResources(parseResult.resources);

  // Upload with deduplication enabled (default)
  const uploadResult = await uploadResources(downloads, valuApi, {
    checkDuplicates: true,
  });

  console.log(`Upload summary:`);
  console.log(`  Total: ${uploadResult.summary.total}`);
  console.log(
    `  New uploads: ${uploadResult.summary.successful - uploadResult.summary.duplicates}`
  );
  console.log(`  Duplicates (skipped): ${uploadResult.summary.duplicates}`);
  console.log(`  Failed: ${uploadResult.summary.failed}`);

  // Calculate bandwidth saved
  const duplicateBytes = uploadResult.results
    .filter((r) => r.isDuplicate)
    .reduce((sum, r) => sum + (r.fileSize || 0), 0);

  console.log(`  Bandwidth saved: ${formatBytes(duplicateBytes)}`);

  return uploadResult;
}

// ============================================================================
// Utility functions
// ============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// React Component Example
// ============================================================================

/**
 * Example 7: React component integration
 *
 * This shows how to integrate the CMS upload module into a React component.
 */
export const ReactComponentExample = `
import { useState } from 'react';
import { useValuApi } from '@/hooks/useValuApi';
import { parseHtml } from '@/lib/parser';
import { downloadResources, uploadResources } from '@/lib/cms';

export function NewsletterProcessor() {
  const { api } = useValuApi();
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<number>(0);

  const processNewsletter = async (html: string, baseUrl: string) => {
    try {
      setStatus('Parsing HTML...');
      const parseResult = parseHtml(html, { baseUrl });

      setStatus(\`Downloading \${parseResult.resources.length} resources...\`);
      const downloads = await downloadResources(parseResult.resources);

      setStatus(\`Uploading \${downloads.length} files...\`);
      const uploadResult = await uploadResources(downloads, api, {
        checkDuplicates: true,
        continueOnError: true,
      });

      // Update HTML with CMS URLs
      let modifiedHtml = html;
      for (const [original, cms] of Object.entries(uploadResult.urlMappings)) {
        modifiedHtml = modifiedHtml.replace(new RegExp(escapeRegex(original), 'g'), cms);
      }

      setStatus(\`Complete! Uploaded \${uploadResult.summary.successful} files\`);
      return modifiedHtml;
    } catch (error) {
      setStatus(\`Error: \${error.message}\`);
      throw error;
    }
  };

  return (
    <div>
      <div>Status: {status}</div>
      <div>Progress: {progress}%</div>
      {/* Component UI */}
    </div>
  );
}
`;

/**
 * Example 8: CLI usage
 *
 * Use the CMS module in a Node.js CLI script.
 */
export const CLIExample = `
#!/usr/bin/env node

import { readFileSync } from 'fs';
import { ValuApi } from '@arkeytyp/valu-api';
import { parseHtml } from '@/lib/parser';
import { downloadResources, uploadResources } from '@/lib/cms';

async function main() {
  // Read HTML file
  const html = readFileSync(process.argv[2], 'utf-8');
  const baseUrl = process.argv[3];

  console.log('Processing newsletter...');

  // Initialize Valu API (requires iframe context)
  const api = new ValuApi();

  // Parse, download, and upload
  const parseResult = parseHtml(html, { baseUrl });
  const downloads = await downloadResources(parseResult.resources);
  const uploadResult = await uploadResources(downloads, api);

  console.log('Upload complete:');
  console.log(JSON.stringify(uploadResult.summary, null, 2));
}

main().catch(console.error);
`;
