import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-md bg-white/5 border border-white/10 rounded-xl shadow-xl",
        hover && "hover:bg-white/10 hover:border-white/20 transition-all duration-300",
        className,
      )}
    >
      {children}
    </div>
  )
}
