/**
 * Download Resource API Route
 *
 * Server-side endpoint to download resources from external URLs.
 * This avoids CORS issues when downloading from client-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { downloadResource, downloadResources, DownloadError } from '@/lib/downloader';
import { ParsedResource } from '@/types/parser';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT = {
  maxRequests: 10, // Max concurrent download requests
  windowMs: 60000, // 1 minute window
};

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    // Reset the window
    requestCounts.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * POST /api/download-resource
 *
 * Downloads a single resource from a URL
 *
 * Request body:
 * - resource: ParsedResource object
 * - options: Optional download options
 *
 * Response:
 * - On success: DownloadResult with buffer as base64 string
 * - On error: Error message with status code
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { resource, options = {} } = body;

    // Validate resource
    if (!resource || !resource.normalizedUrl) {
      return NextResponse.json(
        { error: 'Invalid request: resource with normalizedUrl is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(resource.normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid resource URL format' }, { status: 400 });
    }

    // Download the resource
    const result = await downloadResource(resource as ParsedResource, options);

    // Convert buffer to base64 for JSON response
    const base64Buffer = Buffer.from(result.buffer).toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        buffer: base64Buffer,
        originalResource: {
          ...result.originalResource,
          element: {
            ...result.originalResource.element,
            outerHTML: undefined, // Reduce response size
          },
        },
      },
    });
  } catch (error) {
    console.error('Error in download-resource API:', error);

    if (error instanceof DownloadError) {
      return NextResponse.json(
        {
          error: error.message,
          url: error.url,
          statusCode: error.statusCode,
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download resource' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/download-resource/batch
 *
 * Downloads multiple resources in parallel
 *
 * Request body:
 * - resources: Array of ParsedResource objects
 * - options: Optional download options
 *
 * Response:
 * - BatchDownloadResult with buffers as base64 strings
 */
export async function PUT(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { resources, options = {} } = body;

    // Validate resources
    if (!Array.isArray(resources) || resources.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: non-empty resources array is required' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (resources.length > 20) {
      return NextResponse.json({ error: 'Batch size cannot exceed 20 resources' }, { status: 400 });
    }

    // Validate all resources
    for (const resource of resources) {
      if (!resource.normalizedUrl) {
        return NextResponse.json(
          { error: 'Invalid request: all resources must have normalizedUrl' },
          { status: 400 }
        );
      }

      try {
        new URL(resource.normalizedUrl);
      } catch {
        return NextResponse.json(
          { error: `Invalid resource URL format: ${resource.normalizedUrl}` },
          { status: 400 }
        );
      }
    }

    // Download all resources
    const result = await downloadResources(resources as ParsedResource[], options);

    // Convert buffers to base64
    const successfulWithBase64 = result.successful.map((download) => ({
      ...download,
      buffer: Buffer.from(download.buffer).toString('base64'),
      originalResource: {
        ...download.originalResource,
        element: {
          ...download.originalResource.element,
          outerHTML: undefined, // Reduce response size
        },
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        successful: successfulWithBase64,
      },
    });
  } catch (error) {
    console.error('Error in batch download-resource API:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download resources' },
      { status: 500 }
    );
  }
}
