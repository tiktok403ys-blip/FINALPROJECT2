/**
 * Comprehensive Error Handling System
 * Advanced error management for casino application
 */

import { logger } from '@/lib/logger';
import { featureFlags } from '@/utils/feature-flags';

// Error types and classifications
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  PERFORMANCE = 'performance',
  FEATURE_FLAG = 'feature_flag',
  CACHE = 'cache',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  timestamp: number;
  url?: string;
  method?: string;
  params?: any;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorMetrics {
  errorId: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  context: ErrorContext;
  retryCount?: number;
  resolved?: boolean;
  resolutionTime?: number;
}

// Custom error classes
export class CasinoError extends Error {
  public readonly errorId: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly timestamp: number;
  public retryCount: number = 0;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {}
  ) {
    super(message);
    this.name = 'CasinoError';
    this.errorId = this.generateErrorId();
    this.category = category;
    this.severity = severity;
    this.timestamp = Date.now();
    this.context = {
      timestamp: this.timestamp,
      stackTrace: this.stack,
      ...context
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      errorId: this.errorId,
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp,
      context: this.context,
      retryCount: this.retryCount
    };
  }
}

export class DatabaseError extends CasinoError {
  constructor(message: string, severity: ErrorSeverity = ErrorSeverity.HIGH, context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.DATABASE, severity, context);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends CasinoError {
  constructor(message: string, severity: ErrorSeverity = ErrorSeverity.MEDIUM, context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.NETWORK, severity, context);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends CasinoError {
  constructor(message: string, context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.LOW, context);
    this.name = 'ValidationError';
  }
}

export class PerformanceError extends CasinoError {
  constructor(message: string, severity: ErrorSeverity = ErrorSeverity.MEDIUM, context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.PERFORMANCE, severity, context);
    this.name = 'PerformanceError';
  }
}

export class ConfigurationError extends CasinoError {
  constructor(message: string, severity: ErrorSeverity = ErrorSeverity.HIGH, context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.CONFIGURATION, severity, context);
    this.name = 'ConfigurationError';
  }
}

// Error handler class
class ErrorHandler {
  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private errorCallbacks: Map<ErrorCategory, ((error: CasinoError) => void)[]> = new Map();
  private retryStrategies: Map<ErrorCategory, (error: CasinoError) => boolean> = new Map();
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff

  constructor() {
    this.setupDefaultRetryStrategies();
    this.setupDefaultCallbacks();
  }

  private setupDefaultRetryStrategies() {
    // Network errors can be retried
    this.retryStrategies.set(ErrorCategory.NETWORK, (error) => {
      return error.retryCount < this.maxRetries;
    });

    // Database errors can be retried for certain cases
    this.retryStrategies.set(ErrorCategory.DATABASE, (error) => {
      const retryableMessages = [
        'connection timeout',
        'connection reset',
        'temporary failure',
        'deadlock detected'
      ];
      
      return error.retryCount < this.maxRetries && 
             retryableMessages.some(msg => error.message.toLowerCase().includes(msg));
    });

    // Performance errors should not be retried immediately
    this.retryStrategies.set(ErrorCategory.PERFORMANCE, () => false);

    // Validation errors should not be retried
    this.retryStrategies.set(ErrorCategory.VALIDATION, () => false);
  }

  private setupDefaultCallbacks() {
    // Critical errors should trigger immediate alerts
    this.onError(ErrorCategory.DATABASE, (error) => {
      if (error.severity === ErrorSeverity.CRITICAL) {
        this.triggerAlert(error);
      }
    });

    // Performance errors should be tracked for optimization
    this.onError(ErrorCategory.PERFORMANCE, (error) => {
      this.trackPerformanceIssue(error);
    });
  }

  /**
   * Handle an error with comprehensive logging and recovery
   */
  async handleError(error: Error | CasinoError, context?: Partial<ErrorContext>): Promise<CasinoError> {
    let casinoError: CasinoError;

    if (error instanceof CasinoError) {
      casinoError = error;
      // Update context if provided
      if (context) {
        Object.assign(casinoError.context, context);
      }
    } else {
      // Convert regular error to CasinoError
      casinoError = this.classifyError(error, context);
    }

    // Store error metrics
    this.storeErrorMetrics(casinoError);

    // Log the error
    this.logError(casinoError);

    // Execute callbacks
    await this.executeCallbacks(casinoError);

    // Check if error should be retried
    if (this.shouldRetry(casinoError)) {
      casinoError.retryCount++;
      await this.delay(this.getRetryDelay(casinoError.retryCount));
    }

    return casinoError;
  }

  /**
   * Classify unknown errors into appropriate categories
   */
  private classifyError(error: Error, context?: Partial<ErrorContext>): CasinoError {
    const message = error.message.toLowerCase();

    // Database-related errors
    if (message.includes('database') || message.includes('sql') || message.includes('connection')) {
      return new DatabaseError(error.message, ErrorSeverity.HIGH, context);
    }

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return new NetworkError(error.message, ErrorSeverity.MEDIUM, context);
    }

    // Validation errors
    if (message.includes('invalid') || message.includes('required') || message.includes('validation')) {
      return new ValidationError(error.message, context);
    }

    // Performance errors
    if (message.includes('slow') || message.includes('performance') || message.includes('timeout')) {
      return new PerformanceError(error.message, ErrorSeverity.MEDIUM, context);
    }

    // Default to unknown category
    return new CasinoError(error.message, ErrorCategory.UNKNOWN, ErrorSeverity.MEDIUM, context);
  }

  /**
   * Store error metrics for analysis
   */
  private storeErrorMetrics(error: CasinoError): void {
    const metrics: ErrorMetrics = {
      errorId: error.errorId,
      category: error.category,
      severity: error.severity,
      message: error.message,
      context: error.context,
      retryCount: error.retryCount
    };

    this.errorMetrics.set(error.errorId, metrics);

    // Keep only last 1000 errors to prevent memory leaks
    if (this.errorMetrics.size > 1000) {
      const oldestKey = this.errorMetrics.keys().next().value;
      if (oldestKey !== undefined) {
        this.errorMetrics.delete(oldestKey);
      }
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: CasinoError): void {
    const logContext = {
      component: 'ErrorHandler',
      metadata: {
        errorId: error.errorId,
        category: error.category,
        severity: error.severity,
        retryCount: error.retryCount,
        context: error.context
      }
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('CRITICAL ERROR: ' + error.message, error, logContext);
        break;
      case ErrorSeverity.HIGH:
        logger.error('High severity error: ' + error.message, error, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Medium severity error: ' + error.message, logContext);
        break;
      case ErrorSeverity.LOW:
        logger.info('Low severity error: ' + error.message, logContext);
        break;
    }
  }

  /**
   * Execute registered callbacks for error category
   */
  private async executeCallbacks(error: CasinoError): Promise<void> {
    const callbacks = this.errorCallbacks.get(error.category) || [];
    
    for (const callback of callbacks) {
      try {
        await callback(error);
      } catch (callbackError) {
        const error = callbackError instanceof Error ? callbackError : new Error(String(callbackError));
        logger.error('Error in error callback:', error, {
          component: 'ErrorHandler',
          metadata: { originalError: error.message }
        });
      }
    }
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: CasinoError): boolean {
    const strategy = this.retryStrategies.get(error.category);
    return strategy ? strategy(error) : false;
  }

  /**
   * Get retry delay with exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    const index = Math.min(retryCount - 1, this.retryDelays.length - 1);
    const baseDelay = this.retryDelays[index];
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * baseDelay;
    return baseDelay + jitter;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Register error callback
   */
  onError(category: ErrorCategory, callback: (error: CasinoError) => void): void {
    if (!this.errorCallbacks.has(category)) {
      this.errorCallbacks.set(category, []);
    }
    this.errorCallbacks.get(category)!.push(callback);
  }

  /**
   * Register retry strategy
   */
  setRetryStrategy(category: ErrorCategory, strategy: (error: CasinoError) => boolean): void {
    this.retryStrategies.set(category, strategy);
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values());
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): Record<string, any> {
    const metrics = this.getErrorMetrics();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentErrors = metrics.filter(m => now - m.context.timestamp < oneHour);

    const stats = {
      total: metrics.length,
      recent: recentErrors.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      averageRetries: 0,
      mostCommonErrors: [] as Array<{ message: string; count: number }>
    };

    // Count by category and severity
    metrics.forEach(metric => {
      stats.byCategory[metric.category] = (stats.byCategory[metric.category] || 0) + 1;
      stats.bySeverity[metric.severity] = (stats.bySeverity[metric.severity] || 0) + 1;
    });

    // Calculate average retries
    const totalRetries = metrics.reduce((sum, m) => sum + (m.retryCount || 0), 0);
    stats.averageRetries = metrics.length > 0 ? totalRetries / metrics.length : 0;

    // Find most common errors
    const errorCounts = new Map<string, number>();
    metrics.forEach(metric => {
      const count = errorCounts.get(metric.message) || 0;
      errorCounts.set(metric.message, count + 1);
    });

    stats.mostCommonErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Clear error metrics
   */
  clearMetrics(): void {
    this.errorMetrics.clear();
  }

  /**
   * Trigger alert for critical errors
   */
  private triggerAlert(error: CasinoError): void {
    // In a real implementation, this would send alerts via email, Slack, etc.
    logger.error('CRITICAL ALERT: ' + error.message, error, {
      component: 'ErrorHandler',
      metadata: {
        errorId: error.errorId,
        category: error.category,
        context: error.context
      }
    });

    // Could integrate with external alerting services
    // In production, this would send to external alerting service
  }

  /**
   * Track performance issues
   */
  private trackPerformanceIssue(error: PerformanceError): void {
    // Track performance metrics for optimization
    logger.warn('Performance issue detected: ' + error.message, {
      component: 'ErrorHandler',
      metadata: {
        errorId: error.errorId,
        context: error.context
      }
    });
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Convenience functions
export const handleError = (error: Error | CasinoError, context?: Partial<ErrorContext>) => 
  errorHandler.handleError(error, context);

export const onError = (category: ErrorCategory, callback: (error: CasinoError) => void) => 
  errorHandler.onError(category, callback);

export const setRetryStrategy = (category: ErrorCategory, strategy: (error: CasinoError) => boolean) => 
  errorHandler.setRetryStrategy(category, strategy);

export const getErrorMetrics = () => errorHandler.getErrorMetrics();
export const getErrorStatistics = () => errorHandler.getErrorStatistics();
export const clearErrorMetrics = () => errorHandler.clearMetrics();

// Default export
export default errorHandler;