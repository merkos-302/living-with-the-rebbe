/**
 * API route for parsing newsletter HTML
 * POST /api/parse
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseHtml, hasErrors, getErrorMessages, ResourceType } from '@/lib/parser';
import type { ParserResult } from '@/lib/parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, options } = body;

    // Validate input
    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'Invalid HTML content. Expected non-empty string.' },
        { status: 400 }
      );
    }

    if (html.length > 10 * 1024 * 1024) {
      // 10MB limit
      return NextResponse.json(
        { error: 'HTML content too large. Maximum 10MB allowed.' },
        { status: 413 }
      );
    }

    // Parse HTML
    const result: ParserResult = parseHtml(html, {
      externalOnly: options?.externalOnly ?? true,
      includeBackgrounds: options?.includeBackgrounds ?? true,
      maxUrlLength: options?.maxUrlLength ?? 2048,
    });

    // Check for errors
    if (hasErrors(result)) {
      console.warn('Parsing completed with errors:', getErrorMessages(result));
    }

    // Return structured response
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalResources: result.summary.totalResources,
          externalResources: result.summary.externalResources,
          byType: {
            pdfs: result.summary.byType[ResourceType.PDF],
            images: result.summary.byType[ResourceType.IMAGE],
            documents: result.summary.byType[ResourceType.DOCUMENT],
            unknown: result.summary.byType[ResourceType.UNKNOWN],
          },
        },
        resources: result.resources.map((resource) => ({
          url: resource.normalizedUrl,
          type: resource.type,
          extension: resource.extension,
          element: {
            tag: resource.element.tag,
            attribute: resource.element.attribute,
          },
          context: resource.context,
          isExternal: resource.isExternal,
        })),
        metadata: {
          parseTime: result.metadata.parseTime,
          htmlLength: result.metadata.htmlLength,
        },
        errors: result.errors.map((error) => ({
          message: error.message,
          type: error.type,
          context: error.context,
        })),
      },
    });
  } catch (error) {
    console.error('Parse API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse HTML',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Returns parser capabilities and info
 */
export async function GET() {
  return NextResponse.json({
    name: 'HTML Parser API',
    version: '1.0.0',
    capabilities: {
      supportedResourceTypes: ['pdf', 'image', 'document'],
      supportedElements: ['img', 'a', 'embed', 'object', 'source', 'style'],
      features: [
        'External resource extraction',
        'CSS background image parsing',
        'Relative URL resolution',
        'Automatic deduplication',
        'Context extraction (alt, title, aria-label)',
        'Error reporting',
      ],
    },
    usage: {
      endpoint: '/api/parse',
      method: 'POST',
      body: {
        html: 'string (required)',
        options: {
          externalOnly: 'boolean (optional, default: true)',
          includeBackgrounds: 'boolean (optional, default: true)',
          maxUrlLength: 'number (optional, default: 2048)',
        },
      },
    },
  });
}
