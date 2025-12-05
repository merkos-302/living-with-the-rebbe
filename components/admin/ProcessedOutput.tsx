'use client';

import { useState } from 'react';
import { Copy, CheckCircle2, Download, Clock, FileCheck } from 'lucide-react';
import { HtmlPreview } from './HtmlPreview';
import type { ProcessingResult } from '@/lib/processor/types';

export interface ProcessedOutputProps {
  result: ProcessingResult;
}

/**
 * ProcessedOutput Component
 *
 * Displays the processed newsletter output with:
 * - Processed HTML with syntax highlighting
 * - Copy to clipboard functionality
 * - Processing statistics
 * - Download option
 */
export function ProcessedOutput({ result }: ProcessedOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.processedHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.processedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed-newsletter-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const { statistics } = result;

  // Determine status based on results
  const allFailed = statistics.successful === 0 && statistics.failed > 0;
  const someFailed = statistics.failed > 0 && statistics.successful > 0;
  // allSucceeded is implicitly true when neither allFailed nor someFailed is true

  return (
    <div className="space-y-6">
      {/* Status Banner - changes based on results */}
      {allFailed ? (
        // All uploads failed
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-600 text-white p-3 rounded-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">Upload Failed</h3>
              <p className="text-red-700 mb-4">
                All {statistics.failed} resource uploads failed. The HTML has not been modified.
                Please check the errors below and try again.
              </p>
            </div>
          </div>
        </div>
      ) : someFailed ? (
        // Some uploads failed
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-yellow-600 text-white p-3 rounded-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-1">Partially Processed</h3>
              <p className="text-yellow-700 mb-4">
                {statistics.successful} of {statistics.totalResources} resources uploaded
                successfully.
                {statistics.failed} failed. Only successful uploads have been replaced in the HTML.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Processed HTML
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-yellow-700 font-medium border-2 border-yellow-600 rounded-md hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download HTML
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // All succeeded (or no resources)
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-600 text-white p-3 rounded-lg">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-1">
                Newsletter Processed Successfully
              </h3>
              <p className="text-green-700 mb-4">
                Your newsletter is ready for distribution. All external resources have been uploaded
                to ChabadUniverse CMS and URLs have been replaced.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Processed HTML
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 font-medium border-2 border-green-600 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download HTML
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Statistics</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium mb-1">Total Resources</div>
            <div className="text-2xl font-bold text-blue-900">{statistics.totalResources}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-600 font-medium mb-1">Successful</div>
            <div className="text-2xl font-bold text-green-900">{statistics.successful}</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-sm text-red-600 font-medium mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-900">{statistics.failed}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium mb-1">Skipped</div>
            <div className="text-2xl font-bold text-purple-900">{statistics.skipped}</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Time Statistics */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              Time Breakdown
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Parsing:</dt>
                <dd className="font-medium text-gray-900">
                  {formatTime(statistics.stageTimes.parsing)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Downloading:</dt>
                <dd className="font-medium text-gray-900">
                  {formatTime(statistics.stageTimes.downloading)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Uploading:</dt>
                <dd className="font-medium text-gray-900">
                  {formatTime(statistics.stageTimes.uploading)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Replacing:</dt>
                <dd className="font-medium text-gray-900">
                  {formatTime(statistics.stageTimes.replacing)}
                </dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <dt className="text-gray-900 font-semibold">Total:</dt>
                <dd className="font-bold text-gray-900">{formatTime(statistics.totalTime)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Avg per resource:</dt>
                <dd className="font-medium text-gray-900">
                  {formatTime(statistics.averageTimePerResource)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Size Statistics */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Data Transfer</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Downloaded:</dt>
                <dd className="font-medium text-gray-900">
                  {formatBytes(statistics.totalBytesDownloaded)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Uploaded:</dt>
                <dd className="font-medium text-gray-900">
                  {formatBytes(statistics.totalBytesUploaded)}
                </dd>
              </div>
            </dl>

            <h4 className="font-medium text-gray-900 mb-3 mt-6">By Type</h4>
            <dl className="space-y-2 text-sm">
              {Object.entries(statistics.byType).map(([type, stats]) => {
                if (stats.total === 0) return null;
                return (
                  <div key={type} className="flex justify-between">
                    <dt className="text-gray-600 capitalize">{type}:</dt>
                    <dd className="font-medium text-gray-900">
                      {stats.successful}/{stats.total}
                      {stats.failed > 0 && (
                        <span className="text-red-600 ml-1">({stats.failed} failed)</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </div>

      {/* Errors and Warnings */}
      {(result.errors.length > 0 || result.warnings.length > 0) && (
        <div className="space-y-4">
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Errors ({result.errors.length})</h4>
              <ul className="space-y-1 text-sm text-red-800">
                {result.errors.map((error, idx) => (
                  <li key={idx}>• {error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">
                Warnings ({result.warnings.length})
              </h4>
              <ul className="space-y-1 text-sm text-yellow-800">
                {result.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Processed HTML Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processed HTML</h3>
        <HtmlPreview
          html={result.processedHtml}
          title="Processed Newsletter HTML"
          maxHeight="600px"
        />
      </div>
    </div>
  );
}
