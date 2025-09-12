import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  style?: React.CSSProperties
}

export function GlassCard({ children, className, hover = true, style }: GlassCardProps) {
  return (
    <div
      className={cn(
        // Consistent glass effect with navbar/toast
        "backdrop-filter backdrop-blur-xl saturate-180",
        "bg-black/50",
        "border border-white/20",
        "rounded-xl",
        "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]",
        // Hover effects
        hover && "hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] hover:border-white/30 transition-all duration-300",
        // Mobile-first responsive adjustments
        "sm:rounded-2xl", // Slightly more rounded on larger screens
        // Performance optimization for smooth scrolling
        "bonus-card-glass",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}
