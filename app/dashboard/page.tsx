'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Dashboard Page
 *
 * Central hub for content management and monitoring
 * Features:
 * - Quick access to processing tool
 * - Newsletter archives (future)
 * - Processing history (future)
 * - Statistics and analytics (future)
 * - Sample newsletter access
 *
 * This page is protected by the dashboard layout wrapper which:
 * - Enforces authentication
 * - Verifies admin permissions
 * - Shows loading states
 */

export default function DashboardPage() {
  const { user } = useAuth();
  const isDev = process.env.NODE_ENV === 'development';
  const devModeEnabled = process.env.NEXT_PUBLIC_VALU_DEV_MODE === 'true';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>{user ? 'Authenticated as Admin' : 'Development Mode'}</strong>
            <br />
            {user
              ? `Welcome, ${user.displayName || user.name}!`
              : 'Authentication bypassed for local testing'}
          </p>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Content Management Dashboard</h2>
        <p className="text-gray-600">
          Welcome to the Living with the Rebbe newsletter management system. Access all tools and
          resources from this central hub.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Process Newsletter Card */}
        <Link
          href="/admin"
          className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Newsletter</h3>
              <p className="text-sm text-gray-600 mb-3">
                Input newsletter HTML and process it for distribution through ChabadUniverse.
              </p>
              <div className="inline-flex items-center text-sm font-medium text-blue-600">
                Go to Processing Tool
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* View Sample Card */}
        <a
          href="/samples/5785/yom_kippur.html"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
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
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Sample Newsletter</h3>
              <p className="text-sm text-gray-600 mb-3">
                Explore a sample Yom Kippur 5785 newsletter to see the format and content we
                process.
              </p>
              <div className="inline-flex items-center text-sm font-medium text-indigo-600">
                Open Sample
                <svg
                  className="w-4 h-4 ml-1"
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
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Future Features Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Newsletter Archives */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-gray-600"
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
              </div>
              <h4 className="font-semibold text-gray-700">Newsletter Archives</h4>
            </div>
            <p className="text-sm text-gray-600">
              Browse and search through all previously processed newsletters by date, holiday, or
              content.
            </p>
          </div>

          {/* Processing History */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-700">Processing History</h4>
            </div>
            <p className="text-sm text-gray-600">
              View detailed logs of all processing sessions including resources uploaded and any
              errors encountered.
            </p>
          </div>

          {/* Statistics */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-gray-600"
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
              <h4 className="font-semibold text-gray-700">Analytics & Stats</h4>
            </div>
            <p className="text-sm text-gray-600">
              Track resource usage, processing times, and distribution metrics over time.
            </p>
          </div>
        </div>
      </div>

      {/* Current Status */}
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
            <h3 className="text-lg font-semibold mb-2">Phase 2 MVP - Week 1 Complete</h3>
            <p className="text-blue-100 mb-3">
              The admin processing tool is ready! You can now parse newsletter HTML and extract
              resources for processing.
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-100 text-sm">
              <li>HTML input with paste and URL fetch support</li>
              <li>Resource extraction and analysis with Cheerio</li>
              <li>Admin authentication via Valu Social</li>
              <li>Responsive UI with Hebrew/RTL support</li>
              <li>Development mode for local testing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <dl className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-600 mb-1">Application</dt>
            <dd className="font-medium text-gray-900">Living with the Rebbe Admin Tool</dd>
          </div>
          <div>
            <dt className="text-gray-600 mb-1">Access Level</dt>
            <dd className="font-medium text-gray-900">Administrator</dd>
          </div>
          <div>
            <dt className="text-gray-600 mb-1">Authentication</dt>
            <dd className="font-medium text-gray-900">
              {user ? 'Valu Social' : isDev && devModeEnabled ? 'Development Mode' : 'None'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-600 mb-1">Platform</dt>
            <dd className="font-medium text-gray-900">ChabadUniverse Iframe Integration</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
