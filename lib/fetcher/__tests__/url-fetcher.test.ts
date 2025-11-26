/**
 * URL Fetcher Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { fetchAndResolveHtml, fetchHtml, isUrlReachable } from '../url-fetcher';
import { FetchError } from '@/types/fetcher';

// Mock axios
jest.mock('axios');

describe('fetchAndResolveHtml', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('successful fetches', () => {
    it('should fetch and resolve HTML from URL', async () => {
      const url = 'https://example.com/path/page.html';
      const html = '<a href="../file.pdf">Link</a>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url);

      expect(result.html).toBe(html);
      expect(result.baseUrl).toBe('https://example.com/path/');
      expect(result.resolvedHtml).toContain('href="https://example.com/file.pdf"');
      expect(result.sourceUrl).toBe(url);
      expect(result.fetchedAt).toBeInstanceOf(Date);
    });

    it('should handle S3 newsletter URLs', async () => {
      const url = 'https://merkos-living.s3.us-west-2.amazonaws.com/Email85/48KiSavo1.html';
      const html = '<img src="../basics/Banner.png" alt="Banner">';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url);

      expect(result.baseUrl).toBe('https://merkos-living.s3.us-west-2.amazonaws.com/Email85/');
      expect(result.resolvedHtml).toContain(
        'src="https://merkos-living.s3.us-west-2.amazonaws.com/basics/Banner.png"'
      );
    });

    it('should handle merkos302.com URLs', async () => {
      const url = 'https://merkos302.com/living/newsletter.html';
      const html = '<a href="file.pdf">Download</a>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url);

      expect(result.baseUrl).toBe('https://merkos302.com/living/');
      expect(result.resolvedHtml).toContain('href="https://merkos302.com/living/file.pdf"');
    });

    it('should accept XHTML content type', async () => {
      const url = 'https://example.com/page.xhtml';
      const html = '<div>Content</div>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'application/xhtml+xml' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url);

      expect(result.html).toBe(html);
    });

    it('should skip URL resolution when resolveUrls is false', async () => {
      const url = 'https://example.com/page.html';
      const html = '<a href="../file.pdf">Link</a>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url, { resolveUrls: false });

      expect(result.resolvedHtml).toBe(html);
      expect(result.resolvedHtml).toContain('href="../file.pdf"');
    });

    it('should use custom headers', async () => {
      const url = 'https://example.com/page.html';
      const html = '<div>Content</div>';
      const customHeaders = { Authorization: 'Bearer token' };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      await fetchAndResolveHtml(url, { headers: customHeaders });

      expect(axios.get as jest.Mock).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          headers: expect.objectContaining(customHeaders),
        })
      );
    });

    it('should use custom timeout', async () => {
      const url = 'https://example.com/page.html';
      const html = '<div>Content</div>';
      const timeout = 60000;

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      await fetchAndResolveHtml(url, { timeout });

      expect(axios.get as jest.Mock).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ timeout })
      );
    });
  });

  describe('URL validation', () => {
    it('should reject invalid URL format', async () => {
      await expect(fetchAndResolveHtml('not a url')).rejects.toThrow(FetchError);
    });

    it('should reject non-http protocols', async () => {
      await expect(fetchAndResolveHtml('ftp://example.com/file.html')).rejects.toThrow(FetchError);
    });

    it('should accept http protocol', async () => {
      const url = 'http://example.com/page.html';
      const html = '<div>Content</div>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url);
      expect(result.html).toBe(html);
    });

    it('should accept https protocol', async () => {
      const url = 'https://example.com/page.html';
      const html = '<div>Content</div>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url);
      expect(result.html).toBe(html);
    });
  });

  describe('content type validation', () => {
    it('should reject non-HTML content type', async () => {
      const url = 'https://example.com/file.pdf';

      const mockResponse = {
        data: 'PDF content',
        status: 200,
        headers: { 'content-type': 'application/pdf' },
        statusText: 'OK',
        config: {} as any,
      };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(/did not return HTML/);
    });

    it('should reject empty HTML', async () => {
      const url = 'https://example.com/page.html';

      const mockResponse = {
        data: '',
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(/URL returned invalid HTML content/);
    });

    it('should reject whitespace-only HTML', async () => {
      const url = 'https://example.com/page.html';

      const mockResponse = {
        data: '   \n\t  ',
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(/URL returned empty HTML content/);
    });
  });

  describe('network errors', () => {
    it('should handle HTTP error status', async () => {
      const url = 'https://example.com/page.html';

      const mockError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: 'Not Found',
          headers: {},
        },
        message: 'Request failed with status code 404',
      };
      (axios.get as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(/HTTP 404/);
    });

    it('should handle timeout error', async () => {
      const url = 'https://example.com/page.html';

      const mockError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        request: {},
        message: 'timeout of 30000ms exceeded',
      };
      (axios.get as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(/timeout/);
    });

    it('should handle DNS lookup failure', async () => {
      const url = 'https://nonexistent-domain-12345.com/page.html';

      const mockError = {
        isAxiosError: true,
        code: 'ENOTFOUND',
        request: {},
        message: 'getaddrinfo ENOTFOUND nonexistent-domain-12345.com',
      };
      (axios.get as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(/DNS lookup failed/);
    });

    it('should handle connection refused', async () => {
      const url = 'https://example.com/page.html';

      const mockError = {
        isAxiosError: true,
        code: 'ECONNREFUSED',
        request: {},
        message: 'connect ECONNREFUSED 127.0.0.1:80',
      };
      (axios.get as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(/Connection refused/);
    });

    it('should handle generic network error', async () => {
      const url = 'https://example.com/page.html';

      const mockError = {
        isAxiosError: true,
        code: 'ECONNRESET',
        request: {},
        message: 'socket hang up',
      };
      (axios.get as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(/Network error/);
    });

    it('should handle unexpected error', async () => {
      const url = 'https://example.com/page.html';

      (axios.get as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(/Unexpected error/);
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with query parameters', async () => {
      const url = 'https://example.com/page.html?v=123';
      const html = '<div>Content</div>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url);
      expect(result.baseUrl).toBe('https://example.com/');
    });

    it('should handle URLs with hash', async () => {
      const url = 'https://example.com/page.html#section';
      const html = '<div>Content</div>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url);
      expect(result.baseUrl).toBe('https://example.com/');
    });

    it('should handle URLs with encoded spaces', async () => {
      const url = 'https://example.com/my%20page.html';
      const html = '<div>Content</div>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      const result = await fetchAndResolveHtml(url);
      expect(result.html).toBe(html);
    });

    it('should handle missing content-type header', async () => {
      const url = 'https://example.com/page.html';
      const html = '<div>Content</div>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: {},
        statusText: 'OK',
        config: {} as any,
      });

      // Should fail because content-type is missing
      await expect(fetchAndResolveHtml(url)).rejects.toThrow(FetchError);
    });

    it('should handle redirect options', async () => {
      const url = 'https://example.com/page.html';
      const html = '<div>Content</div>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      await fetchAndResolveHtml(url, { followRedirects: false });

      expect(axios.get as jest.Mock).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ maxRedirects: 0 })
      );
    });

    it('should handle custom max redirects', async () => {
      const url = 'https://example.com/page.html';
      const html = '<div>Content</div>';

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: html,
        status: 200,
        headers: { 'content-type': 'text/html' },
        statusText: 'OK',
        config: {} as any,
      });

      await fetchAndResolveHtml(url, { maxRedirects: 10 });

      expect(axios.get as jest.Mock).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ maxRedirects: 10 })
      );
    });
  });
});

describe('fetchHtml', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch HTML without resolving URLs', async () => {
    const url = 'https://example.com/page.html';
    const html = '<a href="../file.pdf">Link</a>';

    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: html,
      status: 200,
      headers: { 'content-type': 'text/html' },
      statusText: 'OK',
      config: {} as any,
    });

    const result = await fetchHtml(url);

    expect(result).toBe(html);
    expect(result).toContain('href="../file.pdf"');
  });

  it('should pass options to fetchAndResolveHtml', async () => {
    const url = 'https://example.com/page.html';
    const html = '<div>Content</div>';
    const timeout = 60000;

    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: html,
      status: 200,
      headers: { 'content-type': 'text/html' },
      statusText: 'OK',
      config: {} as any,
    });

    await fetchHtml(url, { timeout });

    expect(axios.get as jest.Mock).toHaveBeenCalledWith(url, expect.objectContaining({ timeout }));
  });
});

describe('isUrlReachable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for reachable URL', async () => {
    const url = 'https://example.com/page.html';
    const html = '<div>Content</div>';

    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: html,
      status: 200,
      headers: { 'content-type': 'text/html' },
      statusText: 'OK',
      config: {} as any,
    });

    const result = await isUrlReachable(url);

    expect(result).toBe(true);
  });

  it('should return false for unreachable URL', async () => {
    const url = 'https://example.com/page.html';

    (axios.get as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 404,
        data: 'Not Found',
        headers: {},
      },
      message: 'Request failed with status code 404',
    });

    const result = await isUrlReachable(url);

    expect(result).toBe(false);
  });

  it('should use shorter timeout by default', async () => {
    const url = 'https://example.com/page.html';

    (axios.get as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      code: 'ECONNABORTED',
      request: {},
      message: 'timeout of 10000ms exceeded',
    });

    await isUrlReachable(url);

    expect(axios.get as jest.Mock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ timeout: 10000 })
    );
  });

  it('should allow custom timeout', async () => {
    const url = 'https://example.com/page.html';

    (axios.get as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      code: 'ECONNABORTED',
      request: {},
      message: 'timeout exceeded',
    });

    await isUrlReachable(url, { timeout: 5000 });

    expect(axios.get as jest.Mock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ timeout: 5000 })
    );
  });
});
