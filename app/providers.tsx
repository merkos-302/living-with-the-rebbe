'use client';

import { ReactNode } from 'react';
import { ValuApiProvider } from '@/contexts/ValuApiContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ValuFrameGuard } from '@/components/valu/ValuFrameGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Client-side providers for Valu API and authentication
 * Wrapped separately to keep root layout as Server Component
 */

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ValuApiProvider>
        <AuthProvider>
          <ValuFrameGuard>{children}</ValuFrameGuard>
        </AuthProvider>
      </ValuApiProvider>
    </ErrorBoundary>
  );
}
