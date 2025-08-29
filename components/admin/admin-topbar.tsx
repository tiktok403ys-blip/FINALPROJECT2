"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, LogOut, Menu, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminAuth } from "@/lib/auth/admin-auth"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface AdminTopbarProps {
  onToggleSidebar: () => void
}

export function AdminTopbar({ onToggleSidebar }: AdminTopbarProps) {
  const pathname = usePathname()
  const adminAuth = AdminAuth.getInstance()
  const [user, setUser] = useState<any>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [pendingCount, setPendingCount] = useState<number>(0)

  useEffect(() => {
    const loadUser = async () => {
      const { user, profile } = await adminAuth.getCurrentUser()
      setUser(user)
      setIsSuperAdmin(adminAuth.isSuperAdmin())
    }
    loadUser()
  }, [adminAuth])

  useEffect(() => {
    let timer: any

    const getAuthHeaders = async (): Promise<Record<string, string>> => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        return token ? { Authorization: `Bearer ${token}` } : {}
      } catch {
        return {}
      }
    }

    const poll = async () => {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch("/api/admin/pending-reviews-count", { cache: "no-store", credentials: 'include', headers })
        const json = await res.json().catch(() => null)
        if (typeof json?.count === "number") setPendingCount(json.count)
      } catch {}
    }
    poll()
    timer = setInterval(poll, 15000)
    return () => clearInterval(timer)
  }, [])

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await adminAuth.signOut()
      window.location.href = '/admin/login'
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ top: 'env(safe-area-inset-top)' }}>
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#00ff88] to-[#00cc6a] flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span className="text-white font-semibold hidden sm:inline">Admin</span>
          </Link>
          <span className="text-gray-400 text-sm hidden sm:inline">{pathname}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/player-reviews" className="relative inline-flex items-center justify-center px-2 py-1 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </Link>
          {isSuperAdmin && (
            <span className="px-2 py-1 text-xs text-red-400 bg-red-500/10 rounded-full border border-red-500/20 hidden md:inline">
              SUPER ADMIN
            </span>
          )}
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="border-white/20 text-white bg-transparent hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {signingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
    </header>
  )
}