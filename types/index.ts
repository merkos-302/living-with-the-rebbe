/**
 * Core type definitions for the Living with the Rebbe application
 */

// Newsletter types
export interface Newsletter {
  id: string;
  title: string;
  url: string;
  publishDate: Date;
  parsha?: string;
  year: number;
  htmlContent?: string;
  mediaUrls?: string[];
  processedMediaUrls?: Record<string, string>; // original -> CMS URL mapping
  status: NewsletterStatus;
  channelPostId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum NewsletterStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  MEDIA_DOWNLOADING = 'media_downloading',
  MEDIA_UPLOADING = 'media_uploading',
  READY_TO_POST = 'ready_to_post',
  POSTED = 'posted',
  FAILED = 'failed',
}

// Processing session types
export interface ProcessingSession {
  id: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  newslettersProcessed: number;
  newslettersTotal: number;
  currentNewsletterId?: string;
  error?: string;
  createdBy: string; // Valu user ID
}

export enum SessionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
}

// ChabadUniverse API types
export interface ChabadUniverseConfig {
  apiKey: string;
  baseUrl: string;
  channelId: string;
}

export interface MediaUploadResponse {
  url: string;
  id: string;
  filename: string;
}

export interface ChannelPostRequest {
  html: string;
  tags: string[];
  title: string;
  publishDate?: Date;
}

export interface ChannelPostResponse {
  id: string;
  url: string;
  createdAt: Date;
}

// Valu authentication types
export interface ValuUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

// HTML Processing types (Phase 2 MVP)
export interface ParsedResource {
  originalUrl: string;
  type: 'pdf' | 'image' | 'document' | 'other';
  filename: string;
}

export interface ProcessingResult {
  originalHtml: string;
  processedHtml: string;
  resources: ParsedResource[];
  urlMappings: Record<string, string>; // original -> CMS URL mapping
  processingTime: number; // milliseconds
  errors?: string[];
}

export interface CMSUploadResponse {
  success: boolean;
  cmsUrl: string;
  resourceId: string;
  error?: string;
}

export interface URLMapping {
  original: string;
  replacement: string;
}

// Error types
export class NewsletterError extends Error {
  constructor(
    message: string,
    public code: NewsletterErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'NewsletterError';
  }
}

export enum NewsletterErrorCode {
  HTML_PARSING_FAILED = 'HTML_PARSING_FAILED',
  MEDIA_DOWNLOAD_FAILED = 'MEDIA_DOWNLOAD_FAILED',
  MEDIA_UPLOAD_FAILED = 'MEDIA_UPLOAD_FAILED',
  POST_FAILED = 'POST_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_HTML_CONTENT = 'INVALID_HTML_CONTENT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  URL_REPLACEMENT_FAILED = 'URL_REPLACEMENT_FAILED',
}
