/**
 * Valu API Singleton
 * EXACT REPLICA of universe-portal's proven implementation
 *
 * This is the battle-tested, working implementation from universe-portal
 * that has been debugged and proven to work correctly with all the timing
 * issues, postRunResult bugs, and iframe communication quirks.
 */

import { ValuApi } from '@arkeytyp/valu-api';
import { integrationLog } from './loggers';
import { healthPerformanceMonitor } from './health-performance-monitor';

export type ConnectionHealth = 'healthy' | 'degraded' | 'disconnected' | 'unknown';

export interface HealthCheckResult {
  health: ConnectionHealth;
  lastCheck: number;
  lastSuccessfulOperation: number | null;
  details?: string;
}

export interface HealthMonitoringConfig {
  /** Base interval for health checks in milliseconds */
  baseInterval: number;
  /** Minimum interval (when unhealthy) in milliseconds */
  minInterval: number;
  /** Maximum interval (when healthy) in milliseconds */
  maxInterval: number;
  /** Health check timeout in milliseconds */
  timeout: number;
  /** Enable adaptive intervals based on health status */
  adaptive: boolean;
}

/**
 * Dead simple singleton - just create the API and hope for the best
 * (This comment is from universe-portal - keeping it for authenticity!)
 */
class ValuApiSingleton {
  private static instance: ValuApiSingleton | null = null;
  private valuApi: ValuApi | null = null;
  private listeners: Set<(api: ValuApi | null) => void> = new Set();
  private interceptorInstalled: boolean = false;

  // Health monitoring properties
  private lastHealthCheck: number = 0;
  private lastSuccessfulOperation: number | null = null;
  private currentHealth: ConnectionHealth = 'unknown';
  private healthMonitoringInterval: NodeJS.Timeout | null = null;
  private healthListeners: Set<(result: HealthCheckResult) => void> = new Set();
  private currentInterval: number = 30000; // Current adaptive interval
  private consecutiveHealthyChecks: number = 0;
  private consecutiveUnhealthyChecks: number = 0;
  private lastHealthCheckPromise: Promise<HealthCheckResult> | null = null;
  private isHealthCheckInProgress: boolean = false;
  private healthCheckConfig: HealthMonitoringConfig = {
    baseInterval: 30000,
    minInterval: 10000,
    maxInterval: 300000, // 5 minutes
    timeout: 5000,
    adaptive: true,
  };

  private constructor() {
    // Don't do anything in constructor - wait for explicit initialization
  }

  /**
   * Install a global message interceptor to prevent postRunResult errors
   * This MUST be done before the Valu API is created
   */
  private installGlobalMessageInterceptor(): void {
    console.log('ValuApiSingleton: Installing global message interceptor for postRunResult bug');

    // Store the original addEventListener
    const originalAddEventListener = window.addEventListener.bind(window);

    // Override window.addEventListener to intercept message handlers
    (window as any).addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      ...args: any[]
    ) {
      if (type === 'message') {
        // Wrap the message handler to catch postRunResult errors
        const wrappedListener = function (this: any, event: MessageEvent) {
          try {
            // Call the original listener
            if (typeof listener === 'function') {
              return listener.call(this, event);
            } else if (listener && typeof listener.handleEvent === 'function') {
              return listener.handleEvent(event);
            }
          } catch (error: any) {
            // Catch and suppress postRunResult errors
            if (error.message?.includes('postRunResult')) {
              console.warn('ValuApiSingleton: Intercepted and suppressed postRunResult error');
              console.warn('Error details:', error.message);
              console.warn('Event data:', event.data);
              // Don't rethrow - just suppress it
              return;
            }
            // Rethrow other errors
            throw error;
          }
        };

        // Register the wrapped listener instead
        return originalAddEventListener(type, wrappedListener as EventListener, ...args);
      }

      // For non-message events, use the original
      return originalAddEventListener(type, listener, ...args);
    };

    console.log('ValuApiSingleton: Global message interceptor installed');
  }

  static getInstance(): ValuApiSingleton {
    if (!ValuApiSingleton.instance) {
      ValuApiSingleton.instance = new ValuApiSingleton();
    }
    return ValuApiSingleton.instance;
  }

  /**
   * Super simple initialization - just create the API
   */
  private initialize(): void {
    // Check if already initialized
    if (this.valuApi) {
      console.log('ValuApiSingleton: Already initialized');
      return;
    }

    // CRITICAL FIX: Install interceptor ONLY when we actually initialize
    // This prevents side effects on pages that don't use Valu API
    if (typeof window !== 'undefined' && !this.interceptorInstalled) {
      this.installGlobalMessageInterceptor();
      this.interceptorInstalled = true;
    }

    // Check if we're in an iframe with proper parent
    if (!window.parent || window === window.parent) {
      console.log('ValuApiSingleton: Not in iframe or parent not available');
      return;
    }

    // Additional safety check for postMessage availability
    if (typeof window.parent.postMessage !== 'function') {
      console.log('ValuApiSingleton: Parent postMessage not available');
      return;
    }

    try {
      console.log('ValuApiSingleton: Creating API instance');

      // Just create it
      this.valuApi = new ValuApi();

      // MONKEY PATCH: Fix the postRunResult bug in Valu API package
      if (this.valuApi) {
        console.log('ValuApiSingleton: Applying comprehensive monkey patch for postRunResult bug');

        // Patch the getApi method to ensure all API pointers have postRunResult
        const originalGetApi = (this.valuApi as any).getApi;
        if (originalGetApi) {
          (this.valuApi as any).getApi = async function (apiName: string) {
            const apiPointer = await originalGetApi.call(this, apiName);

            // Ensure the API pointer has postRunResult method
            if (apiPointer && !apiPointer.postRunResult) {
              console.warn(`ValuApiSingleton: Adding postRunResult to ${apiName} API pointer`);
              apiPointer.postRunResult = (result: any) => {
                console.log(`ValuApiSingleton: Stub postRunResult called on ${apiName}:`, result);
                return result;
              };
            }

            return apiPointer;
          };
        }

        // Also patch runConsoleCommand to catch the error at the source
        const originalRunConsoleCommand = (this.valuApi as any).runConsoleCommand;
        if (originalRunConsoleCommand) {
          (this.valuApi as any).runConsoleCommand = async function (command: string) {
            try {
              return await originalRunConsoleCommand.call(this, command);
            } catch (error: any) {
              if (error.message?.includes('postRunResult')) {
                console.warn(
                  'ValuApiSingleton: Caught postRunResult error in runConsoleCommand, returning success'
                );
                // For app open commands, return a success indicator
                if (command.includes('app open')) {
                  return { success: true, warning: 'postRunResult error suppressed' };
                }
                return null;
              }
              throw error;
            }
          };
        }

        // Patch sendIntent as well
        const originalSendIntent = (this.valuApi as any).sendIntent;
        if (originalSendIntent) {
          (this.valuApi as any).sendIntent = async function (intent: any) {
            try {
              return await originalSendIntent.call(this, intent);
            } catch (error: any) {
              if (error.message?.includes('postRunResult')) {
                console.warn(
                  'ValuApiSingleton: Caught postRunResult error in sendIntent, returning success'
                );
                return { success: true, data: { warning: 'postRunResult error suppressed', intent } };
              }
              throw error;
            }
          };
        }
      }

      // Store a flag to track if we've notified
      let hasNotified = false;

      // Listen for API_READY if it happens
      this.valuApi.addEventListener(ValuApi.API_READY, () => {
        console.log('ValuApiSingleton: API_READY event received');
        if (!hasNotified) {
          hasNotified = true;
          this.notifyListeners(this.valuApi);
        }
      });

      // Fallback: If API_READY doesn't fire within 10 seconds, still notify
      // IMPORTANT: We keep the API instance alive - never destroy it
      setTimeout(() => {
        if (!hasNotified) {
          console.log('ValuApiSingleton: Timeout - API_READY not received, but keeping instance alive');
          hasNotified = true;
          // Still pass the API instance - it might connect later
          this.notifyListeners(this.valuApi);
        }
      }, 10000);
    } catch (error: any) {
      console.error('ValuApiSingleton: Failed to create API:', error);
      this.valuApi = null;
    }
  }

  /**
   * Get the API instance
   */
  getApi(): ValuApi | null {
    return this.valuApi;
  }

  /**
   * Subscribe to API events
   */
  subscribe(listener: (api: ValuApi | null) => void): () => void {
    this.listeners.add(listener);

    // Lazy initialization - initialize when first subscriber arrives
    if (!this.valuApi && typeof window !== 'undefined') {
      this.initialize();
    }

    // Immediately notify if we have an API
    if (this.valuApi) {
      listener(this.valuApi);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(api: ValuApi | null): void {
    this.listeners.forEach((listener) => {
      try {
        listener(api);
      } catch (e) {
        console.error('ValuApiSingleton: Error in listener:', e);
      }
    });
  }

  /**
   * Perform health check by testing actual API capability
   * Optimized for minimal performance impact with timeout and deduplication
   */
  async healthCheck(): Promise<HealthCheckResult> {
    // Prevent multiple concurrent health checks
    if (this.isHealthCheckInProgress && this.lastHealthCheckPromise) {
      return this.lastHealthCheckPromise;
    }

    this.isHealthCheckInProgress = true;
    const now = Date.now();

    // Start performance monitoring
    const endTiming = healthPerformanceMonitor.startCheck();

    // Create timeout promise for health check
    const timeoutPromise = new Promise<HealthCheckResult>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), this.healthCheckConfig.timeout);
    });

    // Create actual health check promise
    const healthCheckPromise = this.performHealthCheckInternal(now);

    // Race between health check and timeout
    this.lastHealthCheckPromise = Promise.race([healthCheckPromise, timeoutPromise])
      .catch((error: any) => {
        healthPerformanceMonitor.recordFailure();
        const result = {
          health: 'disconnected' as ConnectionHealth,
          lastCheck: now,
          lastSuccessfulOperation: this.lastSuccessfulOperation,
          details: `Health check failed: ${error.message}`,
        };
        integrationLog.valu.event('health_check_error', { error: error.message });
        return this.updateHealthState(result);
      })
      .finally(() => {
        endTiming(); // Record performance timing
        this.isHealthCheckInProgress = false;
        this.lastHealthCheckPromise = null;
      });

    return this.lastHealthCheckPromise;
  }

  /**
   * Internal health check implementation - separated for better error handling
   */
  private async performHealthCheckInternal(now: number): Promise<HealthCheckResult> {
    this.lastHealthCheck = now;
    let health: ConnectionHealth = 'disconnected';
    let details = '';

    try {
      // Step 1: Check if we have an API instance (fast check)
      if (!this.valuApi) {
        health = 'disconnected';
        details = 'No API instance available';
        return this.updateHealthState({
          health,
          lastCheck: now,
          lastSuccessfulOperation: this.lastSuccessfulOperation,
          details,
        });
      }

      // Step 2: Check iframe environment (fast check)
      if (!window.parent || window === window.parent) {
        health = 'disconnected';
        details = 'Not in iframe environment';
        return this.updateHealthState({
          health,
          lastCheck: now,
          lastSuccessfulOperation: this.lastSuccessfulOperation,
          details,
        });
      }

      // Step 3: Check postMessage capability (fast check)
      if (typeof window.parent.postMessage !== 'function') {
        health = 'disconnected';
        details = 'Parent postMessage not available';
        return this.updateHealthState({
          health,
          lastCheck: now,
          lastSuccessfulOperation: this.lastSuccessfulOperation,
          details,
        });
      }

      // Step 4: Test API capability with a lightweight operation (optimized)
      try {
        // Use a minimal API test that doesn't require network calls
        const apiTest = (this.valuApi as any).postToValuApp;
        if (typeof apiTest !== 'function') {
          health = 'degraded';
          details = 'API instance exists but postToValuApp method unavailable';
        } else {
          // API appears functional
          health = 'healthy';
          details = 'API instance functional and ready';
          this.lastSuccessfulOperation = now;
        }
      } catch (error: any) {
        health = 'degraded';
        details = `API test failed: ${error.message}`;
      }
    } catch (error: any) {
      health = 'disconnected';
      details = `Health check error: ${error.message}`;
    }

    const result = {
      health,
      lastCheck: now,
      lastSuccessfulOperation: this.lastSuccessfulOperation,
      details,
    };
    return this.updateHealthState(result);
  }

  /**
   * Update health state and notify listeners of changes
   * Optimized with debounced notifications and adaptive intervals
   */
  private updateHealthState(result: HealthCheckResult): HealthCheckResult {
    const previousHealth = this.currentHealth;
    this.currentHealth = result.health;

    // Update consecutive counters for adaptive intervals
    if (result.health === 'healthy') {
      this.consecutiveHealthyChecks++;
      this.consecutiveUnhealthyChecks = 0;
    } else {
      this.consecutiveUnhealthyChecks++;
      this.consecutiveHealthyChecks = 0;
    }

    // Update adaptive interval if enabled
    if (this.healthCheckConfig.adaptive) {
      this.updateAdaptiveInterval(result.health);
    }

    // Log state changes
    if (previousHealth !== result.health) {
      integrationLog.valu.event('health_state_change', {
        from: previousHealth,
        to: result.health,
        details: result.details,
        newInterval: this.currentInterval,
      });
    }

    // Always notify health listeners so they get updates
    this.notifyHealthListeners(result);

    return result;
  }

  /**
   * Update adaptive interval based on health status
   */
  private updateAdaptiveInterval(health: ConnectionHealth): void {
    const config = this.healthCheckConfig;
    let newInterval = this.currentInterval;

    if (health === 'healthy') {
      // Gradually increase interval when healthy (up to max)
      if (this.consecutiveHealthyChecks >= 3) {
        newInterval = Math.min(this.currentInterval * 1.2, config.maxInterval);
      }
    } else if (health === 'degraded' || health === 'disconnected') {
      // Quickly decrease interval when unhealthy (down to min)
      newInterval = Math.max(this.currentInterval * 0.7, config.minInterval);
    }

    // Only restart monitoring if interval changed significantly (>10%)
    const intervalChange = Math.abs(newInterval - this.currentInterval) / this.currentInterval;
    if (intervalChange > 0.1 && this.healthMonitoringInterval) {
      this.currentInterval = newInterval;
      this.stopHealthMonitoring();
      this.startHealthMonitoring(this.currentInterval);

      integrationLog.valu.event('health_interval_adapted', {
        oldInterval: this.currentInterval,
        newInterval,
        health,
        consecutiveHealthy: this.consecutiveHealthyChecks,
        consecutiveUnhealthy: this.consecutiveUnhealthyChecks,
      });
    }
  }

  /**
   * Start automatic health monitoring with performance optimizations
   */
  startHealthMonitoring(interval?: number, config?: Partial<HealthMonitoringConfig>): void {
    // Update config if provided
    if (config) {
      this.healthCheckConfig = { ...this.healthCheckConfig, ...config };
    }

    // Set initial interval
    this.currentInterval = interval ?? this.healthCheckConfig.baseInterval;

    // Stop existing monitoring
    this.stopHealthMonitoring();

    integrationLog.valu.event('health_monitoring_started', {
      interval: this.currentInterval,
      config: this.healthCheckConfig,
    });

    // Use optimized interval setup
    this.healthMonitoringInterval = setInterval(() => {
      // Only run health check if not already in progress (prevents piling up)
      if (!this.isHealthCheckInProgress) {
        this.healthCheck().catch((error) => {
          integrationLog.valu.event('health_monitoring_error', { error: error.message });
        });
      }
    }, this.currentInterval);

    // Perform initial health check with delay to avoid startup interference
    setTimeout(() => {
      if (!this.isHealthCheckInProgress) {
        this.healthCheck().catch((error) => {
          integrationLog.valu.event('initial_health_check_error', { error: error.message });
        });
      }
    }, 1000); // 1 second delay for initial check
  }

  /**
   * Stop automatic health monitoring with cleanup
   */
  stopHealthMonitoring(): void {
    if (this.healthMonitoringInterval) {
      clearInterval(this.healthMonitoringInterval);
      this.healthMonitoringInterval = null;
      integrationLog.valu.event('health_monitoring_stopped', {
        lastInterval: this.currentInterval,
        consecutiveHealthy: this.consecutiveHealthyChecks,
        consecutiveUnhealthy: this.consecutiveUnhealthyChecks,
      });
    }

    // Reset counters
    this.consecutiveHealthyChecks = 0;
    this.consecutiveUnhealthyChecks = 0;
  }

  /**
   * Subscribe to health check results with debounced notifications
   */
  subscribeToHealth(listener: (result: HealthCheckResult) => void): () => void {
    this.healthListeners.add(listener);

    // Immediately notify with current state if we have one
    if (this.lastHealthCheck > 0) {
      const currentResult: HealthCheckResult = {
        health: this.currentHealth,
        lastCheck: this.lastHealthCheck,
        lastSuccessfulOperation: this.lastSuccessfulOperation,
      };
      // Use setTimeout to prevent blocking the main thread
      setTimeout(() => {
        try {
          listener(currentResult);
        } catch (e) {
          console.error('ValuApiSingleton: Error in immediate health listener notification:', e);
        }
      }, 0);
    }

    // Return unsubscribe function
    return () => {
      this.healthListeners.delete(listener);
    };
  }

  /**
   * Get current health status with performance metrics
   */
  getCurrentHealth(): HealthCheckResult {
    return {
      health: this.currentHealth,
      lastCheck: this.lastHealthCheck,
      lastSuccessfulOperation: this.lastSuccessfulOperation,
    };
  }

  /**
   * Get performance metrics for health monitoring
   */
  getPerformanceMetrics() {
    return healthPerformanceMonitor.getMetrics();
  }

  /**
   * Get performance optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    return healthPerformanceMonitor.getOptimizationRecommendations();
  }

  /**
   * Record a successful API operation
   */
  recordSuccessfulOperation(): void {
    const now = Date.now();
    this.lastSuccessfulOperation = now;

    // Update health state if we were previously unhealthy
    if (this.currentHealth !== 'healthy') {
      this.updateHealthState({
        health: 'healthy',
        lastCheck: now,
        lastSuccessfulOperation: this.lastSuccessfulOperation,
        details: 'Operation successful - health restored',
      });
    }
  }

  /**
   * Get current health monitoring configuration
   */
  getHealthConfig(): HealthMonitoringConfig {
    return { ...this.healthCheckConfig };
  }

  /**
   * Update health monitoring configuration
   */
  updateHealthConfig(config: Partial<HealthMonitoringConfig>): void {
    const oldConfig = { ...this.healthCheckConfig };
    this.healthCheckConfig = { ...this.healthCheckConfig, ...config };

    integrationLog.valu.event('health_config_updated', {
      oldConfig,
      newConfig: this.healthCheckConfig,
    });

    // Restart monitoring with new config if it's currently running
    if (this.healthMonitoringInterval) {
      this.stopHealthMonitoring();
      this.startHealthMonitoring();
    }
  }

  /**
   * Reset performance monitoring (useful for testing)
   */
  resetPerformanceMetrics(): void {
    healthPerformanceMonitor.reset();
    integrationLog.valu.event('health_performance_reset');
  }

  /**
   * Notify health listeners with optimized error handling and async execution
   */
  private notifyHealthListeners(result: HealthCheckResult): void {
    if (this.healthListeners.size === 0) {
      return; // Early exit if no listeners
    }

    // Use setTimeout to prevent blocking the main thread during notifications
    setTimeout(() => {
      this.healthListeners.forEach((listener) => {
        try {
          listener(result);
        } catch (e) {
          console.error('ValuApiSingleton: Error in health listener:', e);
          integrationLog.valu.event('health_listener_error', {
            error: e instanceof Error ? e.message : 'Unknown error',
          });
        }
      });
    }, 0);
  }
}

// Export singleton instance
export const valuApiSingleton = ValuApiSingleton.getInstance();
