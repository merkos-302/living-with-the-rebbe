/**
 * File Converter Tests
 *
 * Tests for file conversion utilities
 */

import {
  arrayBufferToFile,
  filesToFileList,
  validateFile,
  formatBytes,
  extractFilename,
  sanitizeFilename,
  makeUniqueFilename,
  blobToArrayBuffer,
  dataUrlToFile,
} from '../file-converter';

describe('File Converter', () => {
  describe('arrayBufferToFile', () => {
    it('should convert ArrayBuffer to File', () => {
      const buffer = new ArrayBuffer(1024);
      const file = arrayBufferToFile(buffer, 'test.pdf', 'application/pdf');

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('test.pdf');
      expect(file.type).toBe('application/pdf');
      expect(file.size).toBe(1024);
    });

    it('should preserve file data', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const file = arrayBufferToFile(buffer, 'data.bin', 'application/octet-stream');

      expect(file.size).toBe(5);
    });

    it('should handle empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      const file = arrayBufferToFile(buffer, 'empty.txt', 'text/plain');

      expect(file.size).toBe(0);
    });
  });

  describe('filesToFileList', () => {
    it('should convert File array to FileList-like object', () => {
      const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
      const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });

      const fileList = filesToFileList([file1, file2]);

      expect(fileList.length).toBe(2);
      // Note: In Node.js/Jest, DataTransfer is not available, so we get File[] fallback
      // Both FileList and File[] support index access
      expect(fileList[0]).toBe(file1);
      expect(fileList[1]).toBe(file2);
      // .item() is only available on native FileList, not on File[] fallback
      if ('item' in fileList && typeof fileList.item === 'function') {
        expect(fileList.item(0)).toBe(file1);
        expect(fileList.item(1)).toBe(file2);
      }
    });

    it('should handle empty array', () => {
      const fileList = filesToFileList([]);

      expect(fileList.length).toBe(0);
      // In Jest/Node.js, we get File[] which uses undefined for out-of-bounds
      // Native FileList.item() returns null for out-of-bounds
      expect(fileList[0]).toBeUndefined();
    });

    it('should support iteration', () => {
      const file1 = new File(['content1'], 'file1.txt');
      const file2 = new File(['content2'], 'file2.txt');
      const fileList = filesToFileList([file1, file2]);

      const files = [...fileList];
      expect(files).toEqual([file1, file2]);
    });
  });

  describe('validateFile', () => {
    it('should validate normal file', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty file', () => {
      const file = new File([], 'empty.txt');
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File is empty');
    });

    it('should reject file exceeding max size', () => {
      const largeContent = new Array(1024 * 1024 + 1).fill('a').join('');
      const file = new File([largeContent], 'large.txt');
      const result = validateFile(file, 1024 * 1024); // 1MB max

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should accept file at max size', () => {
      const content = new Array(1024).fill('a').join('');
      const file = new File([content], 'exact.txt');
      const result = validateFile(file, 1024);

      expect(result.valid).toBe(true);
    });

    it('should use default max size of 50MB', () => {
      const file = new File(['content'], 'test.txt');
      const result = validateFile(file);

      expect(result.valid).toBe(true);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1536 * 1024)).toBe('1.5 MB');
    });

    it('should handle different decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 3)).toBe('1.5 KB');
    });

    it('should handle large numbers', () => {
      const terabyte = 1024 * 1024 * 1024 * 1024;
      expect(formatBytes(terabyte)).toBe('1 TB');
    });
  });

  describe('extractFilename', () => {
    it('should extract filename from URL', () => {
      const url = 'https://example.com/path/to/document.pdf';
      expect(extractFilename(url)).toBe('document.pdf');
    });

    it('should handle URL with query parameters', () => {
      const url = 'https://example.com/file.pdf?version=1&token=abc';
      expect(extractFilename(url)).toBe('file.pdf');
    });

    it('should decode URL-encoded filenames', () => {
      const url = 'https://example.com/my%20document.pdf';
      expect(extractFilename(url)).toBe('my document.pdf');
    });

    it('should handle simple paths', () => {
      const path = '/path/to/file.txt';
      expect(extractFilename(path)).toBe('file.txt');
    });

    it('should generate filename if extraction fails', () => {
      const url = 'https://example.com/';
      const filename = extractFilename(url);

      expect(filename).toMatch(/^resource_\d+$/);
    });

    it('should handle URLs ending with slash', () => {
      const url = 'https://example.com/path/';
      const filename = extractFilename(url);

      expect(filename).toMatch(/^resource_\d+$/);
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace unsafe characters', () => {
      const unsafe = 'file<>:"/\\|?*.txt';
      const safe = sanitizeFilename(unsafe);

      expect(safe).toBe('file_.txt');
    });

    it('should replace spaces with underscores', () => {
      expect(sanitizeFilename('my file name.txt')).toBe('my_file_name.txt');
    });

    it('should remove multiple consecutive underscores', () => {
      expect(sanitizeFilename('file___name.txt')).toBe('file_name.txt');
    });

    it('should remove leading/trailing underscores', () => {
      expect(sanitizeFilename('_file_.txt')).toBe('file_.txt');
    });

    it('should handle empty filename', () => {
      expect(sanitizeFilename('')).toBe('file');
    });

    it('should handle only unsafe characters', () => {
      expect(sanitizeFilename('***')).toBe('file');
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const sanitized = sanitizeFilename(longName);

      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized).toMatch(/\.txt$/);
    });
  });

  describe('makeUniqueFilename', () => {
    it('should add timestamp to filename', () => {
      const filename = makeUniqueFilename('document.pdf');

      expect(filename).toMatch(/^document_\d+\.pdf$/);
    });

    it('should handle filename without extension', () => {
      const filename = makeUniqueFilename('document');

      expect(filename).toMatch(/^document_\d+$/);
    });

    it('should preserve multiple dots', () => {
      const filename = makeUniqueFilename('my.archive.tar.gz');

      expect(filename).toMatch(/^my\.archive\.tar_\d+\.gz$/);
    });

    it('should create different timestamps for sequential calls', (done) => {
      const filename1 = makeUniqueFilename('file.txt');

      setTimeout(() => {
        const filename2 = makeUniqueFilename('file.txt');
        expect(filename1).not.toBe(filename2);
        done();
      }, 10);
    });
  });

  describe('blobToArrayBuffer', () => {
    it('should convert Blob to ArrayBuffer', async () => {
      const content = 'test content';
      const blob = new Blob([content], { type: 'text/plain' });

      const buffer = await blobToArrayBuffer(blob);

      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThan(0);

      // Verify content
      const text = new TextDecoder().decode(buffer);
      expect(text).toBe(content);
    });

    it('should preserve binary data', async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const blob = new Blob([data]);

      const buffer = await blobToArrayBuffer(blob);
      const result = new Uint8Array(buffer);

      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty blob', async () => {
      const blob = new Blob([]);
      const buffer = await blobToArrayBuffer(blob);

      expect(buffer.byteLength).toBe(0);
    });
  });

  describe('dataUrlToFile', () => {
    it('should convert data URL to File', () => {
      const dataUrl = 'data:text/plain;base64,SGVsbG8gV29ybGQ='; // "Hello World"
      const file = dataUrlToFile(dataUrl, 'test.txt');

      expect(file).toBeInstanceOf(File);
      expect(file?.name).toBe('test.txt');
      expect(file?.type).toBe('text/plain');
    });

    it('should handle image data URL', () => {
      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const file = dataUrlToFile(dataUrl, 'pixel.png');

      expect(file).toBeInstanceOf(File);
      expect(file?.type).toBe('image/png');
    });

    it('should return null for invalid data URL', () => {
      const file = dataUrlToFile('invalid-data-url', 'test.txt');

      expect(file).toBeNull();
    });

    it('should handle data URL without mime type', () => {
      const dataUrl = 'data:;base64,dGVzdA=='; // "test"
      const file = dataUrlToFile(dataUrl, 'test.bin');

      expect(file).toBeInstanceOf(File);
      expect(file?.type).toBe('application/octet-stream');
    });
  });
});
