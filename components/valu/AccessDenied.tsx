'use client';

import { ReactNode } from 'react';

/**
 * Component to display access denied messages
 * Used for non-admin users or authentication failures
 *
 * Based on universe-portal implementation
 */

interface AccessDeniedProps {
  message?: string;
  title?: string;
  children?: ReactNode;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function AccessDenied({
  message = 'You do not have permission to access this tool.',
  title = 'Access Denied',
  children,
  showRetry = false,
  onRetry,
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md text-center p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-6">
          <svg
            className="w-20 h-20 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>

        <p className="text-gray-600 mb-6">{message}</p>

        {children}

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-800">
            <strong>Admin Access Required</strong>
            <br />
            This tool is only accessible to ChabadUniverse channel administrators.
          </p>
        </div>

        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mb-4"
          >
            Retry Authentication
          </button>
        )}

        <div className="text-sm text-gray-500">
          <p>
            If you believe this is an error, please contact your{' '}
            <a href="https://chabaduniverse.com/support" className="text-blue-600 hover:underline">
              ChabadUniverse support team
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
