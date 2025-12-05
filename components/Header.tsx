'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Loader2 } from 'lucide-react';

/**
 * Universal Header component for Living with the Rebbe application
 * Displays on all pages with logo, title, navigation links, user info, and Hebrew text
 *
 * Shows a full-page loading screen until authenticated, then displays user's name in header
 */
export function Header() {
  const pathname = usePathname();
  const { isLoading, isAuthenticated, user } = useAuth();

  // Track if component has mounted (to avoid hydration issues)
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Loading screen component
  const LoadingScreen = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative h-16 w-16">
            <Image
              src="/img/living_favicon.png"
              alt="Living with the Rebbe Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="mb-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <p className="text-gray-700 text-lg font-medium">Connecting to ChabadUniverse...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we authenticate</p>
      </div>
    </div>
  );

  // Show loading screen until mounted and authenticated
  if (!hasMounted || isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  // Get display name
  const displayName = user?.displayName || user?.name || 'User';

  // Validate profile image URL - must be an absolute URL or start with /
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  const hasValidProfileImage = isValidImageUrl(user?.profileImage);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src="/img/living_favicon.png"
              alt="Living with the Rebbe Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Living with the Rebbe</h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link
            href="/admin"
            className={`text-sm font-medium transition-colors ${
              pathname === '/admin' || pathname === '/'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Process
          </Link>
          <Link
            href="/archive"
            className={`text-sm font-medium transition-colors ${
              pathname === '/archive' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Archive
          </Link>
        </nav>

        {/* User Info */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
            {hasValidProfileImage ? (
              <Image
                src={user!.profileImage!}
                alt={displayName}
                width={24}
                height={24}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <User className="h-4 w-4 text-green-600" />
            )}
            <span className="text-sm font-medium text-green-700">{displayName}</span>
          </div>
        </div>

        {/* Hebrew Text (ב״ה) */}
        <div className="flex-shrink-0" lang="he" dir="rtl">
          <span className="font-heebo text-lg font-medium text-gray-700 sm:text-xl">ב״ה</span>
        </div>
      </div>
    </header>
  );
}
