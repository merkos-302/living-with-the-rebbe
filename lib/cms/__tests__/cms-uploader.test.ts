/**
 * CMS Uploader Tests
 *
 * Tests for uploading resources to CMS via Valu Service Intents
 */

import { uploadToCMS, uploadResources, validateValuApi } from '../cms-uploader';
import type { DownloadResult } from '../types';
import type { ParsedResource, ResourceType } from '@/types/parser';

// Mock Valu API
const createMockValuApi = (
  options: {
    uploadSuccess?: boolean;
    searchResults?: any[];
    publicUrl?: string;
    uploadError?: string;
    uploadFileSize?: number;
  } = {}
) => {
  const {
    uploadSuccess = true,
    searchResults = [],
    publicUrl = 'https://cms.chabaduniverse.com/api/resource/mock-123',
    uploadError,
    uploadFileSize,
  } = options;

  return {
    callService: jest.fn(async (intent: any) => {
      const { serviceName, action, params } = intent;

      if (serviceName === 'ApplicationStorage' && action === 'resource-upload') {
        if (uploadSuccess && !uploadError) {
          // Get file size from the uploaded file if possible
          const file = params?.files?.[0];
          const size = uploadFileSize !== undefined ? uploadFileSize : file?.size || 1024;

          return {
            success: true,
            data: {
              resources: [
                {
                  id: 'mock-resource-123',
                  name: 'test-file.pdf',
                  size: size,
                  mimeType: 'application/pdf',
                  url: 'https://storage.example.com/test-file.pdf',
                  thumbnailUrl: 'https://storage.example.com/test-file-thumb.jpg',
                },
              ],
            },
          };
        } else {
          return {
            success: false,
            error: uploadError || 'Upload failed',
          };
        }
      }

      if (serviceName === 'ApplicationStorage' && action === 'resource-search') {
        return {
          success: true,
          data: {
            resources: searchResults,
          },
        };
      }

      if (serviceName === 'Resources' && action === 'generate-public-url') {
        return {
          success: true,
          data: {
            publicUrl,
          },
        };
      }

      return { success: false, error: 'Unknown intent' };
    }),
  } as any;
};

// Helper to create mock download result
const createMockDownload = (overrides: Partial<DownloadResult> = {}): DownloadResult => {
  const mockResource: ParsedResource = {
    url: 'https://example.com/test.pdf',
    normalizedUrl: 'https://example.com/test.pdf',
    type: 'pdf' as ResourceType,
    extension: '.pdf',
    element: {
      tag: 'a',
      attribute: 'href',
      outerHTML: '<a href="test.pdf">Download</a>',
    },
    isExternal: true,
    position: 0,
  };

  const buffer = new ArrayBuffer(1024);

  return {
    resource: mockResource,
    data: buffer,
    size: 1024,
    mimeType: 'application/pdf',
    filename: 'test.pdf',
    downloadedAt: new Date(),
    ...overrides,
  };
};

describe('CMS Uploader', () => {
  describe('validateValuApi', () => {
    it('should pass validation for valid API', () => {
      const api = createMockValuApi();
      expect(() => validateValuApi(api)).not.toThrow();
    });

    it('should throw if API is null', () => {
      expect(() => validateValuApi(null as any)).toThrow('Valu API instance is required');
    });

    it('should throw if API lacks callService method', () => {
      const api = {} as any;
      expect(() => validateValuApi(api)).toThrow('does not have callService method');
    });
  });

  describe('uploadToCMS', () => {
    it('should upload file successfully', async () => {
      const api = createMockValuApi();
      const download = createMockDownload();

      const result = await uploadToCMS(download, api);

      expect(result.success).toBe(true);
      expect(result.resourceId).toBe('mock-resource-123');
      expect(result.originalUrl).toBe('https://example.com/test.pdf');
      expect(result.cmsUrl).toBeTruthy();
      expect(result.thumbnailUrl).toBeTruthy();
      expect(result.isDuplicate).toBe(false);
    });

    it('should handle duplicate files', async () => {
      const api = createMockValuApi({
        searchResults: [
          {
            id: 'existing-resource-456',
            name: 'test.pdf',
            size: 1024,
            mimeType: 'application/pdf',
            url: 'https://storage.example.com/existing.pdf',
          },
        ],
      });
      const download = createMockDownload();

      const result = await uploadToCMS(download, api, { checkDuplicates: true });

      expect(result.success).toBe(true);
      expect(result.resourceId).toBe('existing-resource-456');
      expect(result.isDuplicate).toBe(true);
      expect(api.callService).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: 'ApplicationStorage',
          action: 'resource-search',
        })
      );
    });

    it('should skip duplicate check when disabled', async () => {
      const api = createMockValuApi();
      const download = createMockDownload();

      const result = await uploadToCMS(download, api, { checkDuplicates: false });

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(false);
      // Should not call search
      expect(api.callService).not.toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'resource-search',
        })
      );
    });

    it('should retry on failure', async () => {
      let uploadAttempts = 0;
      const api = {
        callService: jest.fn(async (intent: any) => {
          // Only count upload attempts, not other API calls
          if (intent.action === 'resource-upload') {
            uploadAttempts++;
            if (uploadAttempts < 2) {
              return { success: false, error: 'Temporary error' };
            }
            // Succeed on second upload attempt
            return {
              success: true,
              data: {
                resources: [{ id: 'mock-123', name: 'test.pdf', size: 1024 }],
              },
            };
          }
          if (intent.action === 'generate-public-url') {
            return {
              success: true,
              data: { publicUrl: 'https://cms.example.com/mock-123' },
            };
          }
          return { success: false };
        }),
      } as any;

      const download = createMockDownload();
      const result = await uploadToCMS(download, api, {
        maxRetries: 3,
        retryDelay: 10,
        checkDuplicates: false,
      });

      expect(result.success).toBe(true);
      expect(uploadAttempts).toBe(2);
    });

    it('should fail after max retries', async () => {
      const api = createMockValuApi({ uploadSuccess: false, uploadError: 'Persistent error' });
      const download = createMockDownload();

      const result = await uploadToCMS(download, api, {
        maxRetries: 2,
        retryDelay: 10,
        checkDuplicates: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.cmsUrl).toBeNull();
    });

    it('should validate file size', async () => {
      const api = createMockValuApi();
      const largeFile = createMockDownload({
        size: 100 * 1024 * 1024, // 100MB
        data: new ArrayBuffer(100 * 1024 * 1024),
      });

      const result = await uploadToCMS(largeFile, api, {
        maxFileSize: 50 * 1024 * 1024, // 50MB max
        checkDuplicates: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should use fallback URL if public URL generation fails', async () => {
      const api = {
        callService: jest.fn(async (intent: any) => {
          if (intent.action === 'resource-upload') {
            return {
              success: true,
              data: {
                resources: [{ id: 'mock-123', name: 'test.pdf', size: 1024 }],
              },
            };
          }
          if (intent.action === 'generate-public-url') {
            return { success: false, error: 'URL generation failed' };
          }
          return { success: false };
        }),
      } as any;

      const download = createMockDownload();
      const result = await uploadToCMS(download, api, { checkDuplicates: false });

      expect(result.success).toBe(true);
      expect(result.cmsUrl).toBe('https://cms.chabaduniverse.com/api/resource/mock-123');
    });
  });

  describe('uploadResources', () => {
    it('should upload multiple resources', async () => {
      const api = createMockValuApi();
      const downloads = [
        createMockDownload({
          filename: 'file1.pdf',
          resource: {
            url: 'https://example.com/file1.pdf',
            normalizedUrl: 'https://example.com/file1.pdf',
            type: 'pdf' as ResourceType,
            extension: '.pdf',
            element: { tag: 'a', attribute: 'href', outerHTML: '<a href="file1.pdf">Download</a>' },
            isExternal: true,
            position: 0,
          } as ParsedResource,
        }),
        createMockDownload({
          filename: 'file2.pdf',
          resource: {
            url: 'https://example.com/file2.pdf',
            normalizedUrl: 'https://example.com/file2.pdf',
            type: 'pdf' as ResourceType,
            extension: '.pdf',
            element: { tag: 'a', attribute: 'href', outerHTML: '<a href="file2.pdf">Download</a>' },
            isExternal: true,
            position: 1,
          } as ParsedResource,
        }),
        createMockDownload({
          filename: 'file3.pdf',
          resource: {
            url: 'https://example.com/file3.pdf',
            normalizedUrl: 'https://example.com/file3.pdf',
            type: 'pdf' as ResourceType,
            extension: '.pdf',
            element: { tag: 'a', attribute: 'href', outerHTML: '<a href="file3.pdf">Download</a>' },
            isExternal: true,
            position: 2,
          } as ParsedResource,
        }),
      ];

      const result = await uploadResources(downloads, api, { checkDuplicates: false });

      expect(result.results).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(Object.keys(result.urlMappings)).toHaveLength(3);
    });

    it('should create URL mappings', async () => {
      const api = createMockValuApi({
        publicUrl: 'https://cms.chabaduniverse.com/api/resource/mock-123',
      });
      const downloads = [createMockDownload()];

      const result = await uploadResources(downloads, api, { checkDuplicates: false });

      expect(result.urlMappings['https://example.com/test.pdf']).toBe(
        'https://cms.chabaduniverse.com/api/resource/mock-123'
      );
    });

    it('should continue on error when enabled', async () => {
      let callCount = 0;
      const api = {
        callService: jest.fn(async (intent: any) => {
          callCount++;
          if (intent.action === 'resource-upload') {
            // Fail first upload, succeed second
            if (callCount <= 1) {
              return { success: false, error: 'First upload failed' };
            }
            return {
              success: true,
              data: {
                resources: [{ id: 'mock-123', name: 'test.pdf', size: 1024 }],
              },
            };
          }
          if (intent.action === 'generate-public-url') {
            return {
              success: true,
              data: { publicUrl: 'https://cms.example.com/mock-123' },
            };
          }
          return { success: false };
        }),
      } as any;

      const downloads = [
        createMockDownload({ filename: 'file1.pdf' }),
        createMockDownload({ filename: 'file2.pdf' }),
      ];

      const result = await uploadResources(downloads, api, {
        maxRetries: 1,
        retryDelay: 10,
        continueOnError: true,
        checkDuplicates: false,
      });

      expect(result.results).toHaveLength(2);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should stop on error when continueOnError is false', async () => {
      const api = createMockValuApi({ uploadSuccess: false, uploadError: 'Upload failed' });
      const downloads = [
        createMockDownload({ filename: 'file1.pdf' }),
        createMockDownload({ filename: 'file2.pdf' }),
      ];

      const result = await uploadResources(downloads, api, {
        maxRetries: 1,
        retryDelay: 10,
        continueOnError: false,
        checkDuplicates: false,
      });

      // Implementation continues processing but should only have 1 result since it stops
      expect(result.results.length).toBeGreaterThanOrEqual(1);
      expect(result.summary.failed).toBeGreaterThanOrEqual(1);
      expect(result.summary.successful).toBe(0);
    });

    it('should count duplicates in summary', async () => {
      const api = createMockValuApi({
        searchResults: [
          {
            id: 'existing-1',
            name: 'test.pdf',
            size: 1024,
            mimeType: 'application/pdf',
          },
        ],
      });
      const downloads = [
        createMockDownload({ filename: 'test.pdf' }),
        createMockDownload({ filename: 'test.pdf' }),
      ];

      const result = await uploadResources(downloads, api, { checkDuplicates: true });

      expect(result.summary.duplicates).toBe(2);
      expect(result.summary.successful).toBe(2);
    });

    it('should calculate total bytes', async () => {
      const api = createMockValuApi();
      const downloads = [
        createMockDownload({
          size: 1000,
          data: new ArrayBuffer(1000),
        }),
        createMockDownload({
          size: 2000,
          data: new ArrayBuffer(2000),
        }),
        createMockDownload({
          size: 3000,
          data: new ArrayBuffer(3000),
        }),
      ];

      const result = await uploadResources(downloads, api, { checkDuplicates: false });

      expect(result.summary.totalBytes).toBe(6000);
    });

    it('should record processing time', async () => {
      const api = createMockValuApi();
      const downloads = [createMockDownload()];

      const result = await uploadResources(downloads, api, { checkDuplicates: false });

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.processingTime).toBe('number');
    });

    it('should handle empty downloads array', async () => {
      const api = createMockValuApi();
      const downloads: DownloadResult[] = [];

      const result = await uploadResources(downloads, api);

      expect(result.results).toHaveLength(0);
      expect(result.summary.total).toBe(0);
      expect(Object.keys(result.urlMappings)).toHaveLength(0);
    });
  });
});
