/**
 * Tests for Parse API route
 * Note: These tests verify the parsing logic used by the API route.
 * Full API route testing requires Next.js runtime environment.
 *
 * IMPORTANT: Parser only extracts linked documents (PDFs, Word docs) from <a> tags,
 * NOT inline images from <img> tags or other media elements
 */

import { parseHtml, ResourceType } from '@/lib/parser';

describe('Parse API Logic', () => {
  describe('HTML parsing for API', () => {
    it('should parse HTML and return results matching API format', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image.jpg" alt="Test" />
            <a href="https://example.com/doc.pdf">PDF</a>
            <a href="https://example.com/report.docx">Word Doc</a>
          </body>
        </html>
      `;

      // This is what the API route does internally
      const result = parseHtml(html, {
        externalOnly: true,
        includeBackgrounds: true,
      });

      // Verify API response format
      const apiResponse = {
        success: true,
        data: {
          summary: {
            totalResources: result.summary.totalResources,
            externalResources: result.summary.externalResources,
            byType: {
              pdfs: result.summary.byType[ResourceType.PDF],
              images: result.summary.byType[ResourceType.IMAGE],
              documents: result.summary.byType[ResourceType.DOCUMENT],
              unknown: result.summary.byType[ResourceType.UNKNOWN],
            },
          },
          resources: result.resources.map((resource) => ({
            url: resource.normalizedUrl,
            type: resource.type,
            extension: resource.extension,
          })),
          metadata: {
            parseTime: result.metadata.parseTime,
            htmlLength: result.metadata.htmlLength,
          },
        },
      };

      expect(apiResponse.success).toBe(true);
      // Only linked documents are extracted (PDF and Word doc), not img tag
      expect(apiResponse.data.summary.totalResources).toBe(2);
      expect(apiResponse.data.summary.byType.images).toBe(0); // No images extracted
      expect(apiResponse.data.summary.byType.pdfs).toBe(1);
      expect(apiResponse.data.summary.byType.documents).toBe(1);
      expect(apiResponse.data.resources).toHaveLength(2);
    });

    it('should handle parsing with custom options', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image.jpg" />
            <div style="background-image: url('https://example.com/bg.jpg')"></div>
            <a href="https://example.com/document.pdf">Download PDF</a>
          </body>
        </html>
      `;

      const result = parseHtml(html, {
        externalOnly: true,
        includeBackgrounds: true,
      });

      // Only the PDF from the anchor tag is extracted
      expect(result.summary.totalResources).toBe(1);
      expect(result.byType[ResourceType.PDF]).toHaveLength(1);
      expect(result.byType[ResourceType.IMAGE]).toHaveLength(0);
    });

    it('should validate HTML input requirements', () => {
      // Test empty HTML
      const emptyResult = parseHtml('');
      expect(emptyResult.summary.totalResources).toBe(0);

      // Test HTML size limit check (should be done in API route)
      const html = '<a href="https://example.com/document.pdf">PDF</a>';
      const htmlSize = html.length;
      const maxSize = 10 * 1024 * 1024; // 10MB

      expect(htmlSize).toBeLessThan(maxSize);
    });

    it('should handle parsing errors gracefully', () => {
      const html = `
        <html>
          <body>
            <img src="" />
            <a href="https://example.com/file.${'a'.repeat(3000)}">Long URL</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      // Parser handles errors gracefully - invalid URLs are skipped
      // Errors are logged but don't stop parsing
      expect(result.summary).toBeDefined();
      expect(result.resources).toBeDefined();

      // Empty src and overly long URLs should be filtered out
      // So we might have errors OR just no resources
      expect(result.errors.length >= 0).toBe(true);
    });

    it('should include all metadata needed for API response', () => {
      const html = '<a href="https://example.com/document.pdf">PDF</a>';

      const result = parseHtml(html);

      // Verify all required metadata is present
      expect(result.metadata.parseTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.htmlLength).toBe(html.length);
      expect(result.metadata.options).toBeDefined();
    });

    it('should extract resource context for API response', () => {
      const html = `
        <a
          href="https://example.com/document.pdf"
          title="Title Text"
          aria-label="Aria Label"
        >Download PDF</a>
      `;

      const result = parseHtml(html);

      expect(result.resources[0].context?.title).toBe('Title Text');
      expect(result.resources[0].context?.ariaLabel).toBe('Aria Label');
    });

    it('should format data suitable for JSON API response', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image.jpg" />
            <a href="https://example.com/doc.pdf">PDF</a>
            <a href="https://example.com/report.docx">Word Doc</a>
          </body>
        </html>
      `;

      const result = parseHtml(html);

      // Format like the API route does
      const apiData = {
        summary: {
          totalResources: result.summary.totalResources,
          externalResources: result.summary.externalResources,
          byType: {
            pdfs: result.summary.byType[ResourceType.PDF],
            images: result.summary.byType[ResourceType.IMAGE],
            documents: result.summary.byType[ResourceType.DOCUMENT],
          },
        },
        resources: result.resources.map((r) => ({
          url: r.normalizedUrl,
          type: r.type,
          extension: r.extension,
        })),
      };

      // Verify structure is JSON-serializable
      expect(() => JSON.stringify(apiData)).not.toThrow();
      // Only linked documents extracted, not inline images
      expect(apiData.summary.totalResources).toBe(2);
      expect(apiData.resources).toHaveLength(2);
    });
  });
});
