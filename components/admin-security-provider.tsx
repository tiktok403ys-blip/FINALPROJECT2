"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AdminSecurityContextType {
  user: User | null
  profile: any | null
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AdminSecurityContext = createContext<AdminSecurityContextType | undefined>(undefined)

export function AdminSecurityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/admin/auth/login")
          return
        }

        // Get user profile
        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error || !profile || profile.role !== "admin") {
          await supabase.auth.signOut()
          router.push("/admin/auth/login")
          return
        }

        setUser(user)
        setProfile(profile)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/admin/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null)
        setProfile(null)
        router.push("/admin/auth/login")
      } else if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        if (!profile || profile.role !== "admin") {
          await supabase.auth.signOut()
          router.push("/admin/auth/login")
          return
        }

        setUser(session.user)
        setProfile(profile)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signOut = async () => {
    try {
      // Log admin logout
      await supabase.rpc("log_admin_action", {
        p_action: "admin_logout",
        p_resource: "auth",
      })

      await supabase.auth.signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const value = {
    user,
    profile,
    isAdmin: profile?.role === "admin",
    loading,
    signOut,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  return <AdminSecurityContext.Provider value={value}>{children}</AdminSecurityContext.Provider>
}

export function useAdminSecurity() {
  const context = useContext(AdminSecurityContext)
  if (context === undefined) {
    throw new Error("useAdminSecurity must be used within an AdminSecurityProvider")
  }
  return context
}
