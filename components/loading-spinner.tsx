'use client'

import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

export function LoadingSpinner({ size = "md", text = "Loading...", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-[#00ff88]`} />
        <div className="absolute inset-0 rounded-full border-2 border-[#00ff88]/20 animate-ping" />
      </div>
      {text && <p className="text-gray-400 text-sm mt-3 text-center max-w-xs">{text}</p>}
    </div>
  )
}

// Enhanced Error State Component
interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again or refresh the page",
  onRetry,
  className = ""
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#00ff88] text-black rounded-lg hover:bg-[#00ff88]/90 transition-colors font-medium min-h-[44px] min-w-[44px]"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      {icon && <div className="mb-4 opacity-60">{icon}</div>}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm mb-6 max-w-md">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-[#00ff88] text-black rounded-lg hover:bg-[#00ff88]/90 transition-colors font-medium min-h-[48px]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Success State Component
interface SuccessStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function SuccessState({
  icon,
  title,
  description,
  action,
  className = ""
}: SuccessStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      {icon && <div className="mb-4 text-[#00ff88]">{icon}</div>}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm mb-6 max-w-md">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-[#00ff88] text-black rounded-lg hover:bg-[#00ff88]/90 transition-colors font-medium min-h-[48px]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-purple-900/20 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 space-y-4 md:space-y-6">
              <div className="h-4 bg-gray-700 rounded w-32 md:w-48 animate-pulse"></div>
              <div className="h-8 md:h-12 bg-gray-700 rounded w-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-24 md:w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="lg:w-96 w-full max-w-xs md:max-w-sm">
              <div className="w-full h-80 md:h-96 bg-gray-700 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-700 rounded-full mx-auto animate-pulse"></div>
                <div className="h-5 md:h-6 bg-gray-700 rounded w-3/4 mx-auto animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-3 md:h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                  <div className="h-3 md:h-4 bg-gray-700 rounded w-2/3 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-700 rounded animate-pulse mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
