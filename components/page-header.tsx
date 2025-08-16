"use client"

import { ChevronRight, User } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  author?: {
    name: string
    avatar?: string
    date?: string
  }
  className?: string
}

export function PageHeader({ title, description, breadcrumbs = [], author, className }: PageHeaderProps) {
  return (
    <div className={cn("bg-muted/30 border-b", className)}>
      <div className="container mx-auto px-4 py-4 md:py-6 lg:py-8">
        {/* Breadcrumbs - More compact on mobile */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1 text-xs md:text-sm text-muted-foreground mb-2 md:mb-4 overflow-x-auto">
            <Link href="/" className="hover:text-[#6366f1] transition-colors whitespace-nowrap">
              Home
            </Link>
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center space-x-1 whitespace-nowrap">
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                {item.href ? (
                  <Link href={item.href} className="hover:text-[#00ff88] transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1 md:mb-2">{title}</h1>
            {description && <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{description}</p>}
          </div>

          {/* Author Info - Compact mobile layout */}
          {author && (
            <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground bg-background/50 rounded-lg px-3 py-2 md:px-4 md:py-3 border">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
                {author.avatar ? (
                  <img
                    src={author.avatar || "/placeholder.svg"}
                    alt={author.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-3 h-3 md:w-4 md:h-4 text-[#00ff88]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">{author.name}</div>
                {author.date && <div className="text-xs text-muted-foreground">{author.date}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
