'use client';

import { useState, useEffect } from 'react';
import { HtmlInput } from '@/components/admin/HtmlInput';
import { ParseResults } from '@/components/admin/ParseResults';
import { HtmlPreview } from '@/components/admin/HtmlPreview';
import { useHtmlParser } from '@/hooks/useHtmlParser';
import { logger } from '@/utils/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';

/**
 * Admin Dashboard Page
 *
 * Main admin interface for processing newsletters
 * Features:
 * - HTML input component for newsletter content
 * - Resource extraction and preview
 * - Processing status display
 * - Results preview with tabs
 *
 * This page is protected by the admin layout wrapper which:
 * - Enforces authentication
 * - Verifies admin permissions
 * - Shows loading states
 *
 * Part of Phase 2 MVP - Admin UI implementation
 */

export default function AdminPage() {
  const { parse, isLoading, result, resources, error: parserError, clear } = useHtmlParser();
  const [inputHtml, setInputHtml] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('resources');
  const [needsBaseUrl, setNeedsBaseUrl] = useState<boolean>(false);

  // Check for relative URL errors when parser error changes
  useEffect(() => {
    if (parserError?.includes('Relative URL requires base URL')) {
      setNeedsBaseUrl(true);
      logger.info('Detected relative URLs - base URL required');
    }
  }, [parserError]);

  const handleHtmlSubmit = async (html: string, providedBaseUrl?: string, sourceUrl?: string) => {
    logger.info('Starting HTML parsing', {
      htmlLength: html.length,
      baseUrl: providedBaseUrl || 'none',
      sourceUrl: sourceUrl || 'none',
      source: sourceUrl ? 'url' : 'paste',
    });

    setInputHtml(html);
    setNeedsBaseUrl(false); // Reset the flag

    await parse(html, {
      baseUrl: providedBaseUrl,
      externalOnly: true,
      includeBackgrounds: true,
    });

    logger.info('HTML parsing completed', {
      resourceCount: resources.length || 0,
      source: sourceUrl ? 'url' : 'paste',
    });
  };

  const handleReset = () => {
    clear();
    setInputHtml('');
    setNeedsBaseUrl(false);
    setActiveTab('resources');
    logger.info('Parsing results cleared');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Newsletter Processing</h2>
        <p className="text-gray-600 mb-2">
          Process Living with the Rebbe newsletters for distribution through ChabadUniverse.
        </p>
        <p className="text-sm text-gray-500">
          <strong>Note:</strong> Only linked documents (PDFs, Word files, etc.) will be uploaded to
          CMS. Inline images displayed in the email will remain as-is.
        </p>
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-lg font-semibold mb-2">Phase 2 MVP - Admin UI</h3>
            <p className="text-blue-100 mb-3">
              The HTML input interface is now complete. Resource processing implementation is coming
              in the next phase.
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-100 text-sm">
              <li>HTML input with paste and upload support</li>
              <li>Character and line count tracking</li>
              <li>Admin authentication and authorization</li>
              <li>Responsive UI with Hebrew/RTL support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* HTML Input Component */}
      <HtmlInput onSubmit={handleHtmlSubmit} isProcessing={isLoading} needsBaseUrl={needsBaseUrl} />

      {/* Error Display */}
      {parserError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Parsing Error</h3>
              <p className="text-red-700">{parserError}</p>
              <button
                onClick={handleReset}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parsing Results */}
      {result && resources.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Parsing Complete</h3>
              <p className="text-sm text-gray-600 mt-1">
                Found {resources.length} resource{resources.length !== 1 ? 's' : ''} in the HTML
              </p>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Parse Another
            </button>
          </div>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex border-b border-gray-200 mb-4">
              <TabsTrigger
                value="resources"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'resources'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Resources ({resources.length})
              </TabsTrigger>
              <TabsTrigger
                value="html"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'html'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                HTML Preview
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'stats'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resources">
              <ParseResults resources={resources} onClear={handleReset} />
            </TabsContent>

            <TabsContent value="html">
              <HtmlPreview html={inputHtml} title="Original HTML" maxHeight="600px" />
            </TabsContent>

            <TabsContent value="stats">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Parsing Statistics</h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-600">Parse Time</dt>
                      <dd className="font-medium text-gray-900">{result.metadata.parseTime}ms</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">HTML Length</dt>
                      <dd className="font-medium text-gray-900">
                        {result.metadata.htmlLength.toLocaleString()} chars
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Total Resources</dt>
                      <dd className="font-medium text-gray-900">{result.summary.totalResources}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">External Resources</dt>
                      <dd className="font-medium text-gray-900">
                        {result.summary.externalResources}
                      </dd>
                    </div>
                  </dl>
                </div>

                {result.errors.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">Parsing Warnings</h4>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>• {err.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Feature Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Resource Upload</h3>
          </div>
          <p className="text-sm text-gray-600">
            Automatically download resources and upload them to ChabadUniverse CMS with proper
            authentication.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">URL Replacement</h3>
          </div>
          <p className="text-sm text-gray-600">
            Replace all external URLs with CMS URLs that handle authentication and redirects
            automatically.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">HTML Preservation</h3>
          </div>
          <p className="text-sm text-gray-600">
            Maintain exact HTML formatting and structure. Only URLs are replaced - everything else
            stays the same.
          </p>
        </div>
      </div>
    </div>
  );
}
