"use client"

import React from 'react'
import { GlassCard } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Smartphone,
  Home,
  Bug,
  Zap,
  Shield
} from 'lucide-react'
import { useMobileFirst } from '@/hooks/use-mobile-first'
import { trackEvent } from '@/lib/analytics'

interface ErrorInfo {
  componentStack: string
  message: string
  name: string
  stack?: string
}

interface MobileErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
  isOnline: boolean
}

interface MobileErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
  showErrorDetails?: boolean
  enableRetry?: boolean
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
  isOnline: boolean
  onRetry: () => void
  onGoHome: () => void
  onReport: () => void
}

// Mobile-optimized error fallback component
function MobileErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  isOnline,
  onRetry,
  onGoHome,
  onReport
}: ErrorFallbackProps) {
  const { isMobile } = useMobileFirst()
  const [isExpanded, setIsExpanded] = React.useState(false)

  const getErrorType = (error: Error | null): 'network' | 'component' | 'runtime' | 'unknown' => {
    if (!error) return 'unknown'

    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    if (message.includes('network') || message.includes('fetch') || !isOnline) {
      return 'network'
    }

    if (message.includes('component') || stack.includes('react')) {
      return 'component'
    }

    if (message.includes('script') || message.includes('javascript')) {
      return 'runtime'
    }

    return 'unknown'
  }

  const errorType = getErrorType(error)

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return isOnline ? <WifiOff className="w-8 h-8" /> : <Wifi className="w-8 h-8" />
      case 'component':
        return <Bug className="w-8 h-8" />
      case 'runtime':
        return <Zap className="w-8 h-8" />
      default:
        return <AlertTriangle className="w-8 h-8" />
    }
  }

  const getErrorMessage = () => {
    switch (errorType) {
      case 'network':
        return isOnline
          ? 'Connection problem occurred'
          : 'You appear to be offline'
      case 'component':
        return 'Something went wrong with this component'
      case 'runtime':
        return 'A script error occurred'
      default:
        return 'An unexpected error occurred'
    }
  }

  const getErrorDescription = () => {
    switch (errorType) {
      case 'network':
        return isOnline
          ? 'Please check your internet connection and try again.'
          : 'Please check your internet connection and try again when online.'
      case 'component':
        return 'This part of the page failed to load. You can try refreshing or go back to the home page.'
      case 'runtime':
        return 'There was a problem running some code on this page. Try refreshing the page.'
      default:
        return 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'
    }
  }

  return (
    <GlassCard className={`${isMobile ? 'p-4 m-4' : 'p-6 max-w-2xl mx-auto'}`}>
      <div className="space-y-4">
        {/* Error Icon & Basic Info */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <div className="text-red-400">
              {getErrorIcon()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {getErrorMessage()}
            </h3>
            <p className="text-sm text-gray-400">
              Error ID: {errorId}
            </p>
          </div>
        </div>

        {/* Error Description */}
        <div className="bg-black/30 rounded-lg p-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            {getErrorDescription()}
          </p>
        </div>

        {/* Error Details (Collapsible) */}
        {isExpanded && (
          <div className="bg-black/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Error Details</h4>
              <span className="text-xs text-gray-400">Tap to copy</span>
            </div>

            {error && (
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-400">Error:</span>
                  <p className="text-xs text-red-300 font-mono break-all">
                    {error.message}
                  </p>
                </div>

                {error.stack && (
                  <div>
                    <span className="text-xs text-gray-400">Stack Trace:</span>
                    <pre className="text-xs text-gray-300 font-mono bg-black/30 p-2 rounded mt-1 overflow-x-auto">
                      {error.stack.slice(0, 500)}...
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'space-x-3'}`}>
          {onRetry && retryCount < 3 && (
            <Button
              onClick={onRetry}
              className="flex-1 bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again {retryCount > 0 && `(${retryCount})`}
            </Button>
          )}

          <Button
            onClick={onGoHome}
            variant="outline"
            className={`border-white/20 text-white hover:bg-white/10 ${
              isMobile ? 'w-full' : 'flex-1'
            }`}
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Additional Actions */}
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'}`}>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <Bug className="w-4 h-4 mr-2" />
            {isExpanded ? 'Hide' : 'Show'} Details
          </Button>

          <div className={`flex ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
            <Button
              onClick={onReport}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Report Issue
            </Button>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Smartphone className="w-3 h-3" />
              <span>{isMobile ? 'Mobile' : 'Desktop'}</span>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
          </div>
        </div>

        {/* Retry Limit Warning */}
        {retryCount >= 3 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-sm text-yellow-400">
              Maximum retry attempts reached. The error may be persistent.
              Please contact support if this continues.
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

// Main mobile error boundary class component
export class MobileErrorBoundary extends React.Component<
  MobileErrorBoundaryProps,
  MobileErrorBoundaryState
> {
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: MobileErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isOnline: true
    }
  }

  static getDerivedStateFromError(error: Error): Partial<MobileErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Generate error info
    const errorInfoParsed: ErrorInfo = {
      componentStack: errorInfo.componentStack || 'No component stack available',
      message: error.message,
      name: error.name,
      stack: error.stack || 'No stack trace available'
    }

    this.setState({
      errorInfo: errorInfoParsed
    })

    // Track error with analytics
    trackEvent({
      action: 'error_boundary_caught',
      category: 'Error',
      label: error.name,
      customParameters: {
        error_message: error.message,
        error_id: this.state.errorId,
        component_stack: errorInfo.componentStack,
        retry_count: this.state.retryCount,
        user_agent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      }
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfoParsed)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary Caught:', error)
      console.error('Error Info:', errorInfo)
    }
  }

  componentDidMount() {
    // Monitor online/offline status
    const handleOnline = () => this.setState({ isOnline: true })
    const handleOffline = () => this.setState({ isOnline: false })

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial online status
    this.setState({ isOnline: navigator.onLine })
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }

    window.removeEventListener('online', () => {})
    window.removeEventListener('offline', () => {})
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props

    if (this.state.retryCount >= maxRetries) {
      return
    }

    trackEvent({
      action: 'error_boundary_retry',
      category: 'Error',
      label: this.state.errorId,
      value: this.state.retryCount + 1,
      customParameters: {
        error_id: this.state.errorId,
        retry_attempt: this.state.retryCount + 1,
        max_retries: maxRetries
      }
    })

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleGoHome = () => {
    trackEvent({
      action: 'error_boundary_go_home',
      category: 'Error',
      label: this.state.errorId,
      customParameters: {
        error_id: this.state.errorId,
        retry_count: this.state.retryCount,
        final_action: 'go_home'
      }
    })

    window.location.href = '/'
  }

  handleReport = () => {
    const errorReport = {
      errorId: this.state.errorId,
      error: this.state.error?.message,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
      isOnline: this.state.isOnline
    }

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))

    trackEvent({
      action: 'error_boundary_report',
      category: 'Error',
      label: this.state.errorId,
      customParameters: {
        error_id: this.state.errorId,
        copied_to_clipboard: true
      }
    })

    // Show feedback
    alert('Error report copied to clipboard. Please share this with support.')
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || MobileErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          isOnline={this.state.isOnline}
          onRetry={this.props.enableRetry !== false ? this.handleRetry : (() => {})}
          onGoHome={this.handleGoHome}
          onReport={this.handleReport}
        />
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier use
export function MobileErrorBoundaryWrapper({
  children,
  ...props
}: MobileErrorBoundaryProps) {
  return (
    <MobileErrorBoundary {...props}>
      {children}
    </MobileErrorBoundary>
  )
}

// Specialized error boundaries for different use cases
export function CasinoErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <MobileErrorBoundaryWrapper
      showErrorDetails={false}
      maxRetries={2}
      onError={(error, errorInfo) => {
        console.error('Casino Component Error:', { error, errorInfo })
      }}
    >
      {children}
    </MobileErrorBoundaryWrapper>
  )
}

export function SearchErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <MobileErrorBoundaryWrapper
      showErrorDetails={false}
      maxRetries={3}
      fallback={({ onRetry }) => (
        <GlassCard className="p-4 m-4">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Search Error</h3>
              <p className="text-gray-400 text-sm">Unable to perform search. Please try again.</p>
            </div>
            <Button onClick={onRetry} className="bg-[#00ff88] text-black">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Search
            </Button>
          </div>
        </GlassCard>
      )}
    >
      {children}
    </MobileErrorBoundaryWrapper>
  )
}

export function NetworkErrorBoundary({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOnline) {
    return (
      <GlassCard className="p-4 m-4">
        <div className="text-center space-y-4">
          <WifiOff className="w-8 h-8 text-red-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">No Internet Connection</h3>
            <p className="text-gray-400 text-sm">Please check your connection and try again.</p>
          </div>
        </div>
      </GlassCard>
    )
  }

  return <>{children}</>
}

// Performance monitoring for error boundaries
export function useErrorMonitoring() {
  const [errorStats, setErrorStats] = React.useState({
    totalErrors: 0,
    componentErrors: 0,
    networkErrors: 0,
    runtimeErrors: 0,
    lastError: null as Error | null,
    lastErrorTime: null as Date | null
  })

  const reportError = React.useCallback((error: Error, type: string = 'unknown') => {
    setErrorStats(prev => ({
      ...prev,
      totalErrors: prev.totalErrors + 1,
      lastError: error,
      lastErrorTime: new Date(),
      ...(type === 'component' && { componentErrors: prev.componentErrors + 1 }),
      ...(type === 'network' && { networkErrors: prev.networkErrors + 1 }),
      ...(type === 'runtime' && { runtimeErrors: prev.runtimeErrors + 1 })
    }))

    // Track with analytics
    trackEvent({
      action: 'error_monitored',
      category: 'Error Monitoring',
      label: type,
      customParameters: {
        error_message: error.message,
        error_type: type,
        timestamp: Date.now()
      }
    })
  }, [])

  return {
    errorStats,
    reportError
  }
}
