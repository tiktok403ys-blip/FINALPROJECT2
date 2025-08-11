import type React from "react"
import { AdminSecurityProvider } from "@/components/admin-security-provider"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminSecurityProvider>
      <div className="min-h-screen bg-black">
        {/* Navbar is already rendered in root layout - no duplication */}
        <div className="pt-24">{children}</div>
      </div>
    </AdminSecurityProvider>
  )
}
