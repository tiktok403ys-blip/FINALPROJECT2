"use client"

import type React from "react"

import { ChevronRight, User, Calendar } from "lucide-react"
import Link from "next/link"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeroProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  author?: string
  date?: string
  children?: React.ReactNode
}

export function PageHero({ title, description, breadcrumbs, author, date, children }: PageHeroProps) {
  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-24 pb-16 min-h-[60vh]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/casino-bg-pattern.png')] opacity-5"></div>

      <div className="relative container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-2 text-sm text-gray-300">
                <Link href="/" className="hover:text-[#00ff88] transition-colors flex items-center">
                  <span>Home</span>
                </Link>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <ChevronRight className="w-4 h-4" />
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-[#00ff88] transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-white">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">{title}</h1>

            {/* Author & Date */}
            {(author || date) && (
              <div className="flex items-center gap-4 text-sm text-gray-300">
                {author && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-xs">G</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{author}</span>
                    </div>
                  </div>
                )}
                {date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{date}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {description && <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl">{description}</p>}

            {/* Children */}
            {children}
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone Mockup */}
              <div className="relative w-64 h-96 bg-black rounded-[2.5rem] border-4 border-gray-800 shadow-2xl">
                {/* Screen */}
                <div className="absolute inset-4 bg-gradient-to-br from-gray-900 to-black rounded-[1.5rem] overflow-hidden">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center p-4 text-white text-sm">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-white rounded-sm"></div>
                      <div className="w-4 h-2 bg-white rounded-sm"></div>
                      <div className="w-4 h-2 bg-white rounded-sm"></div>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="p-4 space-y-4">
                    {/* Logo */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#00ff88] rounded-xl flex items-center justify-center mx-auto mb-2">
                        <span className="text-black font-bold text-xl">G</span>
                      </div>
                      <div className="text-white font-bold">GURU</div>
                      <div className="text-gray-400 text-xs">Singapore</div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                        <div className="text-green-400 text-xs">Safety Index</div>
                        <div className="text-white font-bold text-lg">9.2</div>
                      </div>

                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                        <div className="text-blue-400 text-xs">Reviews</div>
                        <div className="text-white font-bold text-lg">1,247</div>
                      </div>

                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
                        <div className="text-purple-400 text-xs">Bonuses</div>
                        <div className="text-white font-bold text-lg">89</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-blue-500/20 rounded-lg p-3">
                      <div className="text-blue-400 text-xs mb-2">98% Satisfaction</div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-[#00ff88] h-2 rounded-full" style={{ width: "98%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -top-4 -right-4 bg-[#00ff88] text-black px-3 py-2 rounded-lg font-bold text-sm shadow-lg">
                24,181
                <div className="text-xs font-normal">Active Users</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageHero
