'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AccessDenied } from '@/components/valu/AccessDenied';

/**
 * Archive Page - Newsletter Archives
 *
 * This page will display a list of previously processed newsletters
 * for reference and re-processing. Currently shows a placeholder
 * as the archive functionality will be implemented in a future session.
 */

export default function ArchivePage() {
  const { isLoading, isAuthenticated, isAdmin, error, refreshUser } = useAuth();

  // Development mode bypass
  const isDev = process.env.NODE_ENV === 'development';
  const devModeEnabled = process.env.NEXT_PUBLIC_VALU_DEV_MODE === 'true';

  // Show loading state during authentication
  if (isLoading) {
    return <LoadingSpinner message="Authenticating with ChabadUniverse..." />;
  }

  // Show error if authentication failed (but allow dev mode bypass)
  if (error && !(isDev && devModeEnabled)) {
    return (
      <AccessDenied
        title="Authentication Failed"
        message={error}
        showRetry={true}
        onRetry={refreshUser}
      />
    );
  }

  // Show access denied if not authenticated (but allow dev mode bypass)
  if (!isAuthenticated && !(isDev && devModeEnabled)) {
    return (
      <AccessDenied
        title="Authentication Required"
        message="You must be authenticated to access this tool."
        showRetry={true}
        onRetry={refreshUser}
      />
    );
  }

  // Show access denied if not admin (but allow dev mode bypass)
  if (!isAdmin && !(isDev && devModeEnabled)) {
    return (
      <AccessDenied
        title="Admin Access Required"
        message="Only channel administrators can access this tool."
      />
    );
  }

  // User is authenticated and is an admin - show the archive page
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Newsletter Archive</h1>
          <p className="text-gray-600">
            Browse and manage previously processed Living with the Rebbe newsletters.
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
          <svg
            className="w-16 h-16 text-blue-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-blue-900 mb-3">Archive Coming Soon</h2>
          <p className="text-blue-700 max-w-2xl mx-auto mb-6">
            The newsletter archive feature will be available in a future update. You&apos;ll be able
            to view, search, and re-process previously uploaded newsletters from this page.
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-300">
            <svg
              className="w-5 h-5 mr-2"
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
            Under Development
          </div>
        </div>

        {/* Planned Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Archives</h3>
            <p className="text-sm text-gray-600">
              Search through past newsletters by date, title, or content.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Re-process</h3>
            <p className="text-sm text-gray-600">
              Re-process any newsletter with updated settings or resources.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600">
              View processing statistics and resource usage over time.
            </p>
          </div>
        </div>

        {/* Sample Newsletter Link */}
        <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">Try a Sample</h3>
          <p className="text-sm text-indigo-700 mb-4">
            Want to see how the processing works? Try our sample newsletter.
          </p>
          <a
            href="/samples/5785/yom_kippur.html"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
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
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View Sample Newsletter
          </a>
        </div>
      </div>
    </main>
  );
}
