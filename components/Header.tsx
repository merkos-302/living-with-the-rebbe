'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Universal Header component for Living with the Rebbe application
 * Displays on all pages with logo, title, navigation links, and Hebrew text
 */
export function Header() {
  const pathname = usePathname();

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
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === '/' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Parse
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

        {/* Hebrew Text (ב״ה) */}
        <div className="flex-shrink-0" lang="he" dir="rtl">
          <span className="font-heebo text-lg font-medium text-gray-700 sm:text-xl">ב״ה</span>
        </div>
      </div>
    </header>
  );
}
