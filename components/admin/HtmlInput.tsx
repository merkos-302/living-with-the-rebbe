'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Link, Clipboard } from 'lucide-react';
import { logger } from '@/utils/logger';
import { UrlInput } from './UrlInput';

/**
 * HtmlInput Component
 *
 * Dual-mode input interface for newsletter HTML content:
 * - URL mode (default): Fetch HTML from a URL
 * - Paste mode: Paste or upload HTML directly
 *
 * Features:
 * - Tabbed interface with URL and paste modes
 * - Large textarea with Hebrew/RTL support
 * - Character and line count display
 * - Clear button to reset input
 * - Submit button to process HTML
 * - File upload alternative (paste or upload)
 * - Visual feedback for content presence
 * - Responsive design
 *
 * Part of Phase 2 MVP - Admin UI implementation
 */

interface HtmlInputProps {
  onSubmit: (html: string, baseUrl?: string, sourceUrl?: string) => void;
  isProcessing?: boolean;
  needsBaseUrl?: boolean;
  onBaseUrlChange?: (baseUrl: string) => void;
}

export function HtmlInput({
  onSubmit,
  isProcessing = false,
  needsBaseUrl = false,
  onBaseUrlChange,
}: HtmlInputProps) {
  const [activeTab, setActiveTab] = useState<string>('url');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);
  const [lineCount, setLineCount] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseUrlRef = useRef<HTMLInputElement>(null);

  // Update counts when content changes
  useEffect(() => {
    setCharCount(htmlContent.length);
    setLineCount(htmlContent.split('\n').length);
  }, [htmlContent]);

  // Focus on base URL field when it's needed
  useEffect(() => {
    if (needsBaseUrl && baseUrlRef.current) {
      baseUrlRef.current.focus();
      baseUrlRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [needsBaseUrl]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value);
  };

  const handleBaseUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newBaseUrl = e.target.value;
    setBaseUrl(newBaseUrl);
    if (onBaseUrlChange) {
      onBaseUrlChange(newBaseUrl);
    }
  };

  const handleClear = () => {
    setHtmlContent('');
    setBaseUrl('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    logger.info('HTML input cleared');
  };

  const handleSubmit = () => {
    if (!htmlContent.trim()) {
      logger.warn('Cannot submit empty HTML content');
      return;
    }

    // Validate base URL if provided
    if (baseUrl && !baseUrl.match(/^https?:\/\//)) {
      logger.warn('Invalid base URL format', { baseUrl });
      alert('Base URL must start with http:// or https://');
      return;
    }

    logger.info('Submitting HTML for processing (paste mode)', {
      charCount,
      lineCount,
      baseUrl: baseUrl || 'none',
    });

    onSubmit(htmlContent, baseUrl || undefined, undefined);
  };

  const handleUrlSubmit = (html: string, sourceUrl: string) => {
    logger.info('Submitting HTML for processing (URL mode)', {
      sourceUrl,
      htmlLength: html.length,
    });

    onSubmit(html, sourceUrl, sourceUrl);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      logger.warn('Invalid file type - must be HTML', { fileName: file.name });
      alert('Please upload an HTML file (.html or .htm)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      logger.warn('File too large', { size: file.size, maxSize });
      alert('File size must be less than 10MB');
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtmlContent(content);
      logger.info('HTML file uploaded', {
        fileName: file.name,
        size: file.size,
        charCount: content.length,
      });
    };
    reader.onerror = (error) => {
      logger.error('Failed to read file', error);
      alert('Failed to read file. Please try again.');
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const hasContent = htmlContent.trim().length > 0;
  const canSubmit = hasContent && !isProcessing;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Newsletter HTML Input</h2>
        <p className="text-sm text-gray-600">
          Fetch HTML from a URL or paste/upload it directly. The system will extract linked
          documents (PDFs, Word files, etc.) for CMS upload. Inline images will not be processed.
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex border-b border-gray-200 mb-6">
          <TabsTrigger
            value="url"
            className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'url'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Link className="w-4 h-4 mr-2" />
            Fetch from URL
          </TabsTrigger>
          <TabsTrigger
            value="paste"
            className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Clipboard className="w-4 h-4 mr-2" />
            Paste HTML
          </TabsTrigger>
        </TabsList>

        {/* URL Tab Content */}
        <TabsContent value="url">
          <UrlInput onSubmit={handleUrlSubmit} isProcessing={isProcessing} />
        </TabsContent>

        {/* Paste Tab Content */}
        <TabsContent value="paste">
          <div className="space-y-4">
            {/* Input Methods */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={triggerFileUpload}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Upload HTML File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {hasContent && (
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear
                </button>
              )}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={htmlContent}
                onChange={handleChange}
                disabled={isProcessing}
                placeholder="Paste newsletter HTML here... or use the Upload button above"
                className="w-full h-96 px-4 py-3 font-mono text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                dir="ltr"
                spellCheck={false}
              />

              {/* Empty State Overlay */}
              {!hasContent && !isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-gray-400">
                    <svg
                      className="w-16 h-16 mx-auto mb-3 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium">No content yet</p>
                  </div>
                </div>
              )}
            </div>

            {/* Base URL Field - Only shown in paste mode when needed */}
            {needsBaseUrl && (
              <div className="ring-2 ring-red-500 ring-offset-2 rounded-lg p-4 bg-red-50">
                <label htmlFor="base-url" className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL <span className="text-red-600">(Required for relative URLs)</span>
                </label>
                <div className="flex items-start space-x-2">
                  <div className="flex-1">
                    <input
                      ref={baseUrlRef}
                      id="base-url"
                      type="url"
                      value={baseUrl}
                      onChange={handleBaseUrlChange}
                      disabled={isProcessing}
                      placeholder="https://example.com (needed if HTML contains relative URLs)"
                      className="w-full px-4 py-2 text-sm border border-red-500 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-sm text-red-600">
                      Your HTML contains relative URLs. Please provide the base URL where the
                      newsletter is hosted.
                    </p>
                  </div>
                  {baseUrl && (
                    <button
                      onClick={() => setBaseUrl('')}
                      disabled={isProcessing}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Clear base URL"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stats and Actions */}
            <div className="flex items-center justify-between">
              {/* Content Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
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
                  <span>
                    {charCount.toLocaleString()} character{charCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <span>
                    {lineCount.toLocaleString()} line{lineCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {hasContent && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Ready to process</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="w-5 h-5 mr-2 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Process HTML
                  </>
                )}
              </button>
            </div>

            {/* Help Text */}
            {hasContent && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
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
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Extract all external resource URLs (PDFs, images, documents)</li>
                      <li>Download each resource from original location</li>
                      <li>Upload to ChabadUniverse CMS with authentication</li>
                      <li>Replace original URLs with CMS URLs</li>
                      <li>Return modified HTML ready for distribution</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
