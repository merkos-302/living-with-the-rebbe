/**
 * Tests for HTML parser and resource extraction
 *
 * IMPORTANT: The parser only extracts LINKED documents (PDFs, Word docs, etc.) from <a> tags
 * It does NOT extract inline images from <img> tags or other embedded media
 * This is because inline images are part of the email display and don't need CMS upload
 */

import {
  parseHtml,
  extractResourcesByType,
  getAllUrls,
  hasErrors,
  extractResourceUrls,
  hasExternalResources,
  getResourceSummary,
} from '../index';
import { ResourceType } from '@/types/parser';

describe('HTML Parser', () => {
  describe('parseHtml', () => {
    it('should NOT extract images from img tags (inline images stay as-is)', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image1.jpg" alt="Test Image" />
            <img src="https://example.com/image2.png" />
          </body>
        </html>
      `;

      const result = parseHtml(html);

      // Inline images are NOT extracted - they remain in the email content
      expect(result.summary.totalResources).toBe(0);
      expect(result.byType[ResourceType.IMAGE]).toHaveLength(0);
    });

    it('should extract PDFs from anchor tags', () => {
      const html = `
        <html>
          <body>
            <a href="https://example.com/document.pdf">Download PDF</a>
            <a href="https://example.com/page.html">Regular Link</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      expect(result.byType[ResourceType.PDF]).toHaveLength(1);
      expect(result.resources[0].normalizedUrl).toBe('https://example.com/document.pdf');
      expect(result.resources[0].type).toBe(ResourceType.PDF);
    });

    it('should extract documents from anchor tags', () => {
      const html = `
        <html>
          <body>
            <a href="https://example.com/report.docx">Word Document</a>
            <a href="https://example.com/sheet.xlsx">Excel Sheet</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      expect(result.byType[ResourceType.DOCUMENT]).toHaveLength(2);
      expect(result.resources[0].type).toBe(ResourceType.DOCUMENT);
    });

    it('should NOT extract from embed tags (embedded media stays as-is)', () => {
      const html = `
        <html>
          <body>
            <embed src="https://example.com/video.pdf" type="application/pdf" />
          </body>
        </html>
      `;

      const result = parseHtml(html);

      // Embedded media is NOT extracted
      expect(result.summary.totalResources).toBe(0);
      expect(result.byType[ResourceType.PDF]).toHaveLength(0);
    });

    it('should NOT extract from object tags (embedded media stays as-is)', () => {
      const html = `
        <html>
          <body>
            <object data="https://example.com/document.pdf" type="application/pdf"></object>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      // Object tags are NOT processed
      expect(result.summary.totalResources).toBe(0);
      expect(result.byType[ResourceType.PDF]).toHaveLength(0);
    });

    it('should NOT extract from source tags (inline media stays as-is)', () => {
      const html = `
        <html>
          <body>
            <picture>
              <source srcset="https://example.com/image-large.jpg" media="(min-width: 800px)" />
              <source src="https://example.com/image-small.jpg" />
              <img src="https://example.com/image-fallback.jpg" />
            </picture>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      // Source and img tags are NOT processed
      expect(result.byType[ResourceType.IMAGE].length).toBe(0);
      expect(result.summary.totalResources).toBe(0);
    });

    it('should NOT extract background images from inline styles', () => {
      const html = `
        <html>
          <body>
            <div style="background-image: url('https://example.com/bg.jpg')">Content</div>
            <div style="background: url(https://example.com/bg2.png) no-repeat">More content</div>
          </body>
        </html>
      `;

      const result = parseHtml(html, { includeBackgrounds: true });

      // Background images are NOT extracted
      expect(result.byType[ResourceType.IMAGE].length).toBe(0);
      expect(result.summary.totalResources).toBe(0);
    });

    it('should NOT extract background images from style tags', () => {
      const html = `
        <html>
          <head>
            <style>
              .header {
                background-image: url('https://example.com/header-bg.jpg');
              }
              .footer {
                background: url("https://example.com/footer-bg.png");
              }
            </style>
          </head>
          <body></body>
        </html>
      `;

      const result = parseHtml(html, { includeBackgrounds: true });

      // CSS background images are NOT extracted
      expect(result.byType[ResourceType.IMAGE].length).toBe(0);
      expect(result.summary.totalResources).toBe(0);
    });

    it('should skip background images when disabled', () => {
      const html = `
        <html>
          <body>
            <div style="background-image: url('https://example.com/bg.jpg')">Content</div>
          </body>
        </html>
      `;

      const result = parseHtml(html, { includeBackgrounds: false });

      expect(result.summary.totalResources).toBe(0);
    });

    it('should remove duplicate resources', () => {
      const html = `
        <html>
          <body>
            <a href="https://example.com/document.pdf">First Link</a>
            <a href="https://example.com/document.pdf">Second Link</a>
            <a href="https://example.com/document.pdf">Third Link</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      // Should only have one unique PDF resource
      expect(result.summary.totalResources).toBe(1);
      expect(result.resources[0].normalizedUrl).toBe('https://example.com/document.pdf');
    });

    it('should handle relative URLs with base URL for linked documents', () => {
      const html = `
        <html>
          <body>
            <a href="/documents/report.pdf">Download Report</a>
            <a href="files/schedule.docx">Download Schedule</a>
          </body>
        </html>
      `;

      const result = parseHtml(html, {
        baseUrl: 'https://example.com',
        externalOnly: false,
      });

      expect(result.summary.totalResources).toBe(2);
      expect(result.resources[0].normalizedUrl).toBe('https://example.com/documents/report.pdf');
      expect(result.resources[1].normalizedUrl).toBe('https://example.com/files/schedule.docx');
    });

    it('should skip relative URLs when externalOnly is true', () => {
      const html = `
        <html>
          <body>
            <a href="/documents/local.pdf">Local PDF</a>
            <a href="https://example.com/external.pdf">External PDF</a>
          </body>
        </html>
      `;

      const result = parseHtml(html, {
        baseUrl: 'https://mysite.com',
        externalOnly: true,
      });

      // Both PDFs are extracted because:
      // 1. /documents/local.pdf resolves to https://mysite.com/documents/local.pdf (not external to mysite.com)
      // 2. https://example.com/external.pdf is external to mysite.com
      // So when externalOnly is true, only the example.com PDF is external
      expect(result.summary.totalResources).toBe(1);
      expect(result.summary.externalResources).toBe(1);
      expect(result.resources[0].normalizedUrl).toBe('https://example.com/external.pdf');
    });

    it('should handle protocol-relative URLs for documents', () => {
      const html = `
        <html>
          <body>
            <a href="//example.com/document.pdf">Download PDF</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      expect(result.summary.totalResources).toBe(1);
      expect(result.resources[0].normalizedUrl).toBe('https://example.com/document.pdf');
    });

    it('should skip data URIs and only process real document links', () => {
      const html = `
        <html>
          <body>
            <a href="data:application/pdf;base64,JVBERi0xLj...">Embedded PDF</a>
            <a href="https://example.com/real-document.pdf">Real PDF</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      // Should skip data URI and only extract real PDF
      expect(result.summary.totalResources).toBe(1);
      expect(result.resources[0].normalizedUrl).toBe('https://example.com/real-document.pdf');
    });

    it('should handle malformed HTML gracefully', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image.jpg"
            <div>Unclosed div
            <a href="https://example.com/doc.pdf">Link
          </body>
      `;

      const result = parseHtml(html);

      // Should still extract the PDF link despite malformed HTML
      expect(result.summary.totalResources).toBe(1);
      expect(result.byType[ResourceType.PDF]).toHaveLength(1);
      expect(hasErrors(result)).toBe(false); // Parsing shouldn't fail
    });

    it('should handle empty HTML', () => {
      const result = parseHtml('');

      expect(result.summary.totalResources).toBe(0);
      expect(result.resources).toEqual([]);
    });

    it('should handle HTML with no resources', () => {
      const html = `
        <html>
          <body>
            <h1>Title</h1>
            <p>Some text content</p>
            <a href="#anchor">Internal anchor</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      expect(result.summary.totalResources).toBe(0);
    });

    it('should extract context information from anchor tags', () => {
      const html = `
        <html>
          <body>
            <a
              href="https://example.com/document.pdf"
              title="Title Text"
              aria-label="Aria Label"
            >Download Document</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      expect(result.resources[0].context?.title).toBe('Title Text');
      expect(result.resources[0].context?.ariaLabel).toBe('Aria Label');
    });

    it('should parse srcset with multiple URLs', () => {
      const html = `
        <html>
          <body>
            <img srcset="https://example.com/small.jpg 480w, https://example.com/large.jpg 800w" />
          </body>
        </html>
      `;

      const result = parseHtml(html);

      // Note: img tags are NOT processed - inline images stay as-is
      expect(result.summary.totalResources).toBe(0);
    });

    it('should track parsing metadata', () => {
      const html = '<a href="https://example.com/document.pdf">PDF</a>';

      const result = parseHtml(html);

      expect(result.metadata.htmlLength).toBe(html.length);
      expect(result.metadata.parseTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.options).toBeDefined();
    });
  });

  describe('Helper functions', () => {
    it('should extract resources by type', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image.jpg" />
            <a href="https://example.com/doc.pdf">PDF</a>
            <a href="https://example.com/file.docx">Word</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);
      const images = extractResourcesByType(result, ResourceType.IMAGE);
      const pdfs = extractResourcesByType(result, ResourceType.PDF);
      const docs = extractResourcesByType(result, ResourceType.DOCUMENT);

      // Images from img tags are NOT extracted
      expect(images).toHaveLength(0);
      // Only linked documents are extracted
      expect(pdfs).toHaveLength(1);
      expect(docs).toHaveLength(1);
    });

    it('should get all URLs from linked documents', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image.jpg" />
            <a href="https://example.com/doc.pdf">PDF</a>
            <a href="https://example.com/report.docx">Word</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);
      const urls = getAllUrls(result);

      // Only URLs from linked documents
      expect(urls).toEqual(['https://example.com/doc.pdf', 'https://example.com/report.docx']);
    });

    it('should extract resource URLs directly', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image.jpg" />
            <a href="https://example.com/doc.pdf">PDF</a>
            <a href="https://example.com/report.docx">Word</a>
          </body>
        </html>
      `;

      const urls = extractResourceUrls(html);

      // Only extracts linked documents
      expect(urls).toContain('https://example.com/doc.pdf');
      expect(urls).toContain('https://example.com/report.docx');
      expect(urls).not.toContain('https://example.com/image.jpg');
    });

    it('should check for external resources', () => {
      const htmlWithExternal = '<a href="https://example.com/document.pdf">PDF</a>';
      const htmlWithoutExternal = '<p>Just text</p>';
      const htmlWithOnlyImages = '<img src="https://example.com/image.jpg" />';

      expect(hasExternalResources(htmlWithExternal)).toBe(true);
      expect(hasExternalResources(htmlWithoutExternal)).toBe(false);
      // Images are not extracted, so this should be false
      expect(hasExternalResources(htmlWithOnlyImages)).toBe(false);
    });

    it('should get resource summary for linked documents only', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image.jpg" />
            <a href="https://example.com/doc.pdf">PDF</a>
            <a href="https://example.com/report.docx">Word</a>
          </body>
        </html>
      `;

      const summary = getResourceSummary(html);

      // Only counts linked documents, not inline images
      expect(summary.total).toBe(2);
      expect(summary.external).toBe(2);
      expect(summary.byType[ResourceType.IMAGE]).toBe(0);
      expect(summary.byType[ResourceType.PDF]).toBe(1);
      expect(summary.byType[ResourceType.DOCUMENT]).toBe(1);
    });
  });
});
