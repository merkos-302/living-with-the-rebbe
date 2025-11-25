/**
 * API route for server-side HTML fetching
 * POST /api/fetch-html
 *
 * Fetches HTML from URLs to avoid CORS issues.
 * Includes domain whitelisting, rate limiting, and caching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAndResolveHtml } from '@/lib/fetcher/url-fetcher';
import type { FetchHtmlRequest, FetchHtmlResponse } from '@/types/api';
import { logger } from '@/utils/logger';

// Cache for storing fetched HTML (15 minute TTL)
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const htmlCache = new Map<string, { data: FetchHtmlResponse; timestamp: number }>();

// Rate limiting map (requests per IP)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Timeout for fetch operations
const FETCH_TIMEOUT_MS = 30 * 1000; // 30 seconds

// Whitelisted domains
const ALLOWED_DOMAINS = [
  'merkos-living.s3.us-west-2.amazonaws.com',
  'merkos-living.s3.amazonaws.com',
  'merkos302.com',
  // Any subdomain of merkos302.com is also allowed
];

/**
 * Check if a domain is whitelisted
 */
function isDomainAllowed(hostname: string): boolean {
  // Direct match
  if (ALLOWED_DOMAINS.includes(hostname)) {
    return true;
  }

  // Check for subdomains of merkos302.com
  if (hostname.endsWith('.merkos302.com') || hostname === 'merkos302.com') {
    return true;
  }

  return false;
}

/**
 * Validate URL format and domain
 */
function validateUrl(urlString: string): { valid: boolean; error?: string; url?: URL } {
  // Check if URL is provided
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL is required and must be a string' };
  }

  // Trim whitespace
  urlString = urlString.trim();

  // Check for minimum length
  if (urlString.length < 10) {
    return { valid: false, error: 'URL is too short to be valid' };
  }

  // Check for maximum length (2048 is common browser limit)
  if (urlString.length > 2048) {
    return { valid: false, error: 'URL exceeds maximum length of 2048 characters' };
  }

  // Try to parse URL
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Only allow HTTP and HTTPS
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
  }

  // Check domain whitelist
  if (!isDomainAllowed(url.hostname)) {
    return {
      valid: false,
      error: `Domain ${url.hostname} is not whitelisted. Allowed domains: ${ALLOWED_DOMAINS.join(', ')} and subdomains of merkos302.com`,
    };
  }

  return { valid: true, url };
}

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
 * Get cached HTML if available and not expired
 */
function getCachedHtml(url: string): FetchHtmlResponse | null {
  const cached = htmlCache.get(url);
  if (!cached) {
    return null;
  }

  const now = Date.now();
  const age = now - cached.timestamp;

  if (age > CACHE_TTL_MS) {
    // Cache expired, remove it
    htmlCache.delete(url);
    return null;
  }

  logger.debug('Cache hit for URL', { url, age });
  return cached.data;
}

/**
 * Store HTML in cache
 */
function setCachedHtml(url: string, data: FetchHtmlResponse): void {
  htmlCache.set(url, {
    data,
    timestamp: Date.now(),
  });

  // Clean up old cache entries periodically
  if (htmlCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of htmlCache.entries()) {
      if (now - value.timestamp > CACHE_TTL_MS) {
        htmlCache.delete(key);
      }
    }
  }
}

/**
 * POST handler - Fetch HTML from URL
 */
export async function POST(request: NextRequest): Promise<NextResponse<FetchHtmlResponse>> {
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
        } as FetchHtmlResponse,
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
    let body: FetchHtmlRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: 'Request body must be valid JSON',
        } as FetchHtmlResponse,
        { status: 400 }
      );
    }

    // Validate URL
    const validation = validateUrl(body.url);
    if (!validation.valid || !validation.url) {
      logger.warn('URL validation failed', { url: body.url, error: validation.error });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL',
          details: validation.error,
        } as FetchHtmlResponse,
        { status: 400 }
      );
    }

    const url = validation.url.toString();

    // Check cache
    const cached = getCachedHtml(url);
    if (cached) {
      logger.info('Returning cached HTML', { url });
      return NextResponse.json(cached);
    }

    // Fetch HTML with timeout
    logger.info('Fetching HTML from URL', { url, clientIp });

    const fetchPromise = fetchAndResolveHtml(url);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), FETCH_TIMEOUT_MS)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]);

    const fetchTime = Date.now() - startTime;

    // Validate result has required properties
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid result from fetchAndResolveHtml: result is null or not an object');
    }

    if (!result.html || typeof result.html !== 'string') {
      throw new Error('Invalid result from fetchAndResolveHtml: html is missing or not a string');
    }

    if (!result.resolvedHtml || typeof result.resolvedHtml !== 'string') {
      throw new Error(
        'Invalid result from fetchAndResolveHtml: resolvedHtml is missing or not a string'
      );
    }

    if (!result.baseUrl || typeof result.baseUrl !== 'string') {
      throw new Error(
        'Invalid result from fetchAndResolveHtml: baseUrl is missing or not a string'
      );
    }

    const response: FetchHtmlResponse = {
      success: true,
      data: {
        html: result.html,
        baseUrl: result.baseUrl,
        resolvedHtml: result.resolvedHtml,
        metadata: {
          fetchTime,
          htmlLength: result.html.length,
          resolvedLength: result.resolvedHtml.length,
        },
      },
    };

    // Cache the response
    setCachedHtml(url, response);

    logger.info('HTML fetched successfully', {
      url,
      fetchTime,
      htmlLength: result.html.length,
      cached: false,
    });

    return NextResponse.json(response);
  } catch (error) {
    const fetchTime = Date.now() - startTime;

    logger.error('Failed to fetch HTML', error, { fetchTime });

    const errorMessage =
      error instanceof Error
        ? error.message === 'Fetch timeout'
          ? 'Request timed out after 30 seconds'
          : error.message
        : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch HTML',
        details: errorMessage,
      } as FetchHtmlResponse,
      { status: 500 }
    );
  }
}

/**
 * GET handler - Returns API information
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: 'HTML Fetch API',
    version: '1.0.0',
    description: 'Fetches HTML from URLs to avoid CORS issues',
    features: {
      domainWhitelisting: true,
      rateLimiting: true,
      caching: true,
      relativeUrlResolution: true,
    },
    limits: {
      rateLimit: {
        requests: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
      },
      cache: {
        ttlMs: CACHE_TTL_MS,
      },
      timeout: {
        ms: FETCH_TIMEOUT_MS,
      },
    },
    allowedDomains: ALLOWED_DOMAINS,
    usage: {
      endpoint: '/api/fetch-html',
      method: 'POST',
      body: {
        url: 'string (required) - The URL to fetch HTML from',
      },
    },
  });
}
