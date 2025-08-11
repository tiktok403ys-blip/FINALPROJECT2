"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { AdminPinDialog } from "@/components/admin-pin-dialog"
import { Menu, User, LogOut, Shield } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: "user" | "admin" | "super_admin"
}

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [profileFetched, setProfileFetched] = useState(false)
  const mounted = useRef(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    mounted.current = true

    const checkAuth = async () => {
      try {
        console.log("🔍 Checking authentication...")
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!mounted.current) return

        if (user) {
          console.log("✅ User authenticated:", user.email)
          setUser(user)

          // Fetch profile if not already fetched
          if (!profileFetched) {
            await fetchProfile(user)
          }
        } else {
          console.log("❌ No user found")
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error("❌ Auth check error:", error)
        if (mounted.current) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false)
        }
      }
    }

    const fetchProfile = async (user: SupabaseUser) => {
      if (profileLoading || profileFetched) return

      setProfileLoading(true)
      setProfileFetched(true)

      try {
        console.log("🔍 Fetching profile for:", user.email)

        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (!mounted.current) return

        if (error) {
          console.error("❌ Profile fetch error:", error)

          // Create fallback profile from user metadata
          const fallbackProfile: Profile = {
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            role: user.email === "casinogurusg404@gmail.com" ? "super_admin" : "user",
          }

          console.log("🔄 Using fallback profile:", fallbackProfile)
          setProfile(fallbackProfile)
        } else {
          console.log("✅ Profile loaded:", profile)
          setProfile(profile)
        }
      } catch (error) {
        console.error("❌ Profile fetch error:", error)
        if (mounted.current) {
          // Fallback profile
          const fallbackProfile: Profile = {
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            role: user.email === "casinogurusg404@gmail.com" ? "super_admin" : "user",
          }
          setProfile(fallbackProfile)
        }
      } finally {
        if (mounted.current) {
          setProfileLoading(false)
        }
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return

      console.log("🔄 Auth state changed:", event)

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setProfileFetched(false)
        await fetchProfile(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setProfileFetched(false)
      }
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [supabase, profileLoading, profileFetched])

  const handleSignOut = async () => {
    try {
      console.log("🚪 Signing out...")

      // Clear all auth-related storage
      sessionStorage.clear()
      localStorage.clear()

      // Clear admin PIN verification
      sessionStorage.removeItem("admin_pin_verified")
      sessionStorage.removeItem("admin_pin_timestamp")

      // Sign out from Supabase
      await supabase.auth.signOut({ scope: "global" })

      // Clear cookies manually
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.gurusingapore.com`
      })

      // Reset state
      setUser(null)
      setProfile(null)
      setProfileFetched(false)
      setShowUserMenu(false)

      // Force redirect to home
      window.location.href = "/"
    } catch (error) {
      console.error("❌ Sign out error:", error)
      // Force redirect even if sign out fails
      window.location.href = "/"
    }
  }

  const handleAdminAccess = () => {
    console.log("🔐 Admin access requested")
    setShowPinDialog(true)
    setShowUserMenu(false)
  }

  const handlePinSuccess = () => {
    console.log("✅ PIN verified, redirecting to admin panel")
    setShowPinDialog(false)

    // Redirect to admin subdomain
    window.location.href = "https://sg44admin.gurusingapore.com"
  }

  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.user_metadata?.name) return user.user_metadata.name
    if (profile?.email) return profile.email
    if (user?.email) return user.email
    return "User"
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const isSuperAdmin = profile?.role === "super_admin"

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">G</span>
              </div>
              <span className="text-white font-bold text-xl">GuruSingapore</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <NavigationMenu>
                <NavigationMenuList className="flex space-x-1">
                  <NavigationMenuItem>
                    <Link
                      href="/"
                      className="px-4 py-2 text-white hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/10"
                    >
                      Home
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      href="/casinos"
                      className="px-4 py-2 text-white hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/10"
                    >
                      Casinos
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      href="/bonuses"
                      className="px-4 py-2 text-white hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/10"
                    >
                      Bonuses
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      href="/reviews"
                      className="px-4 py-2 text-white hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/10"
                    >
                      Reviews
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      href="/news"
                      className="px-4 py-2 text-white hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/10"
                    >
                      News
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      href="/reports"
                      className="px-4 py-2 text-white hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/10"
                    >
                      Reports
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isLoading || profileLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-white text-sm">Loading...</span>
                </div>
              ) : user ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-white hover:bg-green-500/10"
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-semibold text-sm">{getUserInitials()}</span>
                    </div>
                    <span className="hidden sm:block">{getUserDisplayName()}</span>
                    {isSuperAdmin && <Shield className="w-4 h-4 text-red-400" title="Super Admin" />}
                  </Button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-black border border-green-500/20 rounded-lg shadow-lg py-1 z-50">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-white hover:bg-green-500/10 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>

                      {isAdmin && (
                        <button
                          onClick={handleAdminAccess}
                          className="flex items-center w-full px-4 py-2 text-white hover:bg-red-500/10 transition-colors"
                        >
                          <Shield className="w-4 h-4 mr-2 text-red-400" />
                          Admin Panel
                        </button>
                      )}

                      <hr className="border-green-500/20 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-white hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      className="border-green-500 text-green-400 hover:bg-green-500/10 bg-transparent"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-green-500 hover:bg-green-600 text-black">Sign Up</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-black border-green-500/20">
                    <div className="flex flex-col space-y-4 mt-8">
                      <Link href="/" className="text-white hover:text-green-400 transition-colors">
                        Home
                      </Link>
                      <Link href="/casinos" className="text-white hover:text-green-400 transition-colors">
                        Casinos
                      </Link>
                      <Link href="/bonuses" className="text-white hover:text-green-400 transition-colors">
                        Bonuses
                      </Link>
                      <Link href="/reviews" className="text-white hover:text-green-400 transition-colors">
                        Reviews
                      </Link>
                      <Link href="/news" className="text-white hover:text-green-400 transition-colors">
                        News
                      </Link>
                      <Link href="/reports" className="text-white hover:text-green-400 transition-colors">
                        Reports
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </nav>

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
