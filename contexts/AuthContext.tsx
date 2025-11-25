'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useValuAuth, UseValuAuthReturn } from '@/hooks/useValuAuth';

/**
 * Context provider for authentication state
 * Manages user authentication and admin verification
 *
 * Based on universe-portal implementation
 */

export type AuthContextValue = UseValuAuthReturn;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authData = useValuAuth();

  return <AuthContext.Provider value={authData}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
