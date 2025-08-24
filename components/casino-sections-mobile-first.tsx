"use client"

import { ReactNode } from 'react'
import { GlassCard } from '@/components/glass-card'
import { cn } from '@/lib/utils'

interface SectionProps {
  title: string
  description: string
  icon: ReactNode
  className?: string
}

export function FeatureSectionMobileFirst({
  title,
  description,
  icon,
  className
}: SectionProps) {
  return (
    <div className={cn("text-center space-y-4 group", className)}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
        <div className="text-[#00ff88]">
          {icon}
        </div>
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
        {title}
      </h3>
      <p className="text-gray-400 text-sm sm:text-base leading-relaxed px-2">
        {description}
      </p>
    </div>
  )
}

interface MethodSectionProps {
  icon: ReactNode
  title: string
  description: string
  borderColor?: string
  className?: string
}

export function MethodSectionMobileFirst({
  icon,
  title,
  description,
  borderColor = "border-[#00ff88]",
  className
}: MethodSectionProps) {
  return (
    <div className={cn(`border-l-4 ${borderColor} pl-4 sm:pl-6`, className)}>
      <div className="flex items-start gap-3 mb-4">
        <div className="text-[#00ff88] mt-1">
          {icon}
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
          {title}
        </h3>
      </div>
      <p className="text-gray-300 leading-relaxed text-sm sm:text-base ml-9 sm:ml-11">
        {description}
      </p>
    </div>
  )
}

interface RatingGridProps {
  items: {
    icon: ReactNode
    title: string
    description: string
  }[]
}

export function RatingGridMobileFirst({ items }: RatingGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {items.map((item, index) => (
        <div key={index} className="text-center space-y-4 group">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
            <div className="text-[#00ff88]">
              {item.icon}
            </div>
          </div>
          <h4 className="text-[#00ff88] font-semibold text-sm sm:text-base">
            {item.title}
          </h4>
          <p className="text-gray-400 text-sm leading-relaxed">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  )
}

interface HeroSectionProps {
  title: string
  description: string
  className?: string
}

export function HeroSectionMobileFirst({
  title,
  description,
  className
}: HeroSectionProps) {
  return (
    <div className={cn("text-center py-8 sm:py-12 lg:py-16", className)}>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
        {title}
      </h1>
      <div className="w-16 h-1 sm:w-24 bg-[#00ff88] mx-auto mb-6"></div>
      <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-4xl mx-auto px-4">
        {description}
      </p>
    </div>
  )
}

interface ContentCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function ContentCardMobileFirst({
  title,
  children,
  className
}: ContentCardProps) {
  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <GlassCard className="p-6 sm:p-8 lg:p-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 text-center">
          {title}
        </h2>
        {children}
      </GlassCard>
    </div>
  )
}
