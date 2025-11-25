'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useValuApi, UseValuApiReturn } from '@/hooks/useValuApi';

/**
 * Context provider for Valu API connection
 * Exposes API methods to all components
 *
 * Based on universe-portal implementation
 */

export interface ValuApiContextValue extends UseValuApiReturn {
  // Quick access methods
  getCurrentUser: () => Promise<any>;
  getUsersApi: () => Promise<any>;
}

const ValuApiContext = createContext<ValuApiContextValue | null>(null);

export function ValuApiProvider({ children }: { children: ReactNode }) {
  const valuApiData = useValuApi();

  const contextValue: ValuApiContextValue = {
    ...valuApiData,

    // Convenience method: Get current user
    getCurrentUser: async () => {
      try {
        const usersApi = await valuApiData.getApi('users');
        return await usersApi.run('current');
      } catch (error) {
        console.error('Failed to get current user:', error);
        return null;
      }
    },

    // Convenience method: Get users API
    getUsersApi: async () => {
      return await valuApiData.getApi('users');
    },
  };

  return <ValuApiContext.Provider value={contextValue}>{children}</ValuApiContext.Provider>;
}

/**
 * Hook to access Valu API context
 */
export function useValuApiContext(): ValuApiContextValue {
  const context = useContext(ValuApiContext);

  if (!context) {
    throw new Error('useValuApiContext must be used within ValuApiProvider');
  }

  return context;
}
