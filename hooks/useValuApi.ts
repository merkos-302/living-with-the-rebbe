/**
 * useValuApi Hook
 * EXACT REPLICA of universe-portal's proven implementation
 *
 * This hook provides the low-level Valu API interface with health monitoring,
 * connection state management, and all the battle-tested fixes from universe-portal.
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { valuApiSingleton, ConnectionHealth, HealthCheckResult } from '@/lib/valu-api-singleton';

// Test helper stub for compatibility
export const __clearValuApiSingletonForTesting = () => {
  if (process.env.NODE_ENV === 'test') {
    // No-op for test compatibility
  }
};

/**
 * Return type for useValuApi hook
 */
export interface UseValuApiReturn {
  // Connection state
  isConnected: boolean;
  isReady: boolean;
  isInIframe: boolean;
  isNavigatingApp: boolean;
  connectionHealth: ConnectionHealth;
  lastSuccessfulOperation: number | null;

  // Core API methods
  getApi: (apiName: string) => Promise<any>;
  runConsoleCommand: (command: string) => Promise<any>;
  sendIntent: (intent: any) => Promise<any>;

  // Health monitoring
  performHealthCheck: () => Promise<HealthCheckResult>;
  updateHealthConfig: (config: Parameters<typeof valuApiSingleton.updateHealthConfig>[0]) => void;
  getCurrentHealthConfig: () => any;

  // Quick actions
  openTextChat: (chatId?: string) => Promise<any>;
  openVideoChat: (chatId?: string) => Promise<any>;
}

export function useValuApi(): UseValuApiReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isNavigatingApp, setIsNavigatingApp] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>('unknown');
  const [lastSuccessfulOperation, setLastSuccessfulOperation] = useState<number | null>(null);

  const valuApiRef = useRef<any>(null);
  const apiReadyListenerRef = useRef<(() => void) | null>(null);

  // Memoized health update callback to prevent unnecessary re-renders
  const handleHealthUpdate = useCallback((result: HealthCheckResult) => {
    setConnectionHealth((prev) => (prev !== result.health ? result.health : prev));
    setLastSuccessfulOperation((prev) =>
      prev !== result.lastSuccessfulOperation ? result.lastSuccessfulOperation : prev
    );
  }, []);

  // Memoized API connection callback
  const handleApiConnection = useCallback((api: any) => {
    if (api && api !== valuApiRef.current) {
      console.log('useValuApi: Got API instance, waiting for API_READY event');
      valuApiRef.current = api;
      setIsConnected(true);
      // DO NOT set isReady yet - wait for API_READY event

      // Clean up previous listener if any
      if (apiReadyListenerRef.current) {
        try {
          api.removeEventListener('API_READY', apiReadyListenerRef.current);
        } catch {
          // Ignore errors
        }
      }

      // Listen for API_READY event before setting isReady
      const handleApiReady = () => {
        console.log('useValuApi: API_READY event received - API is now fully ready');
        setIsReady(true);
      };

      apiReadyListenerRef.current = handleApiReady;

      try {
        // Use the ValuApi.API_READY constant if available
        const API_READY_EVENT = (api.constructor as any).API_READY || 'API_READY';
        api.addEventListener(API_READY_EVENT, handleApiReady);
        console.log('useValuApi: Listening for API_READY event');
      } catch (e) {
        console.error('useValuApi: Failed to add API_READY listener:', e);
        // Fallback: set ready after a delay if we can't listen for the event
        setTimeout(() => {
          console.log('useValuApi: Fallback - setting ready after 2 second delay');
          setIsReady(true);
        }, 2000);
      }

      // Fallback timeout: If API_READY doesn't fire within 10 seconds, set ready anyway
      setTimeout(() => {
        if (!valuApiRef.current) return;

        // Check if we're actually ready by testing the connected property (from ValuSampleApp pattern)
        const isApiConnected = valuApiRef.current.connected === true;

        if (isApiConnected) {
          console.log(
            'useValuApi: Fallback timeout - API connected property is true, setting isReady'
          );
          setIsReady(true);
        } else {
          console.log(
            'useValuApi: Fallback timeout reached, API connected:',
            valuApiRef.current.connected
          );
          // Set ready anyway to prevent infinite waiting, but API calls may fail
          setIsReady(true);
        }
      }, 10000);
    }
  }, []);

  useEffect(() => {
    // Check if we're in an iframe
    const inIframe = window !== window.parent;
    setIsInIframe(inIframe);

    if (!inIframe) {
      console.log('useValuApi: Not in iframe');
      return;
    }

    // Subscribe to singleton - it auto-initializes
    const unsubscribe = valuApiSingleton.subscribe(handleApiConnection);

    // Subscribe to health monitoring with memoized callback
    const unsubscribeHealth = valuApiSingleton.subscribeToHealth(handleHealthUpdate);

    // Start health monitoring with optimized config
    valuApiSingleton.startHealthMonitoring(undefined, {
      adaptive: true,
      timeout: 3000, // Reduced timeout for faster detection
    });

    // Cleanup
    return () => {
      unsubscribe();
      unsubscribeHealth();
      valuApiSingleton.stopHealthMonitoring();

      // Clean up API_READY listener
      if (apiReadyListenerRef.current && valuApiRef.current) {
        try {
          const API_READY_EVENT = (valuApiRef.current.constructor as any).API_READY || 'API_READY';
          valuApiRef.current.removeEventListener(API_READY_EVENT, apiReadyListenerRef.current);
          console.log('useValuApi: Cleaned up API_READY listener');
        } catch {
          // Ignore cleanup errors
        }
        apiReadyListenerRef.current = null;
      }
    };
  }, [handleApiConnection, handleHealthUpdate]); // Depend on memoized callbacks

  // Optimized API methods with minimal re-creation
  const getApi = useCallback(
    async (apiName: string) => {
      if (!valuApiRef.current || !isReady) {
        throw new Error('API not ready');
      }

      try {
        const result = await valuApiRef.current.getApi(apiName);
        // Record successful operation (this updates health state efficiently)
        valuApiSingleton.recordSuccessfulOperation();
        return result;
      } catch (error: any) {
        console.error(`useValuApi: Failed to get API ${apiName}:`, error.message);
        throw error;
      }
    },
    [isReady]
  );

  const runConsoleCommand = useCallback(
    async (command: string) => {
      // Fast-fail checks for performance
      if (!valuApiRef.current || !isReady || !isConnected) {
        console.log('useValuApi: API not ready for command:', command);
        return null;
      }

      // Optimized parent window check
      if (!window.parent || typeof window.parent.postMessage !== 'function') {
        console.log('useValuApi: Parent window not available for command:', command);
        return null;
      }

      try {
        // Check API connection status (from ValuSampleApp pattern)
        if (valuApiRef.current.connected === false) {
          console.log('useValuApi: API not connected, cannot run command');
          return null;
        }

        console.log(`useValuApi: Running command: ${command}`);
        const result = await valuApiRef.current.runConsoleCommand(command);
        console.log(`useValuApi: Command result:`, result);

        // Record successful operation for health monitoring
        valuApiSingleton.recordSuccessfulOperation();
        return result;
      } catch (error: any) {
        // Optimized error handling
        if (
          error.message?.includes('postMessage') ||
          error.message?.includes('Cannot read properties of undefined')
        ) {
          console.log(
            'useValuApi: Parent window lost during command execution, likely due to app navigation'
          );
          return null;
        }
        console.error(`useValuApi: Command failed: ${command}`, error);
        return null;
      }
    },
    [isReady, isConnected]
  );

  const sendIntent = useCallback(
    async (intent: any) => {
      if (!valuApiRef.current || !isReady) {
        throw new Error('API not ready');
      }

      // Extra safety: verify window.parent exists and has postMessage
      if (!window.parent || typeof window.parent.postMessage !== 'function') {
        console.log('useValuApi: Parent window not available for intent:', intent);
        return null;
      }

      try {
        // Additional check: verify the API instance still has sendIntent method
        if (!valuApiRef.current.sendIntent || typeof valuApiRef.current.sendIntent !== 'function') {
          console.log('useValuApi: API sendIntent method not available, API may be disconnected');
          return null;
        }

        console.log(`useValuApi: Sending intent: ${intent.applicationId}:${intent.action}`);
        const result = await (valuApiRef.current as any).sendIntent(intent);
        console.log(
          `useValuApi: Intent completed: ${intent.applicationId}:${intent.action}`,
          result
        );
        // Record successful operation
        valuApiSingleton.recordSuccessfulOperation();
        return result;
      } catch (error: any) {
        // Special handling for postRunResult errors
        if (error.message?.includes('postRunResult')) {
          console.warn(
            'useValuApi: Caught postRunResult error - app likely opened successfully anyway'
          );
          // For app open intents, return success
          if (intent.action === 'open') {
            return { success: true, warning: 'postRunResult error ignored', intent };
          }
          return null;
        }

        // Check if error is related to postMessage
        if (
          error.message?.includes('postMessage') ||
          error.message?.includes('Cannot read properties of undefined')
        ) {
          console.log(
            'useValuApi: Parent window lost during intent execution, likely due to app navigation'
          );
          // Don't propagate the error, just return null
          return null;
        }

        console.error(
          `useValuApi: Intent failed: ${intent.applicationId}:${intent.action}`,
          error.message
        );
        throw error;
      }
    },
    [isReady]
  );

  // Simple quick action functions
  const openTextChat = useCallback(
    async (chatId?: string) => {
      // Set flag to indicate app navigation is happening
      setIsNavigatingApp(true);

      try {
        // Use intent-based approach (Valu API 1.1.0 pattern)
        const intent = {
          applicationId: 'textchat',
          action: 'open',
          params: chatId ? { channelId: chatId } : {},
        };
        console.log('openTextChat: Sending intent:', intent);
        const result = await sendIntent(intent);

        console.log('openTextChat: Intent sent successfully');
        return result;
      } catch (error) {
        console.error('openTextChat: Failed to open text chat:', error);
        // Reset the flag if the method failed
        setIsNavigatingApp(false);
        return null;
      }
    },
    [sendIntent]
  );

  const openVideoChat = useCallback(
    async (chatId?: string) => {
      // Set flag to indicate app navigation is happening
      setIsNavigatingApp(true);

      try {
        // Use intent-based approach (Valu API 1.1.0 pattern)
        const intent = {
          applicationId: 'videochat',
          action: 'open',
          params: chatId ? { channelId: chatId } : {},
        };
        console.log('openVideoChat: Sending intent:', intent);
        const result = await sendIntent(intent);

        console.log('openVideoChat: Intent sent successfully');
        return result;
      } catch (error) {
        console.error('openVideoChat: Failed to open video chat:', error);
        // Reset the flag if the method failed
        setIsNavigatingApp(false);
        return null;
      }
    },
    [sendIntent]
  );

  // Optimized health check method
  const performHealthCheck = useCallback(async () => {
    return await valuApiSingleton.healthCheck();
  }, []);

  // Memoized configuration methods
  const updateHealthConfig = useCallback(
    (config: Parameters<typeof valuApiSingleton.updateHealthConfig>[0]) => {
      valuApiSingleton.updateHealthConfig(config);
    },
    []
  );

  const getCurrentHealthConfig = useCallback(() => {
    return valuApiSingleton.getHealthConfig();
  }, []);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo<UseValuApiReturn>(
    () => ({
      // Connection state
      isConnected,
      isReady,
      isInIframe,
      isNavigatingApp,
      connectionHealth,
      lastSuccessfulOperation,

      // Core API methods
      getApi,
      runConsoleCommand,
      sendIntent,

      // Health monitoring
      performHealthCheck,
      updateHealthConfig,
      getCurrentHealthConfig,

      // Quick actions
      openTextChat,
      openVideoChat,
    }),
    [
      isConnected,
      isReady,
      isInIframe,
      isNavigatingApp,
      connectionHealth,
      lastSuccessfulOperation,
      getApi,
      runConsoleCommand,
      sendIntent,
      performHealthCheck,
      updateHealthConfig,
      getCurrentHealthConfig,
      openTextChat,
      openVideoChat,
    ]
  );
}
