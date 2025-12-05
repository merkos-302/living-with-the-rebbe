/**
 * File Converter Utilities
 *
 * Utilities for converting between different file representations
 * (ArrayBuffer, Blob, File, FileList) needed for Valu API uploads.
 */

import { logger } from '@/utils/logger';

/**
 * Convert ArrayBuffer to File object
 *
 * @param buffer - The ArrayBuffer containing file data
 * @param filename - The filename for the File object
 * @param mimeType - The MIME type of the file
 * @returns File object ready for upload
 */
export function arrayBufferToFile(buffer: ArrayBuffer, filename: string, mimeType: string): File {
  logger.debug('Converting ArrayBuffer to File', {
    filename,
    mimeType,
    size: buffer.byteLength,
  });

  // Create a Blob from the ArrayBuffer
  const blob = new Blob([buffer], { type: mimeType });

  // Create a File from the Blob
  const file = new File([blob], filename, {
    type: mimeType,
    lastModified: Date.now(),
  });

  logger.debug('File conversion complete', {
    filename: file.name,
    size: file.size,
    type: file.type,
  });

  return file;
}

/**
 * Convert array of File objects to a format suitable for Valu API upload
 *
 * The Valu API expects files that can be serialized through postMessage.
 * File objects ARE clonable through the structured clone algorithm.
 *
 * We try DataTransfer API first (creates native FileList), but fall back
 * to returning the File array directly if that fails, since File[] is
 * also accepted by many APIs and is always serializable.
 *
 * @param files - Array of File objects
 * @returns FileList or File array suitable for postMessage
 */
export function filesToFileList(files: File[]): FileList | File[] {
  logger.debug('[filesToFileList v2] Converting files for upload', {
    fileCount: files.length,
    filenames: files.map((f) => f.name),
  });

  // Try DataTransfer API to create native FileList
  // This is the standard way to create FileList programmatically
  try {
    if (typeof DataTransfer !== 'undefined') {
      const dataTransfer = new DataTransfer();

      for (const file of files) {
        dataTransfer.items.add(file);
      }

      const fileList = dataTransfer.files;

      logger.debug('[filesToFileList v2] Created native FileList via DataTransfer', {
        length: fileList.length,
        isFileList: fileList instanceof FileList,
        constructor: fileList.constructor.name,
      });

      return fileList;
    }
  } catch (error) {
    logger.warn('[filesToFileList v2] DataTransfer failed, using File array', { error });
  }

  // Fallback: Return File array directly
  // File objects are serializable through postMessage
  logger.debug('[filesToFileList v2] Using File array fallback', {
    fileCount: files.length,
  });

  return files;
}

/**
 * Validate file before upload
 *
 * @param file - File to validate
 * @param maxSize - Maximum allowed file size in bytes (default: 50MB)
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: File,
  maxSize: number = 50 * 1024 * 1024
): { valid: boolean; error?: string } {
  logger.debug('Validating file', {
    filename: file.name,
    size: file.size,
    type: file.type,
    maxSize,
  });

  // Check if file is empty
  if (file.size === 0) {
    const error = 'File is empty';
    logger.warn('File validation failed', { filename: file.name, error });
    return { valid: false, error };
  }

  // Check file size
  if (file.size > maxSize) {
    const error = `File size (${formatBytes(file.size)}) exceeds maximum allowed size (${formatBytes(maxSize)})`;
    logger.warn('File validation failed', { filename: file.name, error });
    return { valid: false, error };
  }

  // Check if file has a name
  if (!file.name || file.name.trim().length === 0) {
    const error = 'File has no name';
    logger.warn('File validation failed', { error });
    return { valid: false, error };
  }

  logger.debug('File validation passed', { filename: file.name });
  return { valid: true };
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Extract filename from URL or path
 *
 * @param urlOrPath - URL or file path
 * @returns Extracted filename, or a generated name if extraction fails
 */
export function extractFilename(urlOrPath: string): string {
  try {
    // Try URL parsing first
    const url = new URL(urlOrPath);
    const pathname = url.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

    if (filename && filename.length > 0) {
      // Decode URL encoding
      return decodeURIComponent(filename);
    }
  } catch {
    // Not a valid URL, try as path
    const filename = urlOrPath.substring(urlOrPath.lastIndexOf('/') + 1);
    if (filename && filename.length > 0) {
      return decodeURIComponent(filename);
    }
  }

  // Generate a filename if extraction failed
  const timestamp = Date.now();
  return `resource_${timestamp}`;
}

/**
 * Sanitize filename for safe storage
 *
 * @param filename - Original filename
 * @returns Sanitized filename safe for file systems
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace unsafe characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Replace unsafe chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  // Ensure filename is not empty
  if (sanitized.length === 0) {
    sanitized = 'file';
  }

  // Ensure filename is not too long (max 255 chars for most filesystems)
  if (sanitized.length > 255) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, 255 - extension.length) + extension;
  }

  return sanitized;
}

/**
 * Generate unique filename by adding timestamp suffix if needed
 *
 * @param filename - Original filename
 * @returns Unique filename with timestamp suffix if needed
 */
export function makeUniqueFilename(filename: string): string {
  const timestamp = Date.now();
  const dotIndex = filename.lastIndexOf('.');

  if (dotIndex === -1) {
    // No extension
    return `${filename}_${timestamp}`;
  }

  // Insert timestamp before extension
  const name = filename.substring(0, dotIndex);
  const ext = filename.substring(dotIndex);
  return `${name}_${timestamp}${ext}`;
}

/**
 * Convert Blob to ArrayBuffer
 *
 * @param blob - Blob to convert
 * @returns Promise resolving to ArrayBuffer
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  logger.debug('Converting Blob to ArrayBuffer', {
    size: blob.size,
    type: blob.type,
  });

  // Use the modern arrayBuffer() method if available
  if (blob.arrayBuffer) {
    return await blob.arrayBuffer();
  }

  // Fallback for older browsers
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert Blob to ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Create a File object from a Data URL
 *
 * @param dataUrl - Data URL string (e.g., "data:image/png;base64,...")
 * @param filename - Filename for the File object
 * @returns File object or null if parsing fails
 */
export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    // Validate data URL format
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return null;
    }

    // Parse data URL
    const arr = dataUrl.split(',');
    if (arr.length < 2 || !arr[1]) {
      return null;
    }

    const mimeMatch = arr[0]?.match(/:(.*?);/);
    const mime = mimeMatch?.[1] || 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const blob = new Blob([u8arr], { type: mime });
    return new File([blob], filename, { type: mime });
  } catch (error) {
    logger.error('Failed to convert data URL to File', { error });
    return null;
  }
}
