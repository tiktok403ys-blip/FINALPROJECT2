"use client"

import { Home, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeroProps {
  title: string
  description: string
  breadcrumbs: Breadcrumb[]
  author: string
  date: string
}

export default function PageHero({ title, description, breadcrumbs, author, date }: PageHeroProps) {
  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-black to-purple-900/20 py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>

      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="flex-1 space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="flex items-center text-gray-400 hover:text-[#00ff88] transition-colors">
                <Home className="w-4 h-4 mr-1" />
                Home
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-gray-400 hover:text-[#00ff88] transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[#00ff88]">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">{title}</h1>

            {/* Author Info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">{author.charAt(0)}</span>
              </div>
              <div className="text-sm">
                <span className="text-white font-medium">{author}</span>
                <span className="text-gray-400 ml-2">{date}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">{description}</p>
          </div>

          {/* Right Side - Mobile Mockup */}
          <div className="lg:w-96 relative">
            <div className="relative">
              {/* Phone Mockup */}
              <div className="w-80 h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-4 shadow-2xl border border-gray-700">
                <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center p-3 text-white text-xs">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 border border-white rounded-sm">
                        <div className="w-3 h-1 bg-[#00ff88] rounded-sm m-0.5"></div>
                      </div>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="px-4 pb-4">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-[#00ff88] rounded-xl flex items-center justify-center mx-auto mb-2">
                        <span className="text-black font-bold text-lg">G</span>
                      </div>
                      <h3 className="text-white font-bold text-sm">GURU</h3>
                      <p className="text-gray-400 text-xs">Singapore</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="space-y-2">
                      <div className="bg-[#00ff88]/20 rounded-lg p-3 border border-[#00ff88]/30">
                        <div className="flex justify-between items-center">
                          <span className="text-[#00ff88] text-xs">Safety Index</span>
                          <span className="text-white font-bold">9.2</span>
                        </div>
                      </div>
                      <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-400 text-xs">Reviews</span>
                          <span className="text-white font-bold">1,247</span>
                        </div>
                      </div>
                      <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-500/30">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-400 text-xs">Bonuses</span>
                          <span className="text-white font-bold">89</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full bg-[#00ff88] text-black font-bold py-3 rounded-lg mt-4 text-sm">
                      Explore Casinos
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -top-4 -right-4 bg-[#00ff88] text-black px-3 py-2 rounded-lg shadow-lg">
                <div className="text-xs font-bold">24,181</div>
                <div className="text-xs">Active Users</div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg">
                <div className="text-xs font-bold">98%</div>
                <div className="text-xs">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
