import type React from "react"
import { AdminSecurityProvider } from "@/components/admin-security-provider"
import { Navbar } from "@/components/navbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminSecurityProvider>
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-24">{children}</div>
      </div>
    </AdminSecurityProvider>
  )
}
