'use client';

import { useState, ChangeEvent } from 'react';
import { Link, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

/**
 * UrlInput Component
 *
 * Allows users to fetch HTML content from a URL
 * Features:
 * - URL input with validation
 * - Fetch button with loading state
 * - Error display for fetch failures
 * - Success state showing fetched HTML preview
 * - "Try Sample URL" button with working example
 *
 * States:
 * - idle: waiting for input
 * - loading: fetching HTML
 * - success: show preview
 * - error: show error message
 */

interface UrlInputProps {
  onSubmit: (html: string, sourceUrl: string) => void;
  isProcessing?: boolean;
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

const SAMPLE_URL = 'https://merkos-living.s3.us-west-2.amazonaws.com/Email85/48KiSavo1.html';

export function UrlInput({ onSubmit, isProcessing = false }: UrlInputProps) {
  const [url, setUrl] = useState<string>('');
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [error, setError] = useState<string>('');
  const [fetchedHtml, setFetchedHtml] = useState<string>('');
  const [previewExpanded, setPreviewExpanded] = useState<boolean>(false);

  const validateUrl = (urlString: string): boolean => {
    if (!urlString.trim()) {
      setError('Please enter a URL');
      return false;
    }

    try {
      const urlObj = new URL(urlString);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setError('URL must use HTTP or HTTPS protocol');
        return false;
      }
      return true;
    } catch {
      setError('Please enter a valid URL');
      return false;
    }
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) {
      setError('');
    }
    if (fetchState === 'error') {
      setFetchState('idle');
    }
  };

  const handleFetch = async () => {
    if (!validateUrl(url)) {
      setFetchState('error');
      return;
    }

    setFetchState('loading');
    setError('');

    try {
      logger.info('Fetching HTML from URL', { url });

      const response = await fetch('/api/fetch-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch HTML');
      }

      // Extract data from the API response
      const data = result.data;

      // Validate that we received valid data
      if (!data || !data.html || !data.resolvedHtml) {
        throw new Error('Invalid response from server: missing HTML data');
      }

      logger.info('Successfully fetched HTML from URL', {
        url,
        htmlLength: data.html.length,
        resolvedLength: data.resolvedHtml.length,
        baseUrl: data.baseUrl,
      });

      // Use the resolved HTML (with absolute URLs)
      setFetchedHtml(data.resolvedHtml);
      setFetchState('success');

      // Automatically submit the fetched HTML with resolved URLs
      onSubmit(data.resolvedHtml, data.baseUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch HTML';
      logger.error('Failed to fetch HTML from URL', { url, error: errorMessage });
      setError(errorMessage);
      setFetchState('error');
    }
  };

  const handleTrySample = () => {
    setUrl(SAMPLE_URL);
    setError('');
    setFetchState('idle');
    logger.info('Sample URL populated');
  };

  const handleClear = () => {
    setUrl('');
    setError('');
    setFetchedHtml('');
    setFetchState('idle');
    setPreviewExpanded(false);
    logger.info('URL input cleared');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing && fetchState !== 'loading') {
      handleFetch();
    }
  };

  const isLoading = fetchState === 'loading';
  const canFetch = url.trim().length > 0 && !isProcessing && !isLoading;

  return (
    <div className="space-y-4">
      {/* URL Input Field */}
      <div className="space-y-2">
        <label htmlFor="url-input" className="block text-sm font-medium text-gray-700">
          Newsletter URL
        </label>
        <div className="flex items-start space-x-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={handleUrlChange}
              onKeyPress={handleKeyPress}
              disabled={isProcessing || isLoading}
              placeholder="https://example.com/newsletter.html"
              className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                fetchState === 'error'
                  ? 'border-red-500 bg-red-50 focus:ring-red-500'
                  : fetchState === 'success'
                    ? 'border-green-500 bg-green-50 focus:ring-green-500'
                    : 'border-gray-300 bg-white focus:ring-blue-500'
              }`}
            />
          </div>
          {url && (
            <button
              onClick={handleClear}
              disabled={isProcessing || isLoading}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear URL"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500">
          Enter the URL of the newsletter HTML file to fetch and process.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleFetch}
          disabled={!canFetch}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <Link className="w-4 h-4 mr-2" />
              Fetch HTML
            </>
          )}
        </button>

        <button
          onClick={handleTrySample}
          disabled={isProcessing || isLoading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Try Sample URL
        </button>
      </div>

      {/* Error State */}
      {fetchState === 'error' && error && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Failed to fetch HTML</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success State */}
      {fetchState === 'success' && fetchedHtml && (
        <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">HTML fetched successfully</p>
              <p className="text-sm text-green-700 mt-1">
                {fetchedHtml.length.toLocaleString()} characters loaded
              </p>
            </div>
            <button
              onClick={() => setPreviewExpanded(!previewExpanded)}
              className="text-sm font-medium text-green-700 hover:text-green-900 transition-colors"
            >
              {previewExpanded ? 'Hide' : 'Show'} Preview
            </button>
          </div>

          {/* HTML Preview */}
          {previewExpanded && (
            <div className="mt-3">
              <div className="bg-white rounded-lg border border-green-300 p-3 max-h-64 overflow-auto">
                <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap break-words">
                  {fetchedHtml.substring(0, 2000)}
                  {fetchedHtml.length > 2000 && (
                    <span className="text-gray-500">
                      ... ({(fetchedHtml.length - 2000).toLocaleString()} more characters)
                    </span>
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Fetching HTML from URL...</p>
            <p className="text-sm text-blue-700 mt-1">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
}
