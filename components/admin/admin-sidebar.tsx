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
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    title: 'Home Content',
    href: '/admin/home',
    icon: Home
  },
  {
    title: 'Reviews Content',
    href: '/admin/reviews',
    icon: MessageSquare
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
    await adminAuth.signOut()
    router.push('/admin/login')
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

            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                  isActive && "bg-white/20 text-white",
                  collapsed && "px-2"
                )}
                onClick={() => {
                  handleNavigation(item.href)
                  if (isMobile) setMobileMenuOpen(false)
                }}
              >
                <IconComponent className={cn("w-4 h-4", (!collapsed || isMobile) && "mr-3")} />
                {(!collapsed || isMobile) && (
                  <span className="truncate">{item.title}</span>
                )}
              </Button>
            )
          })}
        </div>
      </nav>

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
      </div>
    </>
  )
}