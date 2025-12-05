'use client';

import { useEffect, useState, useCallback } from 'react';
import { useValuApi } from '@/hooks/useValuApi';
import { valuApiSingleton } from '@/lib/valu-api-singleton';
import { Wifi, WifiOff, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ValuConnectionStatusProps {
  className?: string;
  showReconnect?: boolean;
  compact?: boolean;
}

/**
 * ValuConnectionStatus Component
 *
 * Displays the current Valu API connection status with:
 * - Visual indicator (icon + color)
 * - Status text
 * - Optional reconnect button
 */
export function ValuConnectionStatus({
  className = '',
  showReconnect = true,
  compact = false,
}: ValuConnectionStatusProps) {
  const { isConnected, isReady, isInIframe, connectionHealth } = useValuApi();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectError, setReconnectError] = useState<string | null>(null);

  // Get status info based on connection state
  const getStatusInfo = useCallback(() => {
    // Not in iframe
    if (!isInIframe) {
      return {
        status: 'no-iframe',
        label: compact ? 'No iframe' : 'Not in iframe',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: <AlertCircle className="w-4 h-4" />,
      };
    }

    // Check health status
    switch (connectionHealth) {
      case 'healthy':
        return {
          status: 'connected',
          label: compact ? 'Connected' : 'Valu API Connected',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <CheckCircle className="w-4 h-4" />,
        };

      case 'degraded':
        return {
          status: 'degraded',
          label: compact ? 'Degraded' : 'Connection Degraded',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: <AlertCircle className="w-4 h-4" />,
        };

      case 'disconnected':
        return {
          status: 'disconnected',
          label: compact ? 'Disconnected' : 'Valu API Disconnected',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <WifiOff className="w-4 h-4" />,
        };

      case 'unknown':
      default:
        // Check connection flags
        if (isConnected && isReady) {
          return {
            status: 'ready',
            label: compact ? 'Ready' : 'API Ready',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            icon: <Wifi className="w-4 h-4" />,
          };
        }

        if (isConnected && !isReady) {
          return {
            status: 'connecting',
            label: compact ? 'Connecting...' : 'Connecting to Valu...',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            icon: <Loader2 className="w-4 h-4 animate-spin" />,
          };
        }

        return {
          status: 'waiting',
          label: compact ? 'Waiting' : 'Waiting for connection...',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
        };
    }
  }, [isConnected, isReady, isInIframe, connectionHealth, compact]);

  const statusInfo = getStatusInfo();

  // Handle reconnect attempt
  const handleReconnect = useCallback(async () => {
    if (isReconnecting) return;

    setIsReconnecting(true);
    setReconnectError(null);

    try {
      console.log('ValuConnectionStatus: Attempting reconnection...');

      // Trigger a health check to force reconnection attempt
      const result = await valuApiSingleton.healthCheck();

      if (result.health === 'healthy') {
        console.log('ValuConnectionStatus: Reconnection successful');
      } else {
        console.log('ValuConnectionStatus: Reconnection result:', result.health, result.details);
        setReconnectError(result.details || 'Connection still not healthy');
      }
    } catch (error: any) {
      console.error('ValuConnectionStatus: Reconnection failed:', error);
      setReconnectError(error.message || 'Reconnection failed');
    } finally {
      setIsReconnecting(false);
    }
  }, [isReconnecting]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (reconnectError) {
      const timer = setTimeout(() => setReconnectError(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [reconnectError]);

  // Determine if reconnect button should be shown
  const canReconnect =
    showReconnect &&
    isInIframe &&
    (connectionHealth === 'degraded' ||
      connectionHealth === 'disconnected' ||
      connectionHealth === 'unknown');

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color}`}
        title={`Connection status: ${statusInfo.status}`}
      >
        {statusInfo.icon}
        <span>{statusInfo.label}</span>
      </div>

      {/* Reconnect Button */}
      {canReconnect && (
        <button
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Attempt to reconnect to Valu API"
        >
          <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
          {!compact && <span>{isReconnecting ? 'Reconnecting...' : 'Reconnect'}</span>}
        </button>
      )}

      {/* Error Message */}
      {reconnectError && !compact && (
        <span className="text-xs text-red-600" title={reconnectError}>
          Failed
        </span>
      )}
    </div>
  );
}

export default ValuConnectionStatus;
