"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/glass-card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsVisible(scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/casinos", label: "Casinos" },
    { href: "/bonuses", label: "Best Bonus" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/forum", label: "Forum" },
    { href: "/news", label: "News" },
    { href: "/reports", label: "Reports" },
    ...(user
      ? [
          { href: "/admin", label: "Admin" },
          { href: "/admin/footer", label: "Footer" },
        ]
      : []),
  ]

  if (pathname === "/" && !isVisible) return null

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible || pathname !== "/" ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <GlassCard className="mx-4 mt-4 rounded-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-[#00ff88]">
              Casino Guide
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-white hover:text-[#00ff88] transition-colors ${
                    pathname === item.href ? "text-[#00ff88]" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">{user.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:text-[#00ff88]">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" asChild className="text-white hover:text-[#00ff88]">
                    <Link href="/auth/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                    <Link href="/auth/register">Register</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-white/10">
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-white hover:text-[#00ff88] transition-colors ${
                      pathname === item.href ? "text-[#00ff88]" : ""
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-white/10">
                  {user ? (
                    <div className="flex flex-col space-y-2">
                      <span className="text-white text-sm">{user.email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="text-white hover:text-[#00ff88] justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-white hover:text-[#00ff88] justify-start"
                      >
                        <Link href="/auth/login">Login</Link>
                      </Button>
                      <Button size="sm" asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                        <Link href="/auth/register">Register</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </nav>
  )
}
