/**
 * Resource Downloader Tests
 */

import axios from 'axios';
import { downloadResource, downloadResources, downloadFromUrl } from '../resource-downloader';
import { ParsedResource, ResourceType } from '@/types/parser';
import { DownloadError } from '../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Resource Downloader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('downloadResource', () => {
    const mockResource: ParsedResource = {
      url: 'https://example.com/file.pdf',
      normalizedUrl: 'https://example.com/file.pdf',
      type: ResourceType.PDF,
      extension: '.pdf',
      element: {
        tag: 'a',
        attribute: 'href',
        outerHTML: '<a href="file.pdf">Download</a>',
      },
      isExternal: true,
    };

    it('should download a resource successfully', async () => {
      const mockData = Buffer.from('PDF content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: {
          'content-type': 'application/pdf',
        },
        status: 200,
      });

      const result = await downloadResource(mockResource);

      expect(result).toBeDefined();
      expect(result.filename).toBe('file.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.size).toBe(mockData.length);
      expect(result.originalResource).toBe(mockResource);
      expect(Buffer.from(result.buffer)).toEqual(mockData);
    });

    it('should generate filename from URL', async () => {
      const resource: ParsedResource = {
        ...mockResource,
        normalizedUrl: 'https://example.com/path/to/document.pdf?query=123',
      };

      const mockData = Buffer.from('PDF content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: { 'content-type': 'application/pdf' },
        status: 200,
      });

      const result = await downloadResource(resource);

      expect(result.filename).toBe('document.pdf');
    });

    it('should use hash-based filename for URLs without filename', async () => {
      const resource: ParsedResource = {
        ...mockResource,
        normalizedUrl: 'https://example.com/?id=123', // No filename in path
        extension: '.pdf',
      };

      const mockData = Buffer.from('PDF content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: { 'content-type': 'application/pdf' },
        status: 200,
      });

      const result = await downloadResource(resource);

      expect(result.filename).toMatch(/^resource_[a-f0-9]{32}\.pdf$/);
    });

    it('should calculate hash when requested', async () => {
      const mockData = Buffer.from('PDF content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: { 'content-type': 'application/pdf' },
        status: 200,
      });

      const result = await downloadResource(mockResource, { calculateHash: true });

      expect(result.hash).toBeDefined();
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('should not calculate hash by default', async () => {
      const mockData = Buffer.from('PDF content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: { 'content-type': 'application/pdf' },
        status: 200,
      });

      const result = await downloadResource(mockResource);

      expect(result.hash).toBeUndefined();
    });

    it('should use default MIME type if not provided', async () => {
      const mockData = Buffer.from('Content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: {},
        status: 200,
      });

      const result = await downloadResource(mockResource);

      expect(result.mimeType).toBe('application/octet-stream');
    });

    it('should throw DownloadError on network failure', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        request: {},
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      await expect(downloadResource(mockResource, { maxRetries: 0 })).rejects.toThrow(
        DownloadError
      );
    });

    it('should throw DownloadError on HTTP error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 404,
          data: 'Not found',
        },
        message: 'Request failed with status code 404',
      });

      await expect(downloadResource(mockResource, { maxRetries: 0 })).rejects.toThrow(
        DownloadError
      );
    });

    it('should throw DownloadError on timeout', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        request: {},
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(downloadResource(mockResource, { maxRetries: 0 })).rejects.toThrow(
        DownloadError
      );
    });

    it('should retry on retryable errors', async () => {
      // First two attempts fail, third succeeds
      mockedAxios.get
        .mockRejectedValueOnce({
          isAxiosError: true,
          response: { status: 503 },
          message: 'Service Unavailable',
        })
        .mockRejectedValueOnce({
          isAxiosError: true,
          response: { status: 500 },
          message: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          data: Buffer.from('Success'),
          headers: { 'content-type': 'application/pdf' },
          status: 200,
        });

      const result = await downloadResource(mockResource, {
        maxRetries: 3,
        retryDelay: 10, // Short delay for testing
      });

      expect(result).toBeDefined();
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      // Clear any previous calls
      jest.clearAllMocks();

      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 },
        message: 'Not Found',
      });

      await expect(
        downloadResource(mockResource, {
          maxRetries: 3,
          retryDelay: 10,
        })
      ).rejects.toThrow(DownloadError);

      // Should only be called once (no retries for 404)
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should respect timeout option', async () => {
      const mockData = Buffer.from('Content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: {},
        status: 200,
      });

      await downloadResource(mockResource, { timeout: 5000 });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });

    it('should respect maxFileSize option', async () => {
      const mockData = Buffer.from('Content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: {},
        status: 200,
      });

      await downloadResource(mockResource, { maxFileSize: 1024 * 1024 });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxContentLength: 1024 * 1024,
        })
      );
    });

    it('should include custom headers', async () => {
      const mockData = Buffer.from('Content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: {},
        status: 200,
      });

      await downloadResource(mockResource, {
        headers: {
          Authorization: 'Bearer token',
        },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );
    });
  });

  describe('downloadResources', () => {
    const mockResources: ParsedResource[] = [
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
        url: 'file3.pdf',
        normalizedUrl: 'https://example.com/file3.pdf',
        type: ResourceType.PDF,
        extension: '.pdf',
        element: { tag: 'a', attribute: 'href', outerHTML: '' },
        isExternal: true,
      },
    ];

    it('should download multiple resources successfully', async () => {
      // Mock successful downloads
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from('Content'),
        headers: { 'content-type': 'application/pdf' },
        status: 200,
      });

      const result = await downloadResources(mockResources);

      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
    });

    it('should handle mixed success and failure', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: Buffer.from('Content 1'),
          headers: { 'content-type': 'application/pdf' },
          status: 200,
        })
        .mockRejectedValueOnce({
          isAxiosError: true,
          response: { status: 404 },
          message: 'Not Found',
        })
        .mockResolvedValueOnce({
          data: Buffer.from('Content 3'),
          headers: { 'content-type': 'application/pdf' },
          status: 200,
        });

      const result = await downloadResources(mockResources, { maxRetries: 0 });

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.failed[0]?.resource.normalizedUrl).toBe('https://example.com/file2.pdf');
    });

    it('should respect concurrency limit', async () => {
      let concurrentCalls = 0;
      let maxConcurrent = 0;

      mockedAxios.get.mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCalls);

        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));

        concurrentCalls--;

        return {
          data: Buffer.from('Content'),
          headers: { 'content-type': 'application/pdf' },
          status: 200,
        };
      });

      await downloadResources(mockResources, { concurrency: 2 });

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should call progress callback', async () => {
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from('Content'),
        headers: { 'content-type': 'application/pdf' },
        status: 200,
      });

      const progressUpdates: number[] = [];
      await downloadResources(mockResources, {
        onProgress: (progress) => {
          progressUpdates.push(progress.percentComplete);
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it('should call completion callback for each download', async () => {
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from('Content'),
        headers: { 'content-type': 'application/pdf' },
        status: 200,
      });

      const completedResources: string[] = [];
      await downloadResources(mockResources, {
        onDownloadComplete: (result) => {
          completedResources.push(result.originalResource.normalizedUrl);
        },
      });

      expect(completedResources).toHaveLength(3);
    });

    it('should call failure callback for failed downloads', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: Buffer.from('Content'),
          headers: { 'content-type': 'application/pdf' },
          status: 200,
        })
        .mockRejectedValueOnce({
          isAxiosError: true,
          response: { status: 404 },
          message: 'Not Found',
        })
        .mockResolvedValueOnce({
          data: Buffer.from('Content'),
          headers: { 'content-type': 'application/pdf' },
          status: 200,
        });

      const failures: string[] = [];
      await downloadResources(mockResources, {
        maxRetries: 0,
        onDownloadFail: (failure) => {
          failures.push(failure.resource.normalizedUrl);
        },
      });

      expect(failures).toHaveLength(1);
      expect(failures[0]).toBe('https://example.com/file2.pdf');
    });

    it('should calculate total size correctly', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: Buffer.from('A'.repeat(100)),
          headers: { 'content-type': 'application/pdf' },
          status: 200,
        })
        .mockResolvedValueOnce({
          data: Buffer.from('B'.repeat(200)),
          headers: { 'content-type': 'application/pdf' },
          status: 200,
        })
        .mockResolvedValueOnce({
          data: Buffer.from('C'.repeat(300)),
          headers: { 'content-type': 'application/pdf' },
          status: 200,
        });

      const result = await downloadResources(mockResources);

      expect(result.summary.totalSize).toBe(600);
    });

    it('should handle empty resources array', async () => {
      const result = await downloadResources([]);

      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.total).toBe(0);
    });
  });

  describe('downloadFromUrl', () => {
    it('should download from URL string', async () => {
      const mockData = Buffer.from('Content');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        headers: { 'content-type': 'application/pdf' },
        status: 200,
      });

      const result = await downloadFromUrl('https://example.com/file.pdf');

      expect(result).toBeDefined();
      expect(result.originalResource.normalizedUrl).toBe('https://example.com/file.pdf');
    });
  });
});
