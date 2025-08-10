"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface AdminSecurityContextType {
  user: User | null
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AdminSecurityContext = createContext<AdminSecurityContextType | undefined>(undefined)

export function AdminSecurityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (currentUser) {
          setUser(currentUser)

          // Check admin role
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()

          setIsAdmin(profile?.role === "admin")
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        setUser(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
        setIsAdmin(false)
        router.push("/admin/auth/login")
      } else if (session?.user) {
        await checkAdminStatus()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signOut = async () => {
    try {
      // Log admin logout
      if (user) {
        await supabase.rpc("log_admin_action", {
          p_action: "admin_logout",
          p_resource_type: "auth",
          p_resource_id: user.id,
        })
      }

      await supabase.auth.signOut()
      router.push("/admin/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AdminSecurityContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AdminSecurityContext.Provider>
  )
}

export function useAdminSecurity() {
  const context = useContext(AdminSecurityContext)
  if (context === undefined) {
    throw new Error("useAdminSecurity must be used within an AdminSecurityProvider")
  }
  return context
}
