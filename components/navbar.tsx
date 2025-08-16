"use client"

import { useState, useEffect, useRef } from "react"
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
import { AdminPinDialog } from "@/components/admin-pin-dialog"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: string | null
  admin_pin: string | null
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const pathname = usePathname()
  const mountedRef = useRef(true)
  const profileFetchedRef = useRef(false)
  const supabase = createClient()

  // Check if we're on home page
  const isHomePage = pathname === "/"

  useEffect(() => {
    mountedRef.current = true

    const initializeAuth = async () => {
      try {
        console.log("🔄 Initializing authentication...")
        setIsLoading(true)

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("❌ Session error:", sessionError)
          if (mountedRef.current) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
          return
        }

        if (session?.user && mountedRef.current) {
          console.log("✅ User session found:", session.user.email)
          setUser(session.user)
          await fetchUserProfile(session.user)
        } else if (mountedRef.current) {
          console.log("ℹ️ No user session")
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error)
        if (mountedRef.current) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!mountedRef.current) return

      console.log("🔄 Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setIsLoading(false)
        profileFetchedRef.current = false
        await fetchUserProfile(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setShowUserMenu(false)
        setIsSigningOut(false)
        setIsLoading(false)
        setProfileError(null)
        profileFetchedRef.current = false
        clearAuthCookies()
        sessionStorage.removeItem("admin_pin_verified")
        sessionStorage.removeItem("admin_pin_timestamp")
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user)
        setIsLoading(false)
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (currentUser: SupabaseUser) => {
    if (!currentUser || profileFetchedRef.current) return

    try {
      console.log("🔄 Fetching profile for:", currentUser.email)
      profileFetchedRef.current = true
      setProfileError(null)

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role, admin_pin")
        .eq("id", currentUser.id)
        .single()

      if (error) {
        console.error("❌ Profile fetch error:", error)

        if (error.code === "PGRST116") {
          console.log("🔄 Creating new profile...")
          const newProfile = {
            id: currentUser.id,
            email: currentUser.email ?? null,
            full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
            avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
            role: (currentUser.email ?? "") === "casinogurusg404@gmail.com" ? "super_admin" : "user",
            admin_pin: (currentUser.email ?? "") === "casinogurusg404@gmail.com" ? "1234" : null,
          }

          const { data: createdProfile, error: createError } = await supabase
            .from("profiles")
            .insert([newProfile])
            .select()
            .single()

          if (createError) {
            console.error("❌ Error creating profile:", createError)
            if (mountedRef.current) {
              setProfile(newProfile)
            }
          } else {
            console.log("✅ Profile created successfully")
            if (mountedRef.current) {
              setProfile(createdProfile)
            }
          }
        } else {
          const fallbackProfile: Profile = {
            id: currentUser.id,
            email: currentUser.email ?? null,
            full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
            avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
            role: (currentUser.email ?? "") === "casinogurusg404@gmail.com" ? "super_admin" : "user",
            admin_pin: null,
          }

          if (mountedRef.current) {
            setProfile(fallbackProfile)
            setProfileError("Using cached profile data")
          }
        }
      } else {
        console.log("✅ Profile loaded successfully:", profileData)
        if (mountedRef.current) {
          setProfile(profileData)
        }
      }
    } catch (error) {
      console.error("❌ Unexpected error fetching profile:", error)

      const fallbackProfile: Profile = {
        id: currentUser.id,
        email: currentUser.email ?? null,
        full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
        avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
        role: (currentUser.email ?? "") === "casinogurusg404@gmail.com" ? "super_admin" : "user",
        admin_pin: null,
      }

      if (mountedRef.current) {
        setProfile(fallbackProfile)
        setProfileError("Using fallback profile data")
      }
    }
  }

  // Scroll visibility effect for home page
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

    updateScrollDir()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [isHomePage])

  const clearAuthCookies = () => {
    console.log("🧹 Clearing auth cookies...")

    const cookiesToClear = ["sb-access-token", "sb-refresh-token", "supabase-auth-token", "supabase.auth.token"]

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.split("//")[1]?.split(".")[0]
      if (projectRef) {
        cookiesToClear.push(`sb-${projectRef}-auth-token`)
      }
    }

    cookiesToClear.forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`
    })

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("supabase") || key.includes("sb-")) {
          localStorage.removeItem(key)
        }
      })
      Object.keys(sessionStorage).forEach((key) => {
        if (key.includes("supabase") || key.includes("sb-")) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("Error clearing storage:", error)
    }
  }

  const handleSignOut = async () => {
    if (isSigningOut) return

    try {
      setIsSigningOut(true)
      setShowUserMenu(false)
      console.log("🔄 Starting sign out process...")

      sessionStorage.removeItem("admin_pin_verified")
      sessionStorage.removeItem("admin_pin_timestamp")

      const { error } = await supabase.auth.signOut({ scope: "global" })

      if (error) {
        console.error("❌ Supabase sign out error:", error)
      } else {
        console.log("✅ Supabase sign out successful")
      }

      clearAuthCookies()
      setUser(null)
      setProfile(null)
      profileFetchedRef.current = false

      console.log("✅ Sign out completed, redirecting...")
      window.location.href = "/"
    } catch (error) {
      console.error("❌ Sign out failed:", error)
      setIsSigningOut(false)
      clearAuthCookies()
      window.location.href = "/"
    }
  }

  const handleAdminAccess = () => {
    console.log("🔐 Admin access requested")
    setShowUserMenu(false)
    setShowPinDialog(true)
  }

  const handlePinSuccess = () => {
    console.log("✅ PIN verified, redirecting to admin panel...")
    window.location.href = "https://sg44admin.gurusingapore.com"
  }

  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.user_metadata?.name) return user.user_metadata.name
    if (user?.email) return user.email.split("@")[0]
    return "User"
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(" ")
      .map((n: any) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Casinos", href: "/casinos", icon: Building2 },
    { name: "Bonuses", href: "/bonuses", icon: Gift },
    { name: "Reviews", href: "/reviews", icon: Star },
    { name: "News", href: "/news", icon: Newspaper },
    { name: "Reports", href: "/reports", icon: FileText },
  ]

  const isSuperAdmin = profile?.role === "super_admin"

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
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-400">Loading...</span>
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  {/* Admin Panel Button - Only for Super Admin */}
                  {isSuperAdmin && (
                    <Button
                      onClick={handleAdminAccess}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 bg-transparent transition-all duration-300 hover:scale-105"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      disabled={isSigningOut}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 text-white disabled:opacity-50"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                        <span className="text-black font-bold text-xs">{getUserInitials()}</span>
                      </div>
                      <span className="text-sm font-medium">{getUserDisplayName()}</span>
                      {isSuperAdmin && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                          SUPER ADMIN
                        </span>
                      )}
                      {profileError && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                          !
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${showUserMenu ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* User Dropdown */}
                    {showUserMenu && !isSigningOut && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-2">
                        {profileError && (
                          <div className="px-4 py-2 text-xs text-yellow-400 border-b border-white/10">
                            {profileError}
                          </div>
                        )}
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
                        {isSuperAdmin && (
                          <>
                            <hr className="my-2 border-white/10" />
                            <button
                              onClick={handleAdminAccess}
                              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
                            >
                              <Shield className="w-4 h-4" />
                              Admin Panel
                            </button>
                          </>
                        )}
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

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                <div className="space-y-1">
                  {/* Admin Panel for Mobile - Only for Super Admin */}
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        handleAdminAccess()
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm border border-red-500/30 w-full text-left"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Panel
                    </button>
                  )}

                  <div className="flex items-center gap-2 px-3 py-2 text-white text-sm">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-xs">{getUserInitials()}</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium truncate">{getUserDisplayName()}</span>
                      {isSuperAdmin && <div className="text-xs text-red-400 mt-1">Super Admin</div>}
                      {profileError && <div className="text-xs text-yellow-400 mt-1">Profile Issue</div>}
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

      {/* Admin PIN Dialog */}
      <AdminPinDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onSuccess={handlePinSuccess}
        userEmail={user?.email || ""}
      />
    </>
  )
}

export default Navbar
