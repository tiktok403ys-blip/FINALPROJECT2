"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import type { User } from "@supabase/supabase-js"

interface AdminProfile {
  id: string
  email: string
  role: "user" | "admin" | "super_admin"
  created_at: string
  updated_at: string
}

interface AdminSecurityContextType {
  user: User | null
  profile: AdminProfile | null
  isAdmin: boolean
  isSuperAdmin: boolean
  loading: boolean
  pinVerified: boolean
  signOut: () => Promise<void>
  logAdminAction: (action: string, resource: string, resourceId?: string, details?: any) => Promise<void>
}

const AdminSecurityContext = createContext<AdminSecurityContextType | undefined>(undefined)

export function AdminSecurityProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pinVerified, setPinVerified] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  // Use centralized auth from AuthProvider
  const { user, signOut: authSignOut } = useAuth()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!user) {
          console.log("❌ No user found, redirecting to login")
          router.push("/auth/login")
          return
        }

        // Get user profile with role
        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error || !profile) {
          console.error("❌ Profile fetch error:", error)
          await authSignOut()
          router.push("/auth/login")
          return
        }

        // Check if user has admin privileges
        if (!profile.role || !["admin", "super_admin"].includes(profile.role)) {
          console.error("❌ Access denied: User is not an admin")
          await authSignOut()
          router.push("/")
          return
        }

        // Check PIN verification
        const pinVerified = sessionStorage.getItem("admin_pin_verified") === "true"
        const pinTimestamp = sessionStorage.getItem("admin_pin_timestamp")
        const now = Date.now()
        const pinAge = pinTimestamp ? now - Number.parseInt(pinTimestamp) : Number.POSITIVE_INFINITY

        // PIN expires after 1 hour (3600000 ms)
        if (!pinVerified || pinAge > 3600000) {
          console.log("❌ PIN verification required or expired")
          sessionStorage.removeItem("admin_pin_verified")
          sessionStorage.removeItem("admin_pin_timestamp")
          router.push("/")
          return
        }

        setProfile(profile)
        setPinVerified(true)

        // Log successful admin access
        await logAdminActionInternal("admin_access", "auth", null, {
          user_id: user.id,
          email: user.email,
          role: profile.role,
        })
      } catch (error) {
        console.error("❌ Auth check failed:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [user, router])

  const logAdminActionInternal = async (action: string, resource: string, resourceId?: string, details?: any) => {
    try {
      await supabase.rpc("log_admin_action", {
        p_action: action,
        p_resource: resource,
        p_resource_id: resourceId,
        p_details: details ? JSON.stringify(details) : null,
        p_ip_address: null, // Would need to get from headers in production
      })
    } catch (error) {
      console.error("Failed to log admin action:", error)
    }
  }

  const logAdminAction = async (action: string, resource: string, resourceId?: string, details?: any) => {
    await logAdminActionInternal(action, resource, resourceId, details)
  }

  const signOut = async () => {
    try {
      // Log admin logout
      await logAdminActionInternal("admin_logout", "auth", null, {
        user_id: user?.id,
        email: user?.email,
      })

      // Clear PIN verification
      sessionStorage.removeItem("admin_pin_verified")
      sessionStorage.removeItem("admin_pin_timestamp")

      // Use centralized signOut from AuthProvider
      await authSignOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const value = {
    user,
    profile,
    isAdmin: profile?.role === "admin" || profile?.role === "super_admin",
    isSuperAdmin: profile?.role === "super_admin",
    loading,
    pinVerified,
    signOut,
    logAdminAction,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Verifying admin access...</p>
          <p className="text-gray-400 text-sm mt-2">Checking credentials and permissions...</p>
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
