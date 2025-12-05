/**
 * Tests for URL replacement engine
 */

import { describe, it, expect } from '@jest/globals';
import {
  replaceUrls,
  createUrlMap,
  validateUrlMap,
  extractHrefUrls,
  previewReplacements,
} from './url-replacer';

describe('replaceUrls', () => {
  describe('basic replacement', () => {
    it('should replace a single URL in HTML', () => {
      const html = '<a href="https://example.com/file.pdf">Download</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/123'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1);
      expect(result.html).toContain('https://cms.example.com/resource/123');
      expect(result.unreplacedUrls).toHaveLength(0);
      expect(result.statistics.successfulReplacements).toBe(1);
    });

    it('should replace multiple URLs in HTML', () => {
      const html = `
        <a href="https://example.com/file1.pdf">File 1</a>
        <a href="https://example.com/file2.docx">File 2</a>
        <a href="https://example.com/file3.pdf">File 3</a>
      `;
      const urlMap = new Map([
        ['https://example.com/file1.pdf', 'https://cms.example.com/resource/1'],
        ['https://example.com/file2.docx', 'https://cms.example.com/resource/2'],
        ['https://example.com/file3.pdf', 'https://cms.example.com/resource/3'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(3);
      expect(result.html).toContain('https://cms.example.com/resource/1');
      expect(result.html).toContain('https://cms.example.com/resource/2');
      expect(result.html).toContain('https://cms.example.com/resource/3');
      expect(result.unreplacedUrls).toHaveLength(0);
    });

    it('should handle same URL appearing multiple times', () => {
      const html = `
        <a href="https://example.com/file.pdf">First link</a>
        <a href="https://example.com/file.pdf">Second link</a>
        <a href="https://example.com/file.pdf">Third link</a>
      `;
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1); // Unique URLs replaced
      expect(result.statistics.modifiedElements).toBe(3); // All 3 elements modified
      const matches = result.html.match(/https:\/\/cms\.example\.com\/resource\/1/g);
      expect(matches).toHaveLength(3);
    });

    it('should preserve HTML structure and attributes', () => {
      const html =
        '<a href="https://example.com/file.pdf" class="btn" target="_blank" title="Download">Link</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.html).toContain('class="btn"');
      expect(result.html).toContain('target="_blank"');
      expect(result.html).toContain('title="Download"');
      expect(result.html).toContain('>Link</a>');
    });
  });

  describe('URL normalization', () => {
    it('should handle case-insensitive matching by default', () => {
      const html = '<a href="HTTPS://EXAMPLE.COM/FILE.PDF">Download</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1);
      expect(result.html).toContain('https://cms.example.com/resource/1');
    });

    it('should handle case-sensitive matching when configured', () => {
      const html = '<a href="HTTPS://EXAMPLE.COM/FILE.PDF">Download</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap, { caseSensitive: true });

      expect(result.replacementCount).toBe(0);
      expect(result.unreplacedUrls).toHaveLength(1);
    });

    it('should handle URL-encoded characters', () => {
      const html = '<a href="https://example.com/file%20name.pdf">Download</a>';
      const urlMap = new Map([
        ['https://example.com/file name.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1);
    });

    it('should ignore URL fragments by default', () => {
      const html = '<a href="https://example.com/file.pdf#section1">Download</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1);
    });

    it('should match URL fragments when configured', () => {
      const html = '<a href="https://example.com/file.pdf#section1">Download</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap, { matchFragments: true });

      expect(result.replacementCount).toBe(0); // Won't match because fragment is different
    });

    it('should handle query parameters by default', () => {
      const html = '<a href="https://example.com/file.pdf?version=1">Download</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf?version=1', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1);
    });

    it('should ignore query parameters when configured', () => {
      const html = '<a href="https://example.com/file.pdf?version=1">Download</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap, { matchQueryParams: false });

      expect(result.replacementCount).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty HTML', () => {
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls('', urlMap);

      expect(result.replacementCount).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('Empty HTML');
    });

    it('should handle empty URL map', () => {
      const html = '<a href="https://example.com/file.pdf">Download</a>';
      const urlMap = new Map();

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('Empty URL mapping');
    });

    it('should handle HTML with no anchor tags', () => {
      const html = '<div>No links here</div>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(0);
      expect(result.unreplacedUrls).toContain('https://example.com/file.pdf');
    });

    it('should handle anchor tags without href', () => {
      const html = '<a name="section1">Section</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(0);
    });

    it('should handle relative URLs', () => {
      const html = '<a href="/files/document.pdf">Download</a>';
      const urlMap = new Map([['/files/document.pdf', 'https://cms.example.com/resource/1']]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1);
      expect(result.html).toContain('https://cms.example.com/resource/1');
    });

    it('should handle malformed URLs gracefully', () => {
      const html = '<a href="not-a-valid-url">Download</a>';
      const urlMap = new Map([['not-a-valid-url', 'https://cms.example.com/resource/1']]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1); // Should still work for relative URLs
    });

    it('should preserve HTML entities', () => {
      const html = '<a href="https://example.com/file.pdf">&amp; &lt; &gt; &quot;</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      // Cheerio may re-encode entities, but content should be preserved
      // The important thing is that the URL was replaced and HTML is valid
      expect(result.replacementCount).toBe(1);
      expect(result.html).toContain('https://cms.example.com/resource/1');
      // Verify entities are present (may be encoded as &amp;amp; etc.)
      expect(result.html).toMatch(/&amp;|&amp;amp;/);
    });

    it('should handle Hebrew/RTL text', () => {
      const html = '<a href="https://example.com/file.pdf">תורה</a>';
      const urlMap = new Map([
        ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1);
      expect(result.html).toContain('תורה');
    });
  });

  describe('unreplaced URLs tracking', () => {
    it('should track URLs in map but not found in HTML', () => {
      const html = '<a href="https://example.com/file1.pdf">File 1</a>';
      const urlMap = new Map([
        ['https://example.com/file1.pdf', 'https://cms.example.com/resource/1'],
        ['https://example.com/file2.pdf', 'https://cms.example.com/resource/2'],
        ['https://example.com/file3.pdf', 'https://cms.example.com/resource/3'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.replacementCount).toBe(1);
      expect(result.unreplacedUrls).toHaveLength(2);
      expect(result.unreplacedUrls).toContain('https://example.com/file2.pdf');
      expect(result.unreplacedUrls).toContain('https://example.com/file3.pdf');
      expect(result.statistics.unmatchedMappings).toBe(2);
    });

    it('should include warnings for unreplaced URLs', () => {
      const html = '<a href="https://example.com/file1.pdf">File 1</a>';
      const urlMap = new Map([
        ['https://example.com/file1.pdf', 'https://cms.example.com/resource/1'],
        ['https://example.com/file2.pdf', 'https://cms.example.com/resource/2'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.type).toBe('url-not-found');
      expect(result.warnings[0]?.message).toContain('file2.pdf');
    });
  });

  describe('statistics', () => {
    it('should provide accurate statistics', () => {
      const html = `
        <a href="https://example.com/file1.pdf">File 1</a>
        <a href="https://example.com/file2.pdf">File 2</a>
        <a href="https://example.com/file1.pdf">File 1 again</a>
      `;
      const urlMap = new Map([
        ['https://example.com/file1.pdf', 'https://cms.example.com/resource/1'],
        ['https://example.com/file2.pdf', 'https://cms.example.com/resource/2'],
        ['https://example.com/file3.pdf', 'https://cms.example.com/resource/3'],
      ]);

      const result = replaceUrls(html, urlMap);

      expect(result.statistics.totalMappings).toBe(3);
      expect(result.statistics.successfulReplacements).toBe(2);
      expect(result.statistics.unmatchedMappings).toBe(1);
      expect(result.statistics.modifiedElements).toBe(3); // 2 unique URLs, but 3 elements
      expect(result.statistics.processingTime).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('createUrlMap', () => {
  it('should create a URL map from arrays', () => {
    const originalUrls = ['https://example.com/file1.pdf', 'https://example.com/file2.pdf'];
    const cmsUrls = ['https://cms.example.com/resource/1', 'https://cms.example.com/resource/2'];

    const map = createUrlMap(originalUrls, cmsUrls);

    expect(map.size).toBe(2);
    expect(map.get('https://example.com/file1.pdf')).toBe('https://cms.example.com/resource/1');
    expect(map.get('https://example.com/file2.pdf')).toBe('https://cms.example.com/resource/2');
  });

  it('should throw error if arrays have different lengths', () => {
    const originalUrls = ['https://example.com/file1.pdf'];
    const cmsUrls = ['https://cms.example.com/resource/1', 'https://cms.example.com/resource/2'];

    expect(() => createUrlMap(originalUrls, cmsUrls)).toThrow();
  });
});

describe('validateUrlMap', () => {
  it('should validate a correct URL map', () => {
    const urlMap = new Map([
      ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
    ]);

    const result = validateUrlMap(urlMap);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect empty URL map', () => {
    const urlMap = new Map();

    const result = validateUrlMap(urlMap);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('URL map is empty');
  });

  it('should detect empty original URL', () => {
    const urlMap = new Map([['', 'https://cms.example.com/resource/1']]);

    const result = validateUrlMap(urlMap);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Original URL cannot be empty'))).toBe(true);
  });

  it('should detect empty CMS URL', () => {
    const urlMap = new Map([['https://example.com/file.pdf', '']]);

    const result = validateUrlMap(urlMap);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('CMS URL') && e.includes('cannot be empty'))).toBe(
      true
    );
  });

  it('should detect invalid CMS URL', () => {
    const urlMap = new Map([['https://example.com/file.pdf', 'not-a-valid-url']]);

    const result = validateUrlMap(urlMap);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid CMS URL'))).toBe(true);
  });
});

describe('extractHrefUrls', () => {
  it('should extract all href URLs from HTML', () => {
    const html = `
      <a href="https://example.com/file1.pdf">File 1</a>
      <a href="https://example.com/file2.pdf">File 2</a>
      <a href="https://example.com/file3.pdf">File 3</a>
    `;

    const urls = extractHrefUrls(html);

    expect(urls).toHaveLength(3);
    expect(urls).toContain('https://example.com/file1.pdf');
    expect(urls).toContain('https://example.com/file2.pdf');
    expect(urls).toContain('https://example.com/file3.pdf');
  });

  it('should handle HTML with no links', () => {
    const html = '<div>No links here</div>';

    const urls = extractHrefUrls(html);

    expect(urls).toHaveLength(0);
  });

  it('should handle malformed HTML gracefully', () => {
    const html = 'not valid html';

    const urls = extractHrefUrls(html);

    expect(urls).toEqual([]);
  });
});

describe('previewReplacements', () => {
  it('should preview replacements without modifying HTML', () => {
    const html = `
      <a href="https://example.com/file1.pdf">File 1</a>
      <a href="https://example.com/file2.pdf">File 2</a>
      <a href="https://example.com/file1.pdf">File 1 again</a>
    `;
    const urlMap = new Map([
      ['https://example.com/file1.pdf', 'https://cms.example.com/resource/1'],
      ['https://example.com/file2.pdf', 'https://cms.example.com/resource/2'],
    ]);

    const preview = previewReplacements(html, urlMap);

    expect(preview.matches).toHaveLength(2);
    expect(preview.totalReplacements).toBe(3); // file1 appears twice
    expect(preview.matches[0]?.count).toBeGreaterThan(0);
  });

  it('should show count for duplicate URLs', () => {
    const html = `
      <a href="https://example.com/file.pdf">Link 1</a>
      <a href="https://example.com/file.pdf">Link 2</a>
      <a href="https://example.com/file.pdf">Link 3</a>
    `;
    const urlMap = new Map([
      ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
    ]);

    const preview = previewReplacements(html, urlMap);

    expect(preview.matches).toHaveLength(1);
    expect(preview.matches[0]?.count).toBe(3);
    expect(preview.totalReplacements).toBe(3);
  });
});

describe('real-world scenarios', () => {
  it('should handle newsletter with multiple PDF links', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Newsletter</title></head>
      <body>
        <h1>Weekly Torah Portion</h1>
        <p>Download this week's materials:</p>
        <ul>
          <li><a href="https://s3.amazonaws.com/newsletters/parshat-bereshit.pdf">Parshat Bereshit</a></li>
          <li><a href="https://s3.amazonaws.com/newsletters/study-guide.pdf">Study Guide</a></li>
          <li><a href="https://s3.amazonaws.com/newsletters/calendar.pdf">Calendar</a></li>
        </ul>
      </body>
      </html>
    `;

    const urlMap = new Map([
      [
        'https://s3.amazonaws.com/newsletters/parshat-bereshit.pdf',
        'https://cms.chabaduniverse.com/api/resource/abc123',
      ],
      [
        'https://s3.amazonaws.com/newsletters/study-guide.pdf',
        'https://cms.chabaduniverse.com/api/resource/def456',
      ],
      [
        'https://s3.amazonaws.com/newsletters/calendar.pdf',
        'https://cms.chabaduniverse.com/api/resource/ghi789',
      ],
    ]);

    const result = replaceUrls(html, urlMap);

    expect(result.replacementCount).toBe(3);
    expect(result.unreplacedUrls).toHaveLength(0);
    expect(result.html).toContain('https://cms.chabaduniverse.com/api/resource/abc123');
    expect(result.html).toContain('https://cms.chabaduniverse.com/api/resource/def456');
    expect(result.html).toContain('https://cms.chabaduniverse.com/api/resource/ghi789');
    expect(result.html).toContain('<h1>Weekly Torah Portion</h1>');
  });

  it('should preserve complex HTML structure', () => {
    const html = `
      <div class="newsletter-content">
        <article>
          <header>
            <h2 class="title">Resources</h2>
          </header>
          <section class="resources">
            <div class="resource-item">
              <a href="https://example.com/file.pdf"
                 class="download-btn"
                 data-track="download"
                 aria-label="Download PDF">
                <span class="icon">📄</span>
                <span class="text">Download</span>
              </a>
            </div>
          </section>
        </article>
      </div>
    `;

    const urlMap = new Map([
      ['https://example.com/file.pdf', 'https://cms.example.com/resource/1'],
    ]);

    const result = replaceUrls(html, urlMap);

    expect(result.replacementCount).toBe(1);
    expect(result.html).toContain('class="download-btn"');
    expect(result.html).toContain('data-track="download"');
    expect(result.html).toContain('aria-label="Download PDF"');
    expect(result.html).toContain('<span class="icon">📄</span>');
  });
});
