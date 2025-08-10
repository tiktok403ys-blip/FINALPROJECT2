"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ChevronDown, Menu, X, User, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profile)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
        setProfile(profile)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const heroHeight = window.innerHeight * 0.8 // Assume hero is 80vh

      if (scrollY < heroHeight) {
        // In hero section - hide navbar
        setIsVisible(false)
        setIsScrolled(false)
      } else {
        // Past hero section - show navbar
        setIsVisible(true)
        setIsScrolled(true)
      }

      lastScrollY = scrollY > 0 ? scrollY : 0
      ticking = false
    }

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    const onScroll = () => requestTick()

    // Initial check
    updateScrollDirection()

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsUserMenuOpen(false)
  }

  return (
    <nav
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div
        className={`mx-auto px-6 py-3 rounded-2xl backdrop-blur-xl bg-black/20 border border-white/10 shadow-2xl transition-all duration-300 ${
          isScrolled ? "bg-black/30 border-white/20 shadow-black/20" : "bg-black/20 border-white/10"
        }`}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-[#00ff88] text-xl font-bold hover:text-[#00cc6a] transition-all duration-300 hover:scale-105"
            >
              GuruSingapore
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-1">
              <Link
                href="/"
                className="text-white/90 hover:text-[#00ff88] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10"
              >
                Home
              </Link>
              <Link
                href="/casinos"
                className="text-white/90 hover:text-[#00ff88] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10"
              >
                Casinos
              </Link>
              <Link
                href="/bonuses"
                className="text-white/90 hover:text-[#00ff88] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10"
              >
                Best Bonus
              </Link>
              <Link
                href="/news"
                className="text-white/90 hover:text-[#00ff88] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10"
              >
                News
              </Link>
              <Link
                href="/reports"
                className="text-white/90 hover:text-[#00ff88] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10"
              >
                Reports
              </Link>

              {/* Reviews Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsReviewsOpen(!isReviewsOpen)}
                  className="text-white/90 hover:text-[#00ff88] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10 flex items-center"
                >
                  Reviews
                  <ChevronDown
                    className={`ml-1 h-4 w-4 transition-transform duration-300 ${isReviewsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isReviewsOpen && (
                  <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-black/30 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="py-2">
                      <Link
                        href="/reviews"
                        className="block px-4 py-3 text-sm text-white/90 hover:bg-white/10 hover:text-[#00ff88] transition-all duration-300"
                        onClick={() => setIsReviewsOpen(false)}
                      >
                        All Reviews
                      </Link>
                      <Link
                        href="/reviews/casino-reviews"
                        className="block px-4 py-3 text-sm text-white/90 hover:bg-white/10 hover:text-[#00ff88] transition-all duration-300"
                        onClick={() => setIsReviewsOpen(false)}
                      >
                        Casino Reviews
                      </Link>
                      <Link
                        href="/reviews/bonus-reviews"
                        className="block px-4 py-3 text-sm text-white/90 hover:bg-white/10 hover:text-[#00ff88] transition-all duration-300"
                        onClick={() => setIsReviewsOpen(false)}
                      >
                        Bonus Reviews
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center text-white/90 hover:text-[#00ff88] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center mr-2">
                      <User className="h-4 w-4 text-black" />
                    </div>
                    {profile?.username || user.email?.split("@")[0] || "User"}
                    <ChevronDown
                      className={`ml-2 h-4 w-4 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-black/30 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="block px-4 py-3 text-sm text-white/90 hover:bg-white/10 hover:text-[#00ff88] transition-all duration-300"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="inline h-4 w-4 mr-2" />
                          Profile Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/10 hover:text-red-400 transition-all duration-300"
                        >
                          <LogOut className="inline h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-white/90 hover:text-[#00ff88] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] hover:from-[#00cc6a] hover:to-[#00ff88] text-black px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#00ff88]/25"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white/90 hover:text-[#00ff88] p-2 rounded-xl transition-all duration-300 hover:bg-white/10"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden mt-4">
          <div className="backdrop-blur-xl bg-black/30 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-6 space-y-2">
              <Link
                href="/"
                className="text-white/90 hover:text-[#00ff88] block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/casinos"
                className="text-white/90 hover:text-[#00ff88] block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                Casinos
              </Link>
              <Link
                href="/bonuses"
                className="text-white/90 hover:text-[#00ff88] block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                Best Bonus
              </Link>
              <Link
                href="/news"
                className="text-white/90 hover:text-[#00ff88] block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                News
              </Link>
              <Link
                href="/reports"
                className="text-white/90 hover:text-[#00ff88] block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                Reports
              </Link>
              <Link
                href="/reviews"
                className="text-white/90 hover:text-[#00ff88] block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                Reviews
              </Link>

              {user ? (
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex items-center px-4 py-3 text-white/90 text-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-black" />
                    </div>
                    {profile?.username || user.email?.split("@")[0] || "User"}
                  </div>
                  <Link
                    href="/profile"
                    className="text-white/90 hover:text-[#00ff88] block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsOpen(false)
                    }}
                    className="text-white/90 hover:text-red-400 block px-4 py-3 rounded-xl text-base font-medium w-full text-left transition-all duration-300 hover:bg-white/10"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                  <Link
                    href="/auth/login"
                    className="text-white/90 hover:text-[#00ff88] block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] hover:from-[#00cc6a] hover:to-[#00ff88] text-black block px-4 py-3 text-base font-medium mx-4 rounded-xl transition-all duration-300 text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

// Named export

// Default export
export default Navbar
