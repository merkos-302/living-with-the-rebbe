'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AccessDenied } from '@/components/valu/AccessDenied';

export default function HomePage() {
  const { isLoading, isAuthenticated, isAdmin, user, error, refreshUser } = useAuth();

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

  // User is authenticated and is an admin - show the dashboard
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>{user ? 'Authenticated as Admin' : 'Development Mode'}</strong>
            <br />
            {user
              ? `Welcome, ${user.displayName || user.name}!`
              : 'Authentication bypassed for local testing'}
          </p>
        </div>

        <h1 className="text-4xl font-bold mb-4">Living with the Rebbe</h1>
        <h2 className="text-2xl text-gray-600 mb-8">Admin Tool</h2>
        <p className="text-lg text-gray-700 mb-4">
          This is an admin-only tool for processing newsletters for ChabadUniverse.
        </p>
        <p className="text-sm text-gray-500">
          This application runs exclusively as an iframe within ChabadUniverse/Valu Social.
        </p>

        {/* Admin Access Button */}
        <div className="mt-8">
          <a
            href="/admin"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg
              className="w-6 h-6 mr-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Go to Admin Dashboard
          </a>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-semibold">
            Status: Phase 2 MVP - Admin UI Complete
          </p>
          <p className="text-sm text-blue-700 mt-2">
            Admin interface is ready! You can now input newsletter HTML for processing.
          </p>
        </div>

        {/* Sample Newsletter Section */}
        <div className="mt-12 p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">View Sample Newsletter</h3>
          <p className="text-sm text-blue-700 mb-6">
            Explore a sample &quot;Living with the Rebbe&quot; newsletter to see the format and
            content we&apos;ll be processing.
          </p>
          <a
            href="/samples/5785/yom_kippur.html"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View Yom Kippur 5785 Sample
          </a>
        </div>
      </div>
    </main>
  );
}
