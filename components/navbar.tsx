"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Home,
  Building2,
  Gift,
  Star,
  Newspaper,
  FileText,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Check if we're on home page
  const isHomePage = pathname === "/"

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(true)
      return
    }

    let lastScrollY = window.scrollY
    let ticking = false

    const updateScrollDir = () => {
      const scrollY = window.scrollY
      const heroHeight = window.innerHeight * 0.8

      if (scrollY < heroHeight) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScrollY = scrollY > 0 ? scrollY : 0
      ticking = false
    }

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDir)
        ticking = true
      }
    }

    const onScroll = () => requestTick()

    // Initial check
    updateScrollDir()

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [isHomePage])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Casinos", href: "/casinos", icon: Building2 },
    { name: "Bonuses", href: "/bonuses", icon: Gift },
    { name: "Reviews", href: "/reviews", icon: Star },
    { name: "News", href: "/news", icon: Newspaper },
    { name: "Reports", href: "/reports", icon: FileText },
  ]

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl px-6 py-3">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                <span className="text-black font-bold text-sm">G</span>
              </div>
              <span className="text-white font-bold text-lg">GuruSingapore</span>
            </Link>

            {/* Navigation Items */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 group ${
                      isActive
                        ? "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Auth Section */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 text-white"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-xs">{user.email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium">{user.email?.split("@")[0]}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${showUserMenu ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <hr className="my-2 border-white/10" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 border-0" asChild>
                    <Link href="/auth/login">Login</Link>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold transition-all duration-300 hover:scale-105"
                    asChild
                  >
                    <Link href="/auth/register">Register</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="absolute top-20 left-4 right-4 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-4 max-w-xs mx-auto">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-sm ${
                      isActive
                        ? "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}

              <hr className="border-white/10 my-3" />

              {user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-white text-sm">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-xs">{user.email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-medium truncate">{user.email?.split("@")[0]}</span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsOpen(false)
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 border-0 h-8"
                    asChild
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href="/auth/login">Login</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold h-8"
                    asChild
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href="/auth/register">Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
