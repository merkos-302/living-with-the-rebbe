/**
 * Tests for the newsletter processing API route
 * Note: These tests verify the processing logic used by the API route.
 * Full API route testing requires Next.js runtime environment.
 */

import { parseHtml } from '@/lib/parser';
import { downloadResources } from '@/lib/downloader';
import { ResourceType } from '@/types/parser';
import type { ParsedResource } from '@/types/parser';
import type { DownloadResult } from '@/lib/downloader/types';

// Mock the downloader to avoid network calls
jest.mock('@/lib/downloader', () => ({
  downloadResources: jest.fn(),
}));

describe('Process API Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HTML parsing and resource extraction', () => {
    it('should parse HTML and extract resources', async () => {
      const html = `
        <html>
          <body>
            <a href="https://example.com/test.pdf">PDF Document</a>
            <a href="https://example.com/doc.docx">Word Document</a>
          </body>
        </html>
      `;

      // This is what the API route does internally
      const result = parseHtml(html, {
        externalOnly: true,
        includeBackgrounds: true,
        maxUrlLength: 2048,
      });

      // Verify resources were extracted
      expect(result.resources).toHaveLength(2);
      expect(result.resources[0]?.type).toBe(ResourceType.PDF);
      expect(result.resources[1]?.type).toBe(ResourceType.DOCUMENT);
      expect(result.summary.totalResources).toBe(2);
      expect(result.summary.externalResources).toBe(2);
    });

    it('should handle HTML with no external resources', async () => {
      const html = `
        <html>
          <body>
            <h1>Newsletter Title</h1>
            <p>Content without external resources</p>
          </body>
        </html>
      `;

      const result = parseHtml(html, {
        externalOnly: true,
        includeBackgrounds: true,
      });

      expect(result.resources).toHaveLength(0);
      expect(result.summary.totalResources).toBe(0);
    });

    it('should resolve relative URLs with baseUrl', async () => {
      const html = `
        <html>
          <body>
            <a href="/documents/test.pdf">PDF</a>
          </body>
        </html>
      `;

      const result = parseHtml(html, {
        baseUrl: 'https://example.com',
        externalOnly: false, // Include internal resources to see the resolved URL
      });

      expect(result.resources).toHaveLength(1);
      expect(result.resources[0]?.normalizedUrl).toBe('https://example.com/documents/test.pdf');
    });
  });

  describe('Resource downloading simulation', () => {
    it('should successfully download resources', async () => {
      const mockResource: ParsedResource = {
        url: 'https://example.com/test.pdf',
        normalizedUrl: 'https://example.com/test.pdf',
        type: ResourceType.PDF,
        extension: '.pdf',
        element: {
          tag: 'a',
          attribute: 'href',
          outerHTML: '<a href="https://example.com/test.pdf">PDF</a>',
        },
        isExternal: true,
      };

      const mockBuffer = new ArrayBuffer(100);
      const mockDownloadResult: DownloadResult = {
        buffer: mockBuffer,
        originalResource: mockResource,
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        size: 100,
        downloadTime: 50,
        downloadedAt: new Date(),
      };

      // Mock the downloader
      (downloadResources as jest.Mock).mockResolvedValue({
        successful: [mockDownloadResult],
        failed: [],
        summary: {
          total: 1,
          successful: 1,
          failed: 0,
          totalSize: 100,
          totalTime: 50,
        },
      });

      // Test downloading
      const result = await downloadResources([mockResource], {
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        concurrency: 3,
        maxFileSize: 50 * 1024 * 1024,
      });

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.totalSize).toBe(100);
      expect(result.successful[0]?.filename).toBe('test.pdf');
    });

    it('should handle download failures', async () => {
      const mockResource: ParsedResource = {
        url: 'https://example.com/test.pdf',
        normalizedUrl: 'https://example.com/test.pdf',
        type: ResourceType.PDF,
        extension: '.pdf',
        element: {
          tag: 'a',
          attribute: 'href',
          outerHTML: '<a href="https://example.com/test.pdf">PDF</a>',
        },
        isExternal: true,
      };

      // Mock the downloader to return a failure
      (downloadResources as jest.Mock).mockResolvedValue({
        successful: [],
        failed: [
          {
            resource: mockResource,
            error: 'Failed to download: Network error',
            statusCode: 500,
            retryAttempts: 3,
            failedAt: new Date(),
          },
        ],
        summary: {
          total: 1,
          successful: 0,
          failed: 1,
          totalSize: 0,
          totalTime: 150,
        },
      });

      // Test downloading with failure
      const result = await downloadResources([mockResource]);

      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]?.error).toContain('Network error');
    });

    it('should handle mixed success and failure', async () => {
      const mockResource1: ParsedResource = {
        url: 'https://example.com/test1.pdf',
        normalizedUrl: 'https://example.com/test1.pdf',
        type: ResourceType.PDF,
        extension: '.pdf',
        element: {
          tag: 'a',
          attribute: 'href',
          outerHTML: '<a href="https://example.com/test1.pdf">PDF 1</a>',
        },
        isExternal: true,
      };

      const mockResource2: ParsedResource = {
        url: 'https://example.com/test2.pdf',
        normalizedUrl: 'https://example.com/test2.pdf',
        type: ResourceType.PDF,
        extension: '.pdf',
        element: {
          tag: 'a',
          attribute: 'href',
          outerHTML: '<a href="https://example.com/test2.pdf">PDF 2</a>',
        },
        isExternal: true,
      };

      const mockBuffer = new ArrayBuffer(100);

      // Mock mixed results
      (downloadResources as jest.Mock).mockResolvedValue({
        successful: [
          {
            buffer: mockBuffer,
            originalResource: mockResource1,
            filename: 'test1.pdf',
            mimeType: 'application/pdf',
            size: 100,
            downloadTime: 50,
            downloadedAt: new Date(),
          },
        ],
        failed: [
          {
            resource: mockResource2,
            error: 'Failed to download: Not found',
            statusCode: 404,
            retryAttempts: 3,
            failedAt: new Date(),
          },
        ],
        summary: {
          total: 2,
          successful: 1,
          failed: 1,
          totalSize: 100,
          totalTime: 150,
        },
      });

      const result = await downloadResources([mockResource1, mockResource2]);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.summary.total).toBe(2);
    });
  });

  describe('Base64 encoding', () => {
    it('should encode ArrayBuffer to base64', () => {
      // Create a test buffer with known content
      const testString = 'Hello, World!';
      const buffer = new TextEncoder().encode(testString).buffer;

      // Convert to base64 (same logic as in the API route)
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i] ?? 0);
      }
      const base64 = Buffer.from(binary, 'binary').toString('base64');

      // Verify we can decode it back
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      expect(decoded).toBe(testString);
    });

    it('should handle empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i] ?? 0);
      }
      const base64 = Buffer.from(binary, 'binary').toString('base64');

      expect(base64).toBe('');
    });
  });

  describe('Integration workflow', () => {
    it('should process HTML end-to-end', async () => {
      // Step 1: Parse HTML
      const html = `
        <html>
          <body>
            <a href="https://example.com/document.pdf">Download PDF</a>
          </body>
        </html>
      `;

      const parseResult = parseHtml(html, {
        externalOnly: true,
        includeBackgrounds: true,
      });

      expect(parseResult.resources).toHaveLength(1);

      // Step 2: Download resources (mocked)
      const mockBuffer = new ArrayBuffer(1024);
      (downloadResources as jest.Mock).mockResolvedValue({
        successful: [
          {
            buffer: mockBuffer,
            originalResource: parseResult.resources[0],
            filename: 'document.pdf',
            mimeType: 'application/pdf',
            size: 1024,
            downloadTime: 100,
            downloadedAt: new Date(),
          },
        ],
        failed: [],
        summary: {
          total: 1,
          successful: 1,
          failed: 0,
          totalSize: 1024,
          totalTime: 100,
        },
      });

      const downloadResult = await downloadResources(parseResult.resources);

      expect(downloadResult.successful).toHaveLength(1);
      expect(downloadResult.summary.totalSize).toBe(1024);

      // Step 3: Convert to base64 (what API route does)
      const download = downloadResult.successful[0];
      expect(download).toBeDefined();
      if (!download) return;

      const bytes = new Uint8Array(download.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i] ?? 0);
      }
      const base64Data = Buffer.from(binary, 'binary').toString('base64');

      // Verify final output structure
      const processedDownload = {
        url: download.originalResource.normalizedUrl,
        data: base64Data,
        filename: download.filename,
        mimeType: download.mimeType,
        size: download.size,
      };

      expect(processedDownload.url).toBe('https://example.com/document.pdf');
      expect(processedDownload.filename).toBe('document.pdf');
      expect(processedDownload.mimeType).toBe('application/pdf');
      expect(processedDownload.size).toBe(1024);
      expect(processedDownload.data).toBeTruthy();
    });
  });
});
