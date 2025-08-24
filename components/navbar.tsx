"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { useAuth } from "@/components/auth-provider"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string | null | undefined
  full_name: string | null | undefined
  avatar_url: string | null | undefined
  role: string | null
  admin_pin: string | null
}

// Touch target minimum: 44px as per iOS/Android guidelines
const TOUCH_TARGET_SIZE = "min-h-[44px] min-w-[44px]"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileActiveDropdown, setMobileActiveDropdown] = useState<string | null>(null)

  const pathname = usePathname()
  const mountedRef = useRef(true)
  const profileFetchedRef = useRef(false)
  const supabase = createClient()
  const menuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Centralized auth from AuthProvider
  const { user, loading, signOut: authSignOut } = useAuth()

  // Check if we're on home page
  const isHomePage = pathname === "/"

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null)
      }
      if (showUserMenu && !userMenuRef.current?.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown, showUserMenu])

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
    setActiveDropdown(null)
    setMobileActiveDropdown(null)
  }, [pathname])

  const fetchUserProfile = useCallback(async (currentUser: SupabaseUser) => {
    if (!currentUser || profileFetchedRef.current || !mountedRef.current) return

    try {
      console.log("🔄 Fetching profile for:", currentUser.email)
      profileFetchedRef.current = true
      setProfileError(null)

      const { data: profileData, error } = await supabase.rpc("profile_rpc_v5", {
        user_id_input: currentUser.id,
      })

      if (error) {
        console.error("❌ Profile fetch error:", error)

        if (error.code === "PGRST116") {
          console.log("🔄 Creating new profile...")
          const newProfile = {
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
            avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
            role: "user",
            admin_pin: null,
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
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
            avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
            role: "user",
            admin_pin: null,
          }

          if (mountedRef.current) {
            setProfile(fallbackProfile)
            setProfileError("Using cached profile data")
          }
        }
      } else {
        console.log("✅ Profile loaded successfully:", profileData)
        const row = Array.isArray(profileData) ? profileData?.[0] : profileData
        if (mountedRef.current) {
          setProfile(row ?? null)
        }
      }
    } catch (error) {
      console.error("❌ Unexpected error fetching profile:", error)

      const fallbackProfile: Profile = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
        avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
        role: "user",
        admin_pin: null,
      }

      if (mountedRef.current) {
        setProfile(fallbackProfile)
        setProfileError("Using fallback profile data")
      }
    }
  }, [supabase])

  useEffect(() => {
    mountedRef.current = true

    if (!user) {
      setProfile(null)
      setProfileError(null)
      profileFetchedRef.current = false
      return
    }

    if (user && !profileFetchedRef.current) {
      fetchUserProfile(user)
    }

    return () => {
      mountedRef.current = false
    }
  }, [user, fetchUserProfile])

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log("Navbar - Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session?.user) {
        profileFetchedRef.current = false
        if (mountedRef.current) {
          fetchUserProfile(session.user)
        }
      } else if (event === "SIGNED_OUT") {
        if (mountedRef.current) {
          setProfile(null)
          setProfileError(null)
          profileFetchedRef.current = false
          setShowUserMenu(false)
          setIsSigningOut(false)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

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

  const handleSignOut = async () => {
    if (isSigningOut) return

    try {
      setIsSigningOut(true)
      setShowUserMenu(false)
      console.log("🔄 Starting sign out process...")

      // Clear admin session
      sessionStorage.removeItem("admin_pin_verified")
      sessionStorage.removeItem("admin_pin_timestamp")

      // Clear local state BEFORE calling auth signOut
      setProfile(null)
      setProfileError(null)
      profileFetchedRef.current = false

      await authSignOut()

      console.log("✅ Sign out completed, redirecting...")
      window.location.href = "/"
    } catch (error) {
      console.error("❌ Sign out failed:", error)
      setIsSigningOut(false)
      window.location.href = "/"
    }
  }

  const handleAdminAccess = () => {
    console.log("🔐 Admin access requested - redirecting to admin subdomain")
    setShowUserMenu(false)
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL
    window.location.href = adminUrl ? `${adminUrl}/admin?showPin=true` : "/admin?showPin=true"
  }

  const handlePinSuccess = () => {
    console.log("✅ PIN verified, redirecting to admin panel...")
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL
    window.location.href = adminUrl ? `${adminUrl}/admin` : "/admin"
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
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Casinos", href: "/casinos", icon: Building2 },
    { name: "Bonuses", href: "/bonuses", icon: Gift },
    {
      name: "Reviews",
      href: "/expert-reviews",
      icon: Star,
      hasDropdown: true,
      dropdownItems: [
        { name: "Expert Reviews", href: "/expert-reviews", icon: Star, description: "Professional analysis" },
        { name: "Player Reviews", href: "/reviews", icon: User, description: "Community feedback" },
      ]
    },
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
        style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl px-6 py-3">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <Link
              href="/"
              className={`flex items-center gap-2 group ${TOUCH_TARGET_SIZE}`}
            >
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

                if (item.hasDropdown) {
                  return (
                    <div key={item.name} className="relative dropdown-container">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${TOUCH_TARGET_SIZE} ${
                          isActive
                            ? "text-[#00ff88] bg-black/30 backdrop-filter backdrop-blur-md saturate-180 border border-[#00ff88]/20 shadow-[0_4px_12px_-4px_rgba(0,255,136,0.2)]"
                            : "text-gray-300 hover:text-[#00ff88] hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{item.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === item.name ? "rotate-180" : ""}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === item.name && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 border-t border-t-white/30">
                          <div className="p-2">
                            {item.dropdownItems.map((dropdownItem) => {
                              const DropdownIcon = dropdownItem.icon
                              const isDropdownActive = pathname === dropdownItem.href || (dropdownItem.href !== "/" && pathname.startsWith(dropdownItem.href))

                              return (
                                <Link
                                  key={dropdownItem.name}
                                  href={dropdownItem.href}
                                  onClick={() => setActiveDropdown(null)}
                                  className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${TOUCH_TARGET_SIZE} ${
                                    isDropdownActive
                                      ? "text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/20"
                                      : "text-gray-300 hover:text-[#00ff88] hover:bg-white/5"
                                  }`}
                                >
                                  <DropdownIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{dropdownItem.name}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{dropdownItem.description}</div>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 group ${TOUCH_TARGET_SIZE} ${
                      isActive
                        ? "text-[#00ff88] bg-black/30 backdrop-filter backdrop-blur-md saturate-180 border border-[#00ff88]/20 shadow-[0_4px_12px_-4px_rgba(0,255,136,0.2)]"
                        : "text-gray-300 hover:text-[#00ff88] hover:bg-white/5"
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
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-400">Loading...</span>
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  {/* Admin Panel Button */}
                  {isSuperAdmin && (
                    <Button
                      onClick={handleAdminAccess}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 bg-transparent transition-all duration-300"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  )}

                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      disabled={isSigningOut}
                      className={`flex items-center gap-4 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 text-white disabled:opacity-50 ${TOUCH_TARGET_SIZE}`}
                    >
                      <div className="w-7 h-7 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center ring-1 ring-white/20 shadow-sm">
                        <span className="text-black font-bold text-xs">{getUserInitials()}</span>
                      </div>
                      <span className="text-xs font-normal text-white/90">{getUserDisplayName()}</span>
                      {isSuperAdmin && (
                        <span className="ml-auto px-1.5 py-0.5 bg-red-500/15 text-red-400 text-xs rounded-full">
                          ADMIN
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
                      <div className="absolute right-0 top-full mt-2 w-48 bg-black/50 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-2">
                        {profileError && (
                          <div className="px-4 py-2 text-xs text-yellow-400 border-b border-white/10">
                            {profileError}
                          </div>
                        )}
                        <Link
                          href="/profile"
                          className={`flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors ${TOUCH_TARGET_SIZE}`}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className={`flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors ${TOUCH_TARGET_SIZE}`}
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
                              className={`flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left ${TOUCH_TARGET_SIZE}`}
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
                          className={`flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left disabled:opacity-50 ${TOUCH_TARGET_SIZE}`}
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
                  <Button
                    variant="ghost"
                    className={`text-gray-300 hover:text-white hover:bg-white/10 border-0 ${TOUCH_TARGET_SIZE}`}
                    asChild
                  >
                    <Link href="/auth/login">Login</Link>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold transition-all duration-300"
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
              className={`lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white ${TOUCH_TARGET_SIZE}`}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={menuRef}
            className="absolute top-20 left-4 right-4 bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 max-w-xs mx-auto"
            style={{
              top: 'calc(5rem + env(safe-area-inset-top))',
              maxHeight: 'calc(100vh - 6rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
            }}
          >
            <div className="space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                if (item.hasDropdown) {
                  return (
                    <div key={item.name} className="space-y-1">
                      <button
                        onClick={() => setMobileActiveDropdown(mobileActiveDropdown === item.name ? null : item.name)}
                        className={`flex items-center justify-between w-full px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 text-sm ${TOUCH_TARGET_SIZE}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${
                          mobileActiveDropdown === item.name ? "rotate-180" : ""
                        }`} />
                      </button>
                      {mobileActiveDropdown === item.name && (
                        <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-300">
                          {item.dropdownItems.map((dropdownItem) => {
                            const DropdownIcon = dropdownItem.icon
                            const isDropdownActive = pathname === dropdownItem.href || (dropdownItem.href !== "/" && pathname.startsWith(dropdownItem.href))

                            return (
                              <Link
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 text-sm ${TOUCH_TARGET_SIZE} ${
                                  isDropdownActive
                                    ? "text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/20"
                                    : "text-gray-300 hover:text-[#00ff88] hover:bg-white/5"
                                }`}
                              >
                                <DropdownIcon className="w-4 h-4" />
                                <span className="font-medium">{dropdownItem.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 text-sm ${TOUCH_TARGET_SIZE} ${
                      isActive
                        ? "text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/20"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}

              <hr className="border-white/10 my-3" />

              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                <div className="space-y-1">
                  {/* Admin Panel for Mobile */}
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        handleAdminAccess()
                      }}
                      className={`flex items-center gap-2 px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm border border-red-500/30 w-full text-left ${TOUCH_TARGET_SIZE}`}
                    >
                      <Shield className="w-4 h-4" />
                      Admin Panel
                    </button>
                  )}

                  <div className={`flex items-center gap-2 px-3 py-3 text-white text-sm ${TOUCH_TARGET_SIZE}`}>
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
                    className={`flex items-center gap-2 px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm ${TOUCH_TARGET_SIZE}`}
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
                    className={`flex items-center gap-2 px-3 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left text-sm disabled:opacity-50 ${TOUCH_TARGET_SIZE}`}
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
                    className={`w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 border-0 h-11 ${TOUCH_TARGET_SIZE}`}
                    asChild
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href="/auth/login">Login</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold h-11"
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
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handlePinSuccess}
      />
    </>
  )
}

export default Navbar
