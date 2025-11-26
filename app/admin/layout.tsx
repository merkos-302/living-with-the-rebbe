'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AccessDenied } from '@/components/valu/AccessDenied';

/**
 * Admin Layout Component
 *
 * Authenticated layout wrapper for admin pages
 * - Enforces authentication and admin permission checks
 * - Shows loading states during authentication
 * - Redirects non-admins to home page with access denied message
 * - Provides consistent layout for all admin pages
 *
 * Used by all pages under /app/admin/*
 */

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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

  // User is authenticated and is an admin - show the admin layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Living with the Rebbe</h1>
              <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                Admin Tool
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {user?.displayName ||
                    user?.name ||
                    (isDev && devModeEnabled ? 'Dev Mode' : 'Guest')}
                </span>
              </div>
              {user?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImage}
                  alt={user.displayName || user.name}
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                />
              ) : (
                isDev &&
                devModeEnabled && (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">DEV</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      {/* Admin Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>ChabadUniverse Admin Tool - Living with the Rebbe Newsletter Processing</p>
            {user ? (
              <p className="mt-1">
                Authenticated via Valu Social as{' '}
                <span className="font-medium text-gray-700">{user.displayName || user.name}</span>
              </p>
            ) : isDev && devModeEnabled ? (
              <p className="mt-1">
                <span className="font-medium text-blue-600">Development Mode</span> - Authentication
                bypassed
              </p>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
