/**
 * Resource identification utilities
 * Determines resource types from URLs and validates external resources
 */

import { ResourceType, ResourceIdentification, URLValidation } from '@/types/parser';

/**
 * File extension to resource type mapping
 */
const EXTENSION_MAP: Record<string, ResourceType> = {
  // PDF documents
  '.pdf': ResourceType.PDF,

  // Images
  '.jpg': ResourceType.IMAGE,
  '.jpeg': ResourceType.IMAGE,
  '.png': ResourceType.IMAGE,
  '.gif': ResourceType.IMAGE,
  '.webp': ResourceType.IMAGE,
  '.svg': ResourceType.IMAGE,
  '.bmp': ResourceType.IMAGE,
  '.ico': ResourceType.IMAGE,

  // Documents
  '.doc': ResourceType.DOCUMENT,
  '.docx': ResourceType.DOCUMENT,
  '.xls': ResourceType.DOCUMENT,
  '.xlsx': ResourceType.DOCUMENT,
  '.ppt': ResourceType.DOCUMENT,
  '.pptx': ResourceType.DOCUMENT,
  '.odt': ResourceType.DOCUMENT,
  '.ods': ResourceType.DOCUMENT,
  '.odp': ResourceType.DOCUMENT,
  '.rtf': ResourceType.DOCUMENT,
  '.txt': ResourceType.DOCUMENT,
  '.csv': ResourceType.DOCUMENT,
};

/**
 * MIME type to resource type mapping
 */
const MIME_TYPE_MAP: Record<string, ResourceType> = {
  // PDF
  'application/pdf': ResourceType.PDF,

  // Images
  'image/jpeg': ResourceType.IMAGE,
  'image/png': ResourceType.IMAGE,
  'image/gif': ResourceType.IMAGE,
  'image/webp': ResourceType.IMAGE,
  'image/svg+xml': ResourceType.IMAGE,
  'image/bmp': ResourceType.IMAGE,

  // Documents
  'application/msword': ResourceType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ResourceType.DOCUMENT,
  'application/vnd.ms-excel': ResourceType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ResourceType.DOCUMENT,
  'application/vnd.ms-powerpoint': ResourceType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    ResourceType.DOCUMENT,
  'application/vnd.oasis.opendocument.text': ResourceType.DOCUMENT,
  'application/rtf': ResourceType.DOCUMENT,
  'text/plain': ResourceType.DOCUMENT,
  'text/csv': ResourceType.DOCUMENT,
};

/**
 * Identifies the resource type from a URL
 */
export function identifyResourceType(url: string, mimeType?: string): ResourceIdentification {
  // First try MIME type if provided
  if (mimeType) {
    const typeFromMime = MIME_TYPE_MAP[mimeType.toLowerCase()];
    if (typeFromMime) {
      const extension = getExtensionFromUrl(url);
      return {
        type: typeFromMime,
        extension: extension || getExtensionFromMimeType(mimeType),
        mimeType,
        isExternal: isExternalUrl(url),
      };
    }
  }

  // Try to extract extension from URL
  const extension = getExtensionFromUrl(url);
  if (extension) {
    const type = EXTENSION_MAP[extension.toLowerCase()];
    if (type) {
      return {
        type,
        extension,
        mimeType,
        isExternal: isExternalUrl(url),
      };
    }
  }

  // Check for common patterns in URL path
  const type = inferTypeFromPath(url);

  return {
    type: type || ResourceType.UNKNOWN,
    extension: extension || '',
    mimeType,
    isExternal: isExternalUrl(url),
  };
}

/**
 * Extracts file extension from URL
 */
export function getExtensionFromUrl(url: string): string {
  try {
    // Remove query parameters and hash
    const cleanUrl = url.split('?')[0]?.split('#')[0] || url;

    // Get the last segment of the path
    const path = new URL(cleanUrl, 'http://example.com').pathname;
    const match = path.match(/\.[a-zA-Z0-9]+$/);

    return match ? match[0].toLowerCase() : '';
  } catch {
    // If URL parsing fails, try simple regex
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
    return match && match[1] ? `.${match[1].toLowerCase()}` : '';
  }
}

/**
 * Gets file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  };

  return mimeToExt[mimeType.toLowerCase()] || '';
}

/**
 * Infers resource type from URL path patterns
 */
function inferTypeFromPath(url: string): ResourceType | null {
  const lowerUrl = url.toLowerCase();

  // Check for common patterns
  if (lowerUrl.includes('/pdf/') || lowerUrl.includes('type=pdf')) {
    return ResourceType.PDF;
  }

  if (lowerUrl.includes('/image/') || lowerUrl.includes('/img/') || lowerUrl.includes('/images/')) {
    return ResourceType.IMAGE;
  }

  if (
    lowerUrl.includes('/document/') ||
    lowerUrl.includes('/docs/') ||
    lowerUrl.includes('/download/')
  ) {
    return ResourceType.DOCUMENT;
  }

  return null;
}

/**
 * Checks if URL is external (not relative or data URI)
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;

  // Data URIs are not external
  if (url.startsWith('data:')) return false;

  // Relative URLs are not external
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }

  return true;
}

/**
 * Validates a URL and returns validation result
 */
export function validateUrl(url: string, baseUrl?: string): URLValidation {
  const errors: string[] = [];

  // Check if URL is empty
  if (!url || url.trim() === '') {
    errors.push('URL is empty');
    return {
      isValid: false,
      isExternal: false,
      normalizedUrl: '',
      errors,
    };
  }

  // Check for data URIs
  if (url.startsWith('data:')) {
    return {
      isValid: true,
      isExternal: false,
      normalizedUrl: url,
      errors: [],
    };
  }

  // Try to normalize the URL
  let normalizedUrl: string;
  let isExternal: boolean;

  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Absolute URL
      const urlObj = new URL(url);
      normalizedUrl = urlObj.href;
      isExternal = true;
    } else if (url.startsWith('//')) {
      // Protocol-relative URL
      normalizedUrl = `https:${url}`;
      isExternal = true;
    } else {
      // Relative URL - needs base URL to resolve
      if (!baseUrl) {
        errors.push('Relative URL requires base URL for resolution');
        return {
          isValid: false,
          isExternal: false,
          normalizedUrl: url,
          errors,
        };
      }

      const baseUrlObj = new URL(baseUrl);
      const urlObj = new URL(url, baseUrl);
      normalizedUrl = urlObj.href;
      // URL is external if it's a different domain than the base URL
      isExternal = urlObj.hostname !== baseUrlObj.hostname;
    }

    // Additional validation checks
    if (normalizedUrl.length > 2048) {
      errors.push('URL exceeds maximum length of 2048 characters');
    }

    return {
      isValid: errors.length === 0,
      isExternal,
      normalizedUrl,
      errors,
    };
  } catch (error: unknown) {
    errors.push(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      isValid: false,
      isExternal: false,
      normalizedUrl: url,
      errors,
    };
  }
}

/**
 * Checks if a resource type should be processed
 */
export function shouldProcessResourceType(type: ResourceType): boolean {
  return type !== ResourceType.UNKNOWN;
}

/**
 * Gets a human-readable description of a resource type
 */
export function getResourceTypeDescription(type: ResourceType): string {
  const descriptions: Record<ResourceType, string> = {
    [ResourceType.PDF]: 'PDF Document',
    [ResourceType.IMAGE]: 'Image',
    [ResourceType.DOCUMENT]: 'Document',
    [ResourceType.UNKNOWN]: 'Unknown Resource',
  };

  return descriptions[type];
}

/**
 * Gets all supported file extensions for a resource type
 */
export function getSupportedExtensions(type: ResourceType): string[] {
  return Object.entries(EXTENSION_MAP)
    .filter(([_, resourceType]) => resourceType === type)
    .map(([ext]) => ext);
}
