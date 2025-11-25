/**
 * Type definitions for HTML parsing and resource extraction
 */

/**
 * Supported resource types
 */
export enum ResourceType {
  PDF = 'pdf',
  IMAGE = 'image',
  DOCUMENT = 'document',
  UNKNOWN = 'unknown',
}

/**
 * Resource identification result
 */
export interface ResourceIdentification {
  type: ResourceType;
  extension: string;
  mimeType?: string;
  isExternal: boolean;
}

/**
 * Parsed resource with full context
 */
export interface ParsedResource {
  /** Original URL found in the HTML */
  url: string;

  /** Normalized absolute URL */
  normalizedUrl: string;

  /** Resource type (PDF, image, document) */
  type: ResourceType;

  /** File extension (with dot, e.g., '.pdf') */
  extension: string;

  /** Original HTML element where resource was found */
  element: {
    tag: string;
    attribute: string;
    outerHTML: string;
  };

  /** Context information */
  context?: {
    altText?: string;
    title?: string;
    ariaLabel?: string;
  };

  /** Is this an external resource? */
  isExternal: boolean;

  /** Position in the document (for debugging) */
  position?: number;
}

/**
 * Parser configuration options
 */
export interface ParserOptions {
  /** Base URL for resolving relative URLs */
  baseUrl?: string;

  /** Only include external resources (default: true) */
  externalOnly?: boolean;

  /** Include inline CSS background images (default: true) */
  includeBackgrounds?: boolean;

  /** Maximum URL length to process (default: 2048) */
  maxUrlLength?: number;

  /** Custom resource type detection function */
  customTypeDetector?: (url: string) => ResourceType | null;
}

/**
 * Parser result with all extracted resources and metadata
 */
export interface ParserResult {
  /** All parsed resources */
  resources: ParsedResource[];

  /** Resources grouped by type */
  byType: {
    [ResourceType.PDF]: ParsedResource[];
    [ResourceType.IMAGE]: ParsedResource[];
    [ResourceType.DOCUMENT]: ParsedResource[];
    [ResourceType.UNKNOWN]: ParsedResource[];
  };

  /** Summary statistics */
  summary: {
    totalResources: number;
    externalResources: number;
    byType: {
      [key in ResourceType]: number;
    };
  };

  /** Any errors encountered during parsing */
  errors: ParserError[];

  /** Processing metadata */
  metadata: {
    parseTime: number; // milliseconds
    htmlLength: number;
    options: ParserOptions;
  };
}

/**
 * Parser error information
 */
export interface ParserError {
  message: string;
  type: 'parsing' | 'validation' | 'extraction';
  context?: {
    url?: string;
    element?: string;
    line?: number;
  };
}

/**
 * URL validation result
 */
export interface URLValidation {
  isValid: boolean;
  isExternal: boolean;
  normalizedUrl: string;
  errors: string[];
}
