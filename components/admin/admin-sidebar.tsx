'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AdminAuth } from '@/lib/auth/admin-auth'
import {
  BarChart3,
  Home,
  MessageSquare,
  Building2,
  Newspaper,
  Gift,
  Layout,
  Users,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Image as ImageIcon,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requireRole?: 'super_admin'
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: BarChart3
  },
  {
    title: 'Security Monitoring',
    href: '/admin/monitoring',
    icon: Activity,
    requireRole: 'super_admin'
  },
  {
    title: 'Home Content',
    href: '/admin/home',
    icon: Home
  },
  {
    title: 'Expert Reviews',
    href: '/admin/expert-reviews',
    icon: Star
  },
  {
    title: 'Player Reviews',
    href: '/admin/reviews',
    icon: MessageSquare
  },
  {
    title: 'Casino Screenshots',
    href: '/admin/casino-screenshots',
    icon: ImageIcon
  },
  {
    title: 'Casinos Content',
    href: '/admin/casinos',
    icon: Building2
  },
  {
    title: 'News Content',
    href: '/admin/news',
    icon: Newspaper
  },
  {
    title: 'Bonuses Content',
    href: '/admin/bonuses',
    icon: Gift
  },
  {
    title: 'Footer Content',
    href: '/admin/footer',
    icon: Layout
  },
  {
    title: 'Users Management',
    href: '/admin/users',
    icon: Users,
    requireRole: 'super_admin'
  }
]

export function AdminSidebar() {
  const adminAuth = AdminAuth.getInstance()
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [homeMenuOpen, setHomeMenuOpen] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await adminAuth.getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [adminAuth])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSignOut = async () => {
    try {
      // Sign out from account
      await adminAuth.signOut()
      
      // Clear admin PIN verification cookie
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
        headers,
      })
      
      // Redirect to public site
      const publicUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      window.location.href = publicUrl
    } catch (error) {
      console.error('Error during sign out:', error)
      // Fallback to admin login if something goes wrong
      router.push('/admin/login')
    }
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white md:hidden"
        style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-50",
        collapsed && !isMobile ? "w-16" : "w-64",
        isMobile && !mobileMenuOpen && "-translate-x-full",
        "md:translate-x-0"
      )}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
              <p className="text-xs text-white/60 truncate">{user?.email}</p>
            </div>
          )}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          )}
        </div>
        {(!collapsed || isMobile) && (
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20 mt-2">
            <Shield className="w-3 h-3 mr-1" />
            {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            // Check if user has required role
            if (item.requireRole && user?.role !== item.requireRole) {
              return null
            }

            const isActive = pathname === item.href
            const IconComponent = item.icon

            // Special handling for Home Content dropdown behavior
            if (item.href === '/admin/home') {
              return (
                <div key={item.href} className="space-y-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                      (isActive || homeMenuOpen) && "bg-white/20 text-white",
                      collapsed && "px-2"
                    )}
                    onClick={() => setHomeMenuOpen((v) => !v)}
                  >
                    <div className="flex items-center">
                      <IconComponent className={cn("w-4 h-4", (!collapsed || isMobile) && "mr-3")} />
                      {(!collapsed || isMobile) && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </div>
                    {(!collapsed || isMobile) && <ChevronDown className={cn("w-4 h-4 transition-transform", homeMenuOpen && "rotate-180")} />}
                  </Button>
                  {homeMenuOpen && (!collapsed || isMobile) && (
                    <div className="ml-7 space-y-1">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                          pathname === '/admin/home/top-rated-casinos' && "bg-white/20 text-white"
                        )}
                        onClick={() => {
                          handleNavigation('/admin/home/top-rated-casinos')
                        }}
                      >
                        Top Rated Casinos
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                          pathname === '/admin/home/hero-banner' && "bg-white/20 text-white"
                        )}
                        onClick={() => {
                          handleNavigation('/admin/home/hero-banner')
                        }}
                      >
                        Hero Banner
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                          pathname === '/admin/home/exclusive-bonuses' && "bg-white/20 text-white"
                        )}
                        onClick={() => {
                          handleNavigation('/admin/home/exclusive-bonuses')
                        }}
                      >
                        Exclusive Bonuses
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                          pathname === '/admin/home/featured-casinos' && "bg-white/20 text-white"
                        )}
                        onClick={() => {
                          handleNavigation('/admin/home/featured-casinos')
                        }}
                      >
                        Featured Casinos
                      </Button>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                  isActive && "bg-white/20 text-white",
                  collapsed && "px-2"
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <IconComponent className={cn("w-4 h-4", (!collapsed || isMobile) && "mr-3")} />
                {(!collapsed || isMobile) && (
                  <span className="truncate">{item.title}</span>
                )}
              </Button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-white/70 hover:text-white hover:bg-red-500/20 transition-colors",
              collapsed && "px-2"
            )}
            onClick={handleSignOut}
          >
            <LogOut className={cn("w-4 h-4", (!collapsed || isMobile) && "mr-3")} />
            {(!collapsed || isMobile) && <span>Sign Out</span>}
          </Button>
        </div>
      </nav>
      </div>
    </>
  )
}