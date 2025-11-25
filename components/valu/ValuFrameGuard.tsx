'use client';

import { useState, useEffect, ReactNode } from 'react';
import { logger } from '@/utils/logger';

/**
 * Component that enforces iframe-only access
 * Shows informative message if not running in iframe
 *
 * Based on universe-portal implementation
 */

interface ValuFrameGuardProps {
  children: ReactNode;
  enableDevMode?: boolean;
}

export function ValuFrameGuard({ children, enableDevMode = false }: ValuFrameGuardProps) {
  const [isInFrame, setIsInFrame] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if running in iframe
    const inFrame = typeof window !== 'undefined' && window.self !== window.parent;

    // Development mode bypass
    const isDev = process.env.NODE_ENV === 'development';
    const devModeEnabled = process.env.NEXT_PUBLIC_VALU_DEV_MODE === 'true' || enableDevMode;

    if (isDev && devModeEnabled) {
      logger.warn('Dev mode enabled - bypassing iframe check and allowing access');
      setIsInFrame(true);
      return;
    }

    setIsInFrame(inFrame);

    if (inFrame) {
      logger.info('Running in iframe - Valu integration enabled');
    } else {
      logger.warn('Not running in iframe - direct access blocked');
    }
  }, [enableDevMode]);

  // Prevent flash during check
  if (isInFrame === null) {
    return null;
  }

  if (!isInFrame) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-blue-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access via ChabadUniverse</h1>

          <p className="text-gray-600 mb-6">
            This admin tool must be accessed through the ChabadUniverse platform. Direct browser
            access is not supported.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>For Administrators:</strong>
              <br />
              Please access this tool from within your ChabadUniverse admin panel.
            </p>
          </div>

          <a
            href="https://chabaduniverse.com"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to ChabadUniverse
          </a>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
              <p className="text-xs text-yellow-800 font-semibold mb-2">Development Mode</p>
              <p className="text-xs text-yellow-700 mb-2">
                To test locally, set NEXT_PUBLIC_VALU_DEV_MODE=true in .env.local
              </p>
              <p className="text-xs text-yellow-600">
                Or use the test harness at:{' '}
                <code className="bg-yellow-100 px-1 rounded">/test-harness.html</code>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
