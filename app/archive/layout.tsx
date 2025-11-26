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
 * - Provides navigation to dashboard
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
