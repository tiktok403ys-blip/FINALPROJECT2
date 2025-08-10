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
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-[#00ff88] mb-2`} />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  )
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-purple-900/20 py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="h-4 bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-12 bg-gray-700 rounded w-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="lg:w-96">
              <div className="w-80 h-96 bg-gray-700 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto animate-pulse"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
