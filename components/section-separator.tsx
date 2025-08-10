"use client"

interface SectionSeparatorProps {
  variant?: "default" | "gradient" | "dotted" | "wave"
  className?: string
}

export function SectionSeparator({ variant = "default", className = "" }: SectionSeparatorProps) {
  const baseClasses = "w-full flex items-center justify-center py-4 md:py-6 lg:py-8"

  const variants = {
    default: <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-border to-transparent" />,
    gradient: (
      <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-[#00ff88]/50 to-transparent relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff88]/20 to-transparent blur-sm" />
      </div>
    ),
    dotted: (
      <div className="flex items-center space-x-2">
        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#00ff88]/60 rounded-full animate-pulse" />
        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#00ff88] rounded-full animate-pulse delay-150" />
        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#00ff88]/60 rounded-full animate-pulse delay-300" />
      </div>
    ),
    wave: (
      <div className="w-full max-w-lg">
        <svg viewBox="0 0 400 8" className="w-full h-2 md:h-3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 4 Q100 0 200 4 T400 4"
            stroke="url(#waveGradient)"
            strokeWidth="1.5"
            fill="none"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="25%" stopColor="#00ff88" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#00ff88" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#00ff88" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
  }

  return <div className={`${baseClasses} ${className}`}>{variants[variant]}</div>
}
