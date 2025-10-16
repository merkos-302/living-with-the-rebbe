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
  SCRAPING = 'scraping',
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

// Archive scraping types
export interface ArchiveEntry {
  title: string;
  url: string;
  year: number;
  parsha?: string;
}

export interface ScrapedNewsletter {
  title: string;
  url: string;
  htmlContent: string;
  mediaUrls: string[];
  publishDate: Date;
  parsha?: string;
  year: number;
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
  SCRAPING_FAILED = 'SCRAPING_FAILED',
  MEDIA_DOWNLOAD_FAILED = 'MEDIA_DOWNLOAD_FAILED',
  MEDIA_UPLOAD_FAILED = 'MEDIA_UPLOAD_FAILED',
  POST_FAILED = 'POST_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_NEWSLETTER_URL = 'INVALID_NEWSLETTER_URL',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
