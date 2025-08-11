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
  Shield,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: string
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Check if we're on home page
  const isHomePage = pathname === "/"

  useEffect(() => {
    let mounted = true
    let profileFetched = false

    // Get initial session and user
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...")
        setIsLoading(true)

        // First, get the session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          if (mounted) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
          return
        }

        if (session?.user && mounted) {
          console.log("User found:", session.user.email)
          setUser(session.user)

          // Only fetch profile if we haven't already
          if (!profileFetched) {
            profileFetched = true
            await fetchUserProfile(session.user.id)
          }
        } else if (mounted) {
          console.log("No user session")
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    const fetchUserProfile = async (userId: string) => {
      if (!mounted || profileLoading) return

      try {
        console.log("Fetching profile for user:", userId)
        setProfileLoading(true)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, role")
          .eq("id", userId)
          .single()

        if (profileError) {
          console.error("Profile error:", profileError)
          // If profile doesn't exist, create a basic one
          if (profileError.code === "PGRST116") {
            console.log("Profile not found, creating basic profile...")
            const { data: userData } = await supabase.auth.getUser()
            if (userData.user && mounted) {
              const basicProfile: Profile = {
                id: userData.user.id,
                email: userData.user.email || "",
                full_name: userData.user.user_metadata?.full_name || null,
                avatar_url: userData.user.user_metadata?.avatar_url || null,
                role: "user",
              }
              setProfile(basicProfile)
            }
          }
        } else if (mounted && profileData) {
          console.log("Profile loaded:", profileData)
          setProfile(profileData)
        }
      } catch (error) {
        console.error("Profile fetch error:", error)
        // Set basic profile from user data as fallback
        if (mounted && user) {
          const basicProfile: Profile = {
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            role: "user",
          }
          setProfile(basicProfile)
        }
      } finally {
        if (mounted) {
          setProfileLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth event:", event)

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setIsLoading(false)

        // Reset profile fetched flag and fetch profile
        profileFetched = false
        await fetchUserProfile(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setShowUserMenu(false)
        setIsSigningOut(false)
        setIsLoading(false)
        profileFetched = false

        // Clear auth cookies
        clearAuthCookies()
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user)
        setIsLoading(false)
        // Don't refetch profile on token refresh if we already have it
        if (!profile && !profileFetched) {
          profileFetched = false
          await fetchUserProfile(session.user.id)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Remove dependencies to prevent infinite loops

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

  const clearAuthCookies = () => {
    // Clear Supabase auth cookies
    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token",
      "supabase-auth-token",
      "supabase.auth.token",
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`,
    ]

    cookiesToClear.forEach((cookieName) => {
      // Clear for current domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`
    })

    // Clear localStorage
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("supabase") || key.includes("sb-")) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("Error clearing localStorage:", error)
    }

    // Clear sessionStorage
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.includes("supabase") || key.includes("sb-")) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("Error clearing sessionStorage:", error)
    }
  }

  const handleSignOut = async () => {
    if (isSigningOut) return

    try {
      setIsSigningOut(true)
      setShowUserMenu(false)

      console.log("Starting sign out process...")

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: "global",
      })

      if (error) {
        console.error("Supabase sign out error:", error)
      }

      // Clear cookies and storage immediately
      clearAuthCookies()

      // Clear component state
      setUser(null)
      setProfile(null)

      console.log("Sign out completed, redirecting...")

      // Force page reload and redirect
      window.location.href = "/"
    } catch (error) {
      console.error("Sign out failed:", error)
      setIsSigningOut(false)

      // Fallback: still try to clear everything and redirect
      clearAuthCookies()
      window.location.href = "/"
    }
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Casinos", href: "/casinos", icon: Building2 },
    { name: "Bonuses", href: "/bonuses", icon: Gift },
    { name: "Reviews", href: "/reviews", icon: Star },
    { name: "News", href: "/news", icon: Newspaper },
    { name: "Reports", href: "/reports", icon: FileText },
  ]

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  // Show loading only during initial auth check
  const showLoading = isLoading && !user

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
              {showLoading ? (
                <div className="w-8 h-8 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  {/* Admin Panel Button */}
                  {isAdmin && (
                    <Link href="/admin">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 bg-transparent"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      disabled={isSigningOut}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 text-white disabled:opacity-50"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                        <span className="text-black font-bold text-xs">
                          {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                      </span>
                      {isAdmin && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                          {profile?.role === "super_admin" ? "SUPER" : "ADMIN"}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${showUserMenu ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* User Dropdown */}
                    {showUserMenu && !isSigningOut && (
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
                          disabled={isSigningOut}
                          className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left disabled:opacity-50"
                        >
                          <LogOut className="w-4 h-4" />
                          {isSigningOut ? "Signing Out..." : "Sign Out"}
                        </button>
                      </div>
                    )}
                  </div>
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

              {showLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                <div className="space-y-1">
                  {/* Admin Panel for Mobile */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm border border-red-500/30"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}

                  <div className="flex items-center gap-2 px-3 py-2 text-white text-sm">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-xs">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium truncate">
                        {profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                      </span>
                      {isAdmin && (
                        <div className="text-xs text-red-400 mt-1">
                          {profile?.role === "super_admin" ? "Super Admin" : "Admin"}
                        </div>
                      )}
                    </div>
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
                    disabled={isSigningOut}
                    className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left text-sm disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    {isSigningOut ? "Signing Out..." : "Sign Out"}
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
