/**
 * Tests for resource identification utilities
 */

import {
  identifyResourceType,
  validateUrl,
  isExternalUrl,
  shouldProcessResourceType,
  getResourceTypeDescription,
  getSupportedExtensions,
  getExtensionFromUrl,
} from '../resource-identifier';
import { ResourceType } from '@/types/parser';

describe('Resource Identifier', () => {
  describe('identifyResourceType', () => {
    it('should identify PDF from extension', () => {
      const result = identifyResourceType('https://example.com/file.pdf');

      expect(result.type).toBe(ResourceType.PDF);
      expect(result.extension).toBe('.pdf');
      expect(result.isExternal).toBe(true);
    });

    it('should identify images from extensions', () => {
      const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

      extensions.forEach((ext) => {
        const result = identifyResourceType(`https://example.com/image${ext}`);
        expect(result.type).toBe(ResourceType.IMAGE);
        expect(result.extension).toBe(ext);
      });
    });

    it('should identify documents from extensions', () => {
      const extensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

      extensions.forEach((ext) => {
        const result = identifyResourceType(`https://example.com/file${ext}`);
        expect(result.type).toBe(ResourceType.DOCUMENT);
        expect(result.extension).toBe(ext);
      });
    });

    it('should identify from MIME type when extension is missing', () => {
      const result = identifyResourceType(
        'https://example.com/download?file=123',
        'application/pdf'
      );

      expect(result.type).toBe(ResourceType.PDF);
      expect(result.mimeType).toBe('application/pdf');
    });

    it('should prefer MIME type over extension', () => {
      // URL says .jpg but MIME type says PDF
      const result = identifyResourceType('https://example.com/file.jpg', 'application/pdf');

      expect(result.type).toBe(ResourceType.PDF);
    });

    it('should infer type from URL path patterns', () => {
      const pdfUrl = 'https://example.com/pdf/download?id=123';
      const imageUrl = 'https://example.com/images/photo';

      expect(identifyResourceType(pdfUrl).type).toBe(ResourceType.PDF);
      expect(identifyResourceType(imageUrl).type).toBe(ResourceType.IMAGE);
    });

    it('should handle URLs with query parameters', () => {
      const result = identifyResourceType('https://example.com/file.pdf?version=2&download=true');

      expect(result.type).toBe(ResourceType.PDF);
      expect(result.extension).toBe('.pdf');
    });

    it('should handle URLs with hash fragments', () => {
      const result = identifyResourceType('https://example.com/file.pdf#page=5');

      expect(result.type).toBe(ResourceType.PDF);
      expect(result.extension).toBe('.pdf');
    });

    it('should return UNKNOWN for unrecognized types', () => {
      const result = identifyResourceType('https://example.com/file.xyz');

      expect(result.type).toBe(ResourceType.UNKNOWN);
    });

    it('should handle case-insensitive extensions', () => {
      const result = identifyResourceType('https://example.com/FILE.PDF');

      expect(result.type).toBe(ResourceType.PDF);
      expect(result.extension).toBe('.pdf');
    });
  });

  describe('getExtensionFromUrl', () => {
    it('should extract extension from simple URL', () => {
      expect(getExtensionFromUrl('https://example.com/file.pdf')).toBe('.pdf');
      expect(getExtensionFromUrl('https://example.com/image.jpg')).toBe('.jpg');
    });

    it('should handle URLs with query parameters', () => {
      expect(getExtensionFromUrl('https://example.com/file.pdf?download=true')).toBe('.pdf');
    });

    it('should handle URLs with hash fragments', () => {
      expect(getExtensionFromUrl('https://example.com/file.pdf#page=1')).toBe('.pdf');
    });

    it('should return empty string for URLs without extension', () => {
      expect(getExtensionFromUrl('https://example.com/file')).toBe('');
      expect(getExtensionFromUrl('https://example.com/')).toBe('');
    });

    it('should handle complex paths', () => {
      expect(getExtensionFromUrl('https://example.com/path/to/deep/file.docx')).toBe('.docx');
    });
  });

  describe('isExternalUrl', () => {
    it('should identify external HTTP URLs', () => {
      expect(isExternalUrl('http://example.com/file.pdf')).toBe(true);
      expect(isExternalUrl('https://example.com/file.pdf')).toBe(true);
    });

    it('should identify relative URLs as not external', () => {
      expect(isExternalUrl('/path/to/file.pdf')).toBe(false);
      expect(isExternalUrl('path/to/file.pdf')).toBe(false);
      expect(isExternalUrl('../file.pdf')).toBe(false);
    });

    it('should identify data URIs as not external', () => {
      expect(isExternalUrl('data:image/png;base64,ABC123')).toBe(false);
    });

    it('should handle empty URLs', () => {
      expect(isExternalUrl('')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate absolute URLs', () => {
      const result = validateUrl('https://example.com/file.pdf');

      expect(result.isValid).toBe(true);
      expect(result.isExternal).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/file.pdf');
      expect(result.errors).toEqual([]);
    });

    it('should validate data URIs', () => {
      const dataUri = 'data:image/png;base64,ABC123';
      const result = validateUrl(dataUri);

      expect(result.isValid).toBe(true);
      expect(result.isExternal).toBe(false);
      expect(result.normalizedUrl).toBe(dataUri);
    });

    it('should resolve relative URLs with base URL', () => {
      const result = validateUrl('/images/photo.jpg', 'https://example.com');

      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/images/photo.jpg');
    });

    it('should fail relative URLs without base URL', () => {
      const result = validateUrl('/images/photo.jpg');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle protocol-relative URLs', () => {
      const result = validateUrl('//example.com/file.pdf');

      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/file.pdf');
    });

    it('should reject empty URLs', () => {
      const result = validateUrl('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is empty');
    });

    it('should reject URLs that are too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      const result = validateUrl(longUrl);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('maximum length'))).toBe(true);
    });

    it('should handle malformed URLs', () => {
      const result = validateUrl('not a valid url');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('shouldProcessResourceType', () => {
    it('should process known resource types', () => {
      expect(shouldProcessResourceType(ResourceType.PDF)).toBe(true);
      expect(shouldProcessResourceType(ResourceType.IMAGE)).toBe(true);
      expect(shouldProcessResourceType(ResourceType.DOCUMENT)).toBe(true);
    });

    it('should not process unknown resource types', () => {
      expect(shouldProcessResourceType(ResourceType.UNKNOWN)).toBe(false);
    });
  });

  describe('getResourceTypeDescription', () => {
    it('should return readable descriptions', () => {
      expect(getResourceTypeDescription(ResourceType.PDF)).toBe('PDF Document');
      expect(getResourceTypeDescription(ResourceType.IMAGE)).toBe('Image');
      expect(getResourceTypeDescription(ResourceType.DOCUMENT)).toBe('Document');
      expect(getResourceTypeDescription(ResourceType.UNKNOWN)).toBe('Unknown Resource');
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return supported extensions for PDF', () => {
      const extensions = getSupportedExtensions(ResourceType.PDF);

      expect(extensions).toContain('.pdf');
    });

    it('should return supported extensions for images', () => {
      const extensions = getSupportedExtensions(ResourceType.IMAGE);

      expect(extensions).toContain('.jpg');
      expect(extensions).toContain('.png');
      expect(extensions).toContain('.gif');
    });

    it('should return supported extensions for documents', () => {
      const extensions = getSupportedExtensions(ResourceType.DOCUMENT);

      expect(extensions).toContain('.doc');
      expect(extensions).toContain('.docx');
      expect(extensions).toContain('.xls');
      expect(extensions).toContain('.xlsx');
    });
  });
});
