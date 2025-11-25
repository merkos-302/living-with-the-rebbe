/**
 * Health Performance Monitor
 * Tracks performance metrics for Valu API health checks
 * Based on universe-portal implementation
 */

interface PerformanceMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  lastCheckTime: number;
}

class HealthPerformanceMonitor {
  private metrics: PerformanceMetrics = {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    averageResponseTime: 0,
    lastCheckTime: 0,
  };

  private responseTimes: number[] = [];
  private readonly MAX_RESPONSE_TIMES = 100; // Keep last 100 measurements

  startCheck(): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);

      // Keep only the last MAX_RESPONSE_TIMES measurements
      if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
        this.responseTimes.shift();
      }

      // Update average
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageResponseTime = sum / this.responseTimes.length;
      this.metrics.lastCheckTime = Date.now();
      this.metrics.totalChecks++;
      this.metrics.successfulChecks++;
    };
  }

  recordFailure(): void {
    this.metrics.totalChecks++;
    this.metrics.failedChecks++;
    this.metrics.lastCheckTime = Date.now();
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.averageResponseTime > 1000) {
      recommendations.push('Consider increasing health check interval due to slow response times');
    }

    if (this.metrics.failedChecks / this.metrics.totalChecks > 0.2) {
      recommendations.push('High failure rate detected - consider investigating connection issues');
    }

    return recommendations;
  }

  reset(): void {
    this.metrics = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      lastCheckTime: 0,
    };
    this.responseTimes = [];
  }
}

export const healthPerformanceMonitor = new HealthPerformanceMonitor();
