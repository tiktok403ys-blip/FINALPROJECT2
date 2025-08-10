"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Casinos",
    href: "/casinos",
  },
  {
    title: "Best Bonus",
    href: "/bonuses",
  },
  {
    title: "News",
    href: "/news",
  },
  {
    title: "Reports",
    href: "/reports",
  },
]

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [casinos, setCasinos] = useState<any[]>([])
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    const fetchCasinos = async () => {
      const { data } = await supabase.from("casinos").select("id, name").order("rating", { ascending: false }).limit(8)
      if (data) setCasinos(data)
    }
    fetchCasinos()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  return (
    <nav className="w-full bg-black h-16 flex items-center justify-between px-8">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold text-[#00ff88]">
        GuruSingapore
      </Link>

      {/* Desktop Navigation - Centered */}
      <div className="hidden md:flex items-center space-x-8">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-white hover:text-[#00ff88] transition-colors text-sm font-medium",
              pathname === item.href && "text-[#00ff88]",
            )}
          >
            {item.title}
          </Link>
        ))}

        {/* Reviews Dropdown */}
        <div className="relative">
          <button
            onClick={() => setReviewsOpen(!reviewsOpen)}
            className="flex items-center text-white hover:text-[#00ff88] transition-colors text-sm font-medium"
          >
            Reviews
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>

          {reviewsOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setReviewsOpen(false)} />
              <div className="absolute top-full left-0 mt-2 w-64 bg-black border border-gray-800 rounded-md shadow-xl z-20">
                <div className="py-2">
                  <Link
                    href="/reviews"
                    className="block px-4 py-2 text-white hover:text-[#00ff88] hover:bg-gray-900 text-sm"
                    onClick={() => setReviewsOpen(false)}
                  >
                    All Reviews
                  </Link>
                  <div className="border-t border-gray-800 my-2"></div>
                  {casinos.map((casino) => (
                    <Link
                      key={casino.id}
                      href={`/reviews/${createSlug(casino.name)}-${casino.id}`}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-[#00ff88] hover:bg-gray-900"
                      onClick={() => setReviewsOpen(false)}
                    >
                      {casino.name} Review
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center space-x-3">
        {loading ? (
          <div className="w-16 h-8 bg-gray-800 rounded animate-pulse" />
        ) : user ? (
          <div className="flex items-center space-x-3">
            <span className="text-white text-sm">{user.email?.split("@")[0]}</span>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="text-white hover:text-[#00ff88] text-sm font-medium"
            >
              Logout
            </Button>
          </div>
        ) : (
          <>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:text-[#00ff88] text-sm font-medium">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-[#00ff88] hover:bg-[#00ff88]/90 text-black text-sm font-medium px-6 h-9">
                Register
              </Button>
            </Link>
          </>
        )}

        {/* Mobile menu button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-black border-gray-800">
            <div className="flex flex-col space-y-4 mt-8">
              <div className="px-3 py-2 border-b border-gray-800">
                <span className="text-xl font-bold text-[#00ff88]">GuruSingapore</span>
              </div>

              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 text-white hover:text-[#00ff88] transition-colors",
                    pathname === item.href && "text-[#00ff88]",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.title}
                </Link>
              ))}

              <div>
                <button
                  onClick={() => setReviewsOpen(!reviewsOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-white hover:text-[#00ff88] transition-colors"
                >
                  Reviews
                  <ChevronDown className="w-4 h-4" />
                </button>
                {reviewsOpen && (
                  <div className="ml-4 mt-2 space-y-1">
                    <Link
                      href="/reviews"
                      className="block px-3 py-2 text-white hover:text-[#00ff88]"
                      onClick={() => {
                        setReviewsOpen(false)
                        setIsOpen(false)
                      }}
                    >
                      All Reviews
                    </Link>
                    {casinos.slice(0, 5).map((casino) => (
                      <Link
                        key={casino.id}
                        href={`/reviews/${createSlug(casino.name)}-${casino.id}`}
                        className="block px-3 py-2 text-sm text-gray-300 hover:text-[#00ff88]"
                        onClick={() => {
                          setReviewsOpen(false)
                          setIsOpen(false)
                        }}
                      >
                        {casino.name} Review
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-800 pt-4">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-400">Signed in as {user.email?.split("@")[0]}</div>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-white hover:text-[#00ff88]"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth/login"
                      className="block px-3 py-2 text-white hover:text-[#00ff88]"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block px-3 py-2 bg-[#00ff88] text-black hover:bg-[#00ff88]/90 text-center rounded"
                      onClick={() => setIsOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
