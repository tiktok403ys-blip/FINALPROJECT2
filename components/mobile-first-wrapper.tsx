"use client"

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useMobileFirst, useSafeArea, useReducedMotion } from '@/hooks/use-mobile-first'
import { MOBILE_FIRST_CONFIG } from '@/lib/mobile-first-config'

interface MobileFirstWrapperProps {
  children: ReactNode
  className?: string
  enableSafeArea?: boolean
  enableTouchOptimization?: boolean
  enableFluidTypography?: boolean
  fullHeight?: boolean
}

export function MobileFirstWrapper({
  children,
  className,
  enableSafeArea = true,
  enableTouchOptimization = true,
  enableFluidTypography = true,
  fullHeight = false,
}: MobileFirstWrapperProps) {
  const { isMobile, isTablet } = useMobileFirst()
  const safeArea = useSafeArea()
  const prefersReducedMotion = useReducedMotion()

  const containerClasses = cn(
    // Base container styles
    "w-full",
    fullHeight && "min-h-screen",

    // Mobile-first responsive container
    "px-4 sm:px-6 lg:px-8",

    // Safe area handling
    enableSafeArea && [
      "pt-[max(1rem,env(safe-area-inset-top))]",
      "pb-[max(1rem,env(safe-area-inset-bottom))]",
      "pl-[max(1rem,env(safe-area-inset-left))]",
      "pr-[max(1rem,env(safe-area-inset-right))]",
    ],

    // Touch optimization for mobile devices
    enableTouchOptimization && isMobile && [
      // Enhanced touch targets
      "[&_*]:min-h-[44px]",
      "[&_button]:min-h-[44px]",
      "[&_a]:min-h-[44px]",
      "[&_input]:min-h-[44px]",

      // Better tap highlights
      "[&_*]:tap-highlight-transparent",
    ],

    // Fluid typography
    enableFluidTypography && [
      "[&_p]:text-[clamp(0.875rem,4vw,1rem)]",
      "[&_h1]:text-[clamp(1.5rem,8vw,2.5rem)]",
      "[&_h2]:text-[clamp(1.25rem,6vw,2rem)]",
      "[&_h3]:text-[clamp(1.125rem,5vw,1.75rem)]",
      "[&_h4]:text-[clamp(1rem,4vw,1.5rem)]",
      "[&_h5]:text-[clamp(0.875rem,3vw,1.25rem)]",
      "[&_h6]:text-[clamp(0.75rem,2vw,1rem)]",
    ],

    // Reduced motion preferences
    prefersReducedMotion && [
      "[&_button]:transition-none",
      "[&_a]:transition-none",
      "[&_*]:animate-none",
    ],

    className
  )

  return (
    <div
      className={containerClasses}
      style={{
        // CSS custom properties for safe area
        '--safe-area-top': safeArea.top,
        '--safe-area-bottom': safeArea.bottom,
        '--safe-area-left': safeArea.left,
        '--safe-area-right': safeArea.right,

        // Viewport height fix for mobile browsers
        minHeight: isMobile ? '100dvh' : '100vh',
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

// Specialized wrapper for content sections
export function MobileFirstContent({
  children,
  className,
  maxWidth = 'max-w-4xl',
  centered = true,
}: {
  children: ReactNode
  className?: string
  maxWidth?: string
  centered?: boolean
}) {
  return (
    <MobileFirstWrapper
      className={cn(
        "py-8 sm:py-12 lg:py-16",
        centered && "flex flex-col items-center justify-center",
        maxWidth,
        "mx-auto",
        className
      )}
    >
      {children}
    </MobileFirstWrapper>
  )
}

// Wrapper for mobile-first cards
export function MobileFirstCard({
  children,
  className,
  glass = true,
  padding = 'p-6',
}: {
  children: ReactNode
  className?: string
  glass?: boolean
  padding?: string
}) {
  const { isMobile } = useMobileFirst()

  return (
    <div
      className={cn(
        // Base card styles
        "rounded-xl border",
        padding,

        // Glass effect
        glass && [
          "backdrop-filter backdrop-blur-xl saturate-180",
          "bg-black/50",
          "border-white/20",
          "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]",
        ],

        // Mobile-specific adjustments
        isMobile && [
          "mx-4",
          "rounded-2xl", // Slightly more rounded on mobile
        ],

        className
      )}
    >
      {children}
    </div>
  )
}

// Mobile-first button component
export function MobileFirstButton({
  children,
  className,
  variant = 'primary',
  size = 'medium',
  ...props
}: {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isMobile } = useMobileFirst()

  const sizeClasses = {
    small: isMobile ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-sm',
    medium: isMobile ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm',
    large: isMobile ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base',
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] shadow-lg',
    secondary: 'bg-black/50 backdrop-filter backdrop-blur-xl border border-white/20 text-white hover:bg-white/10',
    ghost: 'text-gray-300 hover:text-white hover:bg-white/10 border-0',
  }

  return (
    <button
      className={cn(
        // Base button styles
        'rounded-xl font-semibold transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-[#00ff88]/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // Touch optimization
        'min-h-[44px] min-w-[44px]',

        // Size and variant
        sizeClasses[size],
        variantClasses[variant],

        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
