import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin (you can add admin role check here)
  // For now, any authenticated user can access admin

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-24">{children}</div>
    </div>
  )
}
