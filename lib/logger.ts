/**
 * Production-safe logging utility
 * Prevents console statements from appearing in production builds
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug'

interface LogContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, any>
}

class Logger {
  private isDevelopment: boolean
  private isProduction: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  /**
   * General logging - only in development
   */
  log(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('LOG', message, context))
    }
  }

  /**
   * Error logging - always enabled but sanitized in production
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(this.formatMessage('ERROR', message, context))
      if (error) {
        console.error('Stack trace:', error.stack)
      }
    } else if (this.isProduction) {
      // In production, only log sanitized errors to external service
      this.logToExternalService('error', message, context)
    }
  }

  /**
   * Warning logging - only in development
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('WARN', message, context))
    }
  }

  /**
   * Info logging - only in development
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('INFO', message, context))
    }
  }

  /**
   * Debug logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }

  /**
   * Security event logging - always enabled
   */
  security(event: string, context?: LogContext): void {
    const securityMessage = this.formatMessage('SECURITY', event, context)
    
    if (this.isDevelopment) {
      console.warn('🔒 SECURITY EVENT:', securityMessage)
    }
    
    // Always log security events to external service
    this.logToExternalService('security', event, context)
  }

  /**
   * Performance logging - only in development
   */
  performance(label: string, duration: number, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('PERF', `${label}: ${duration}ms`, context))
    }
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level}] ${message}${contextStr}`
  }

  /**
   * Log to external service (Sentry, etc.) in production
   */
  private logToExternalService(level: string, message: string, context?: LogContext): void {
    // In production, send to monitoring service
    if (typeof window !== 'undefined' && this.isProduction) {
      // Client-side logging to external service
      fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          context,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {
        // Silent fail - don't log errors about logging
      })
    }
  }
}

// Create singleton instance
const logger = new Logger()

// Export individual methods for easy replacement of console.*
export const log = logger.log.bind(logger)
export const error = logger.error.bind(logger)
export const warn = logger.warn.bind(logger)
export const info = logger.info.bind(logger)
export const debug = logger.debug.bind(logger)
export const security = logger.security.bind(logger)
export const performance = logger.performance.bind(logger)

// Export logger instance for advanced usage
export { logger }
export default logger

// Type exports
export type { LogLevel, LogContext }