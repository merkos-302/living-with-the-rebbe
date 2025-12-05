/**
 * API route for server-side newsletter processing
 * POST /api/process
 *
 * Parses HTML, downloads resources server-side, and returns base64-encoded data.
 * Client will then upload to CMS using Valu API (which runs client-side in iframe).
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseHtml } from '@/lib/parser';
import { downloadResources } from '@/lib/downloader';
import type { ParsedResource } from '@/types/parser';
import type { DownloadResult, DownloadFailure } from '@/lib/downloader/types';
import { logger } from '@/utils/logger';

// Rate limiting map (requests per IP)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // Lower limit for processing (more resource intensive)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Request size limits
const MAX_HTML_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_DOWNLOAD_SIZE = 100 * 1024 * 1024; // 100MB total downloads

/**
 * Request body for processing newsletter
 */
export interface ProcessRequest {
  html: string;
  baseUrl?: string;
}

/**
 * Downloaded resource with base64 encoded data
 */
export interface ProcessedDownload {
  url: string;
  data: string; // base64 encoded
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Processing error information
 */
export interface ProcessingError {
  url: string;
  error: string;
}

/**
 * Successful response data
 */
export interface ProcessData {
  resources: ParsedResource[];
  downloads: ProcessedDownload[];
  errors: ProcessingError[];
}

/**
 * Success response
 */
export interface ProcessSuccessResponse {
  success: true;
  data: ProcessData;
}

/**
 * Error response
 */
export interface ProcessErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * Combined response type
 */
export type ProcessResponse = ProcessSuccessResponse | ProcessErrorResponse;

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to 'unknown' if we can't determine IP
  return 'unknown';
}

/**
 * Check rate limit for client IP
 */
function checkRateLimit(clientIp: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIp);

  if (!clientData) {
    // First request from this IP
    rateLimitMap.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  // Check if window has expired
  if (now >= clientData.resetTime) {
    // Reset the counter
    rateLimitMap.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  // Check if under limit
  if (clientData.count < RATE_LIMIT_MAX_REQUESTS) {
    clientData.count++;
    return { allowed: true };
  }

  // Rate limit exceeded
  return { allowed: false, resetTime: clientData.resetTime };
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

/**
 * POST handler - Process newsletter HTML
 */
export async function POST(request: NextRequest): Promise<NextResponse<ProcessResponse>> {
  const startTime = Date.now();

  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request);

    // Check rate limit
    const rateLimitCheck = checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      const retryAfter = rateLimitCheck.resetTime
        ? Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        : 60;

      logger.warn('Rate limit exceeded', { clientIp, retryAfter });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          details: `Too many requests. Please try again in ${retryAfter} seconds.`,
        } as ProcessErrorResponse,
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitCheck.resetTime?.toString() || '',
          },
        }
      );
    }

    // Parse request body
    let body: ProcessRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: 'Request body must be valid JSON',
        } as ProcessErrorResponse,
        { status: 400 }
      );
    }

    // Validate HTML
    if (!body.html || typeof body.html !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid HTML content',
          details: 'HTML is required and must be a non-empty string',
        } as ProcessErrorResponse,
        { status: 400 }
      );
    }

    if (body.html.length > MAX_HTML_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'HTML content too large',
          details: `Maximum HTML size is ${MAX_HTML_SIZE / 1024 / 1024}MB`,
        } as ProcessErrorResponse,
        { status: 413 }
      );
    }

    // Validate baseUrl if provided
    if (body.baseUrl && typeof body.baseUrl !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid base URL',
          details: 'Base URL must be a string',
        } as ProcessErrorResponse,
        { status: 400 }
      );
    }

    logger.info('Starting newsletter processing', {
      clientIp,
      htmlLength: body.html.length,
      hasBaseUrl: !!body.baseUrl,
    });

    // Step 1: Parse HTML to extract resources
    const parseStartTime = Date.now();
    const parserResult = parseHtml(body.html, {
      baseUrl: body.baseUrl,
      externalOnly: true, // Only process external resources
      includeBackgrounds: true,
      maxUrlLength: 2048,
    });

    const parseTime = Date.now() - parseStartTime;

    logger.info('HTML parsing complete', {
      parseTime,
      totalResources: parserResult.summary.totalResources,
      externalResources: parserResult.summary.externalResources,
      errors: parserResult.errors.length,
    });

    // Step 2: Download resources server-side
    const downloadStartTime = Date.now();
    const downloadResult = await downloadResources(parserResult.resources, {
      timeout: 30000, // 30 seconds per resource
      maxRetries: 3,
      retryDelay: 1000,
      concurrency: 3, // Download 3 resources at a time
      maxFileSize: 50 * 1024 * 1024, // 50MB per file
      calculateHash: false, // Don't need hash for now
    });

    const downloadTime = Date.now() - downloadStartTime;

    logger.info('Resource downloads complete', {
      downloadTime,
      successful: downloadResult.summary.successful,
      failed: downloadResult.summary.failed,
      totalSize: downloadResult.summary.totalSize,
    });

    // Check total download size
    if (downloadResult.summary.totalSize > MAX_TOTAL_DOWNLOAD_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Total download size exceeds limit',
          details: `Maximum total download size is ${MAX_TOTAL_DOWNLOAD_SIZE / 1024 / 1024}MB`,
        } as ProcessErrorResponse,
        { status: 413 }
      );
    }

    // Step 3: Convert downloads to base64-encoded format
    const processedDownloads: ProcessedDownload[] = downloadResult.successful.map(
      (download: DownloadResult) => ({
        url: download.originalResource.normalizedUrl,
        data: arrayBufferToBase64(download.buffer),
        filename: download.filename,
        mimeType: download.mimeType,
        size: download.size,
      })
    );

    // Step 4: Collect errors
    const processingErrors: ProcessingError[] = downloadResult.failed.map(
      (failure: DownloadFailure) => ({
        url: failure.resource.normalizedUrl,
        error: failure.error,
      })
    );

    const totalTime = Date.now() - startTime;

    logger.info('Processing complete', {
      totalTime,
      parseTime,
      downloadTime,
      totalResources: parserResult.resources.length,
      successfulDownloads: processedDownloads.length,
      failedDownloads: processingErrors.length,
      totalSize: downloadResult.summary.totalSize,
    });

    // Return successful response
    const response: ProcessSuccessResponse = {
      success: true,
      data: {
        resources: parserResult.resources,
        downloads: processedDownloads,
        errors: processingErrors,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const totalTime = Date.now() - startTime;

    logger.error('Failed to process newsletter', error, { totalTime });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process newsletter',
        details: errorMessage,
      } as ProcessErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * GET handler - Returns API information
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: 'Newsletter Processing API',
    version: '1.0.0',
    description: 'Parses HTML and downloads resources server-side for client-side CMS upload',
    features: {
      htmlParsing: true,
      resourceDownload: true,
      base64Encoding: true,
      rateLimiting: true,
      concurrencyControl: true,
      retryLogic: true,
    },
    limits: {
      rateLimit: {
        requests: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
      },
      html: {
        maxSize: MAX_HTML_SIZE,
      },
      downloads: {
        maxTotalSize: MAX_TOTAL_DOWNLOAD_SIZE,
        maxFileSize: 50 * 1024 * 1024,
        timeout: 30000,
        concurrency: 3,
      },
    },
    usage: {
      endpoint: '/api/process',
      method: 'POST',
      body: {
        html: 'string (required) - Newsletter HTML content',
        baseUrl: 'string (optional) - Base URL for resolving relative URLs',
      },
      response: {
        success: 'boolean',
        data: {
          resources: 'ParsedResource[] - All extracted resources',
          downloads: 'ProcessedDownload[] - Successfully downloaded resources as base64',
          errors: 'ProcessingError[] - Failed downloads',
        },
      },
    },
  });
}
