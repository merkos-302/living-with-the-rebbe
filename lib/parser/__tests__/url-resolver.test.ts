/**
 * URL Resolver Tests
 */

import { describe, it, expect } from '@jest/globals';
import { resolveAllUrls, extractBaseUrl } from '../url-resolver';
import { UrlResolutionError } from '@/types/fetcher';

describe('extractBaseUrl', () => {
  it('should extract base URL from simple path', () => {
    const url = 'https://example.com/path/page.html';
    const base = extractBaseUrl(url);
    expect(base).toBe('https://example.com/path/');
  });

  it('should extract base URL from nested path', () => {
    const url = 'https://example.com/path/to/deep/page.html';
    const base = extractBaseUrl(url);
    expect(base).toBe('https://example.com/path/to/deep/');
  });

  it('should extract base URL from root', () => {
    const url = 'https://example.com/page.html';
    const base = extractBaseUrl(url);
    expect(base).toBe('https://example.com/');
  });

  it('should handle URL with query parameters', () => {
    const url = 'https://example.com/path/page.html?v=123';
    const base = extractBaseUrl(url);
    expect(base).toBe('https://example.com/path/');
  });

  it('should handle URL with hash', () => {
    const url = 'https://example.com/path/page.html#section';
    const base = extractBaseUrl(url);
    expect(base).toBe('https://example.com/path/');
  });

  it('should handle S3 URLs', () => {
    const url = 'https://merkos-living.s3.us-west-2.amazonaws.com/Email85/48KiSavo1.html';
    const base = extractBaseUrl(url);
    expect(base).toBe('https://merkos-living.s3.us-west-2.amazonaws.com/Email85/');
  });

  it('should handle merkos302.com URLs', () => {
    const url = 'https://merkos302.com/living/newsletter.html';
    const base = extractBaseUrl(url);
    expect(base).toBe('https://merkos302.com/living/');
  });

  it('should throw error for invalid URL', () => {
    expect(() => extractBaseUrl('not a url')).toThrow(UrlResolutionError);
  });
});

describe('resolveAllUrls', () => {
  const baseUrl = 'https://example.com/path/to/';

  describe('href attributes', () => {
    it('should resolve relative href', () => {
      const html = '<a href="../file.pdf">Link</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="https://example.com/path/file.pdf"');
    });

    it('should resolve current directory href', () => {
      const html = '<a href="./file.pdf">Link</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="https://example.com/path/to/file.pdf"');
    });

    it('should resolve simple relative href', () => {
      const html = '<a href="file.pdf">Link</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="https://example.com/path/to/file.pdf"');
    });

    it('should keep absolute href unchanged', () => {
      const html = '<a href="https://other.com/file.pdf">Link</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="https://other.com/file.pdf"');
    });

    it('should keep hash links unchanged', () => {
      const html = '<a href="#section">Link</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="#section"');
    });

    it('should keep mailto links unchanged', () => {
      const html = '<a href="mailto:test@example.com">Email</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="mailto:test@example.com"');
    });

    it('should keep tel links unchanged', () => {
      const html = '<a href="tel:+1234567890">Call</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="tel:+1234567890"');
    });

    it('should keep javascript links unchanged', () => {
      const html = '<a href="javascript:void(0)">Click</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="javascript:void(0)"');
    });

    it('should resolve protocol-relative URLs', () => {
      const html = '<a href="//cdn.example.com/file.pdf">Link</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="https://cdn.example.com/file.pdf"');
    });

    it('should handle href with query parameters', () => {
      const html = '<a href="file.pdf?v=123">Link</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="https://example.com/path/to/file.pdf?v=123"');
    });

    it('should handle href with encoded spaces', () => {
      const html = '<a href="my%20file.pdf">Link</a>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('href="https://example.com/path/to/my%20file.pdf"');
    });
  });

  describe('src attributes', () => {
    it('should resolve relative img src', () => {
      const html = '<img src="../basics/Banner.png" alt="Banner">';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('src="https://example.com/path/basics/Banner.png"');
    });

    it('should resolve script src', () => {
      const html = '<script src="./script.js"></script>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('src="https://example.com/path/to/script.js"');
    });

    it('should resolve iframe src', () => {
      const html = '<iframe src="frame.html"></iframe>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('src="https://example.com/path/to/frame.html"');
    });

    it('should keep data URIs unchanged', () => {
      const html = '<img src="data:image/png;base64,iVBORw0KGgoAAAANS" alt="Image">';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('src="data:image/png;base64,iVBORw0KGgoAAAANS"');
    });
  });

  describe('srcset attributes', () => {
    it('should resolve single srcset URL', () => {
      const html = '<img srcset="image.png 1x" alt="Image">';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('srcset="https://example.com/path/to/image.png 1x"');
    });

    it('should resolve multiple srcset URLs', () => {
      const html = '<img srcset="small.png 1x, large.png 2x" alt="Image">';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('srcset="https://example.com/path/to/small.png 1x');
      expect(resolved).toContain('https://example.com/path/to/large.png 2x"');
    });

    it('should resolve srcset with width descriptors', () => {
      const html = '<img srcset="small.png 400w, large.png 800w" alt="Image">';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('srcset="https://example.com/path/to/small.png 400w');
      expect(resolved).toContain('https://example.com/path/to/large.png 800w"');
    });
  });

  describe('poster attributes', () => {
    it('should resolve video poster', () => {
      const html = '<video poster="thumbnail.jpg"><source src="video.mp4"></video>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('poster="https://example.com/path/to/thumbnail.jpg"');
    });
  });

  describe('data attributes', () => {
    it('should resolve data-src attribute', () => {
      const html = '<img data-src="lazy-image.png" alt="Image">';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('data-src="https://example.com/path/to/lazy-image.png"');
    });

    it('should resolve data-background attribute', () => {
      const html = '<div data-background="bg.jpg"></div>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('data-background="https://example.com/path/to/bg.jpg"');
    });

    it('should resolve data-href attribute', () => {
      const html = '<div data-href="page.html"></div>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('data-href="https://example.com/path/to/page.html"');
    });
  });

  describe('inline styles', () => {
    it('should resolve url() in inline style', () => {
      const html = '<div style="background-image: url(bg.jpg)"></div>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('url(https://example.com/path/to/bg.jpg)');
    });

    it('should resolve url() with single quotes', () => {
      const html = '<div style="background-image: url(\'bg.jpg\')"></div>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain("url('https://example.com/path/to/bg.jpg')");
    });

    it('should resolve url() with double quotes', () => {
      const html = '<div style=\'background-image: url("bg.jpg")\'></div>';
      const resolved = resolveAllUrls(html, baseUrl);
      // Cheerio may HTML-encode quotes in attributes
      expect(resolved).toMatch(
        /url\((&quot;|")https:\/\/example\.com\/path\/to\/bg\.jpg(&quot;|")\)/
      );
    });

    it('should resolve relative url() in inline style', () => {
      const html = '<div style="background-image: url(../images/bg.jpg)"></div>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('url(https://example.com/path/images/bg.jpg)');
    });

    it('should resolve multiple url() in inline style', () => {
      const html = '<div style="background: url(bg1.jpg), url(bg2.jpg)"></div>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('url(https://example.com/path/to/bg1.jpg)');
      expect(resolved).toContain('url(https://example.com/path/to/bg2.jpg)');
    });
  });

  describe('style tags', () => {
    it('should resolve url() in style tag', () => {
      const html = '<style>.bg { background-image: url(bg.jpg); }</style>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('url(https://example.com/path/to/bg.jpg)');
    });

    it('should resolve multiple url() in style tag', () => {
      const html = `
        <style>
          .bg1 { background: url(bg1.jpg); }
          .bg2 { background: url(bg2.jpg); }
        </style>
      `;
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('url(https://example.com/path/to/bg1.jpg)');
      expect(resolved).toContain('url(https://example.com/path/to/bg2.jpg)');
    });

    it('should resolve url() with various CSS properties', () => {
      const html = `
        <style>
          .bg { background-image: url(bg.jpg); }
          .border { border-image: url(border.png); }
          .list { list-style-image: url(bullet.svg); }
        </style>
      `;
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('url(https://example.com/path/to/bg.jpg)');
      expect(resolved).toContain('url(https://example.com/path/to/border.png)');
      expect(resolved).toContain('url(https://example.com/path/to/bullet.svg)');
    });
  });

  describe('complex HTML', () => {
    it('should resolve all URLs in complex HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link rel="stylesheet" href="styles.css">
            <style>
              body { background: url(bg.jpg); }
            </style>
          </head>
          <body>
            <a href="../index.html">Home</a>
            <img src="./images/logo.png" alt="Logo">
            <img srcset="small.png 1x, large.png 2x" alt="Responsive">
            <div style="background-image: url(header.jpg)"></div>
            <script src="app.js"></script>
          </body>
        </html>
      `;
      const resolved = resolveAllUrls(html, baseUrl);

      expect(resolved).toContain('href="https://example.com/path/to/styles.css"');
      expect(resolved).toContain('url(https://example.com/path/to/bg.jpg)');
      expect(resolved).toContain('href="https://example.com/path/index.html"');
      expect(resolved).toContain('src="https://example.com/path/to/images/logo.png"');
      expect(resolved).toContain('srcset="https://example.com/path/to/small.png 1x');
      expect(resolved).toContain('url(https://example.com/path/to/header.jpg)');
      expect(resolved).toContain('src="https://example.com/path/to/app.js"');
    });
  });

  describe('newsletter patterns', () => {
    it('should handle S3 newsletter URLs', () => {
      const newsletterBaseUrl = 'https://merkos-living.s3.us-west-2.amazonaws.com/Email85/';
      const html = `
        <a href="48KiSavo1.pdf">Download PDF</a>
        <img src="../basics/Banner.png" alt="Banner">
      `;
      const resolved = resolveAllUrls(html, newsletterBaseUrl);

      expect(resolved).toContain(
        'href="https://merkos-living.s3.us-west-2.amazonaws.com/Email85/48KiSavo1.pdf"'
      );
      expect(resolved).toContain(
        'src="https://merkos-living.s3.us-west-2.amazonaws.com/basics/Banner.png"'
      );
    });

    it('should handle merkos302.com newsletter URLs', () => {
      const newsletterBaseUrl = 'https://merkos302.com/living/';
      const html = `
        <a href="newsletter.pdf">Download</a>
        <img src="images/photo.jpg" alt="Photo">
      `;
      const resolved = resolveAllUrls(html, newsletterBaseUrl);

      expect(resolved).toContain('href="https://merkos302.com/living/newsletter.pdf"');
      expect(resolved).toContain('src="https://merkos302.com/living/images/photo.jpg"');
    });
  });

  describe('edge cases', () => {
    it('should handle empty HTML', () => {
      const html = '';
      const resolved = resolveAllUrls(html, baseUrl);
      // Cheerio wraps empty content in basic HTML structure
      expect(resolved).toContain('<html>');
      expect(resolved).toContain('</html>');
    });

    it('should handle HTML with no URLs', () => {
      const html = '<div>Hello World</div>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('<div>Hello World</div>');
    });

    it('should handle invalid base URL', () => {
      const html = '<a href="file.pdf">Link</a>';
      expect(() => resolveAllUrls(html, 'not a url')).toThrow(UrlResolutionError);
    });

    it('should preserve HTML entities', () => {
      const html = '<div>&copy; 2024 &mdash; Test &amp; Co.</div>';
      const resolved = resolveAllUrls(html, baseUrl);
      // Cheerio decodes some entities but preserves &amp;
      expect(resolved).toContain('&amp;');
      expect(resolved).toContain('Test &amp; Co.');
    });

    it('should handle Hebrew/RTL content', () => {
      const html = '<div dir="rtl">שלום <a href="file.pdf">קישור</a></div>';
      const resolved = resolveAllUrls(html, baseUrl);
      expect(resolved).toContain('שלום');
      expect(resolved).toContain('קישור');
      expect(resolved).toContain('href="https://example.com/path/to/file.pdf"');
    });

    it('should handle empty attributes', () => {
      const html = '<a href="">Empty</a><img src="" alt="Empty">';
      const resolved = resolveAllUrls(html, baseUrl);
      // Empty URLs should be skipped
      expect(resolved).toContain('href=""');
      expect(resolved).toContain('src=""');
    });
  });
});
