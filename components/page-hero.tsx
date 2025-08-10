"use client"

import type { ReactNode } from "react"

interface PageHeroProps {
  title?: string
  description?: string
  children?: ReactNode
  className?: string
  backgroundImage?: string
  overlay?: boolean
}

export function PageHero({
  title,
  description,
  children,
  className = "",
  backgroundImage,
  overlay = true,
}: PageHeroProps) {
  return (
    <section
      className={`relative min-h-[60vh] flex items-center justify-center ${className}`}
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {}
      }
    >
      {/* Overlay */}
      {overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {title && <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">{title}</h1>}

        {description && (
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">{description}</p>
        )}

        {children}
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  )
}

// Named export

// Default export
export default PageHero
