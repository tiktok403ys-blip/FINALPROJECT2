import type React from "react"
import { AdminSecurityProvider } from "@/components/admin-security-provider"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Client wrapper to manage sidebar state
  return (
    <AdminSecurityProvider>
      {/* Topbar + Sidebar layout */}
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AdminSecurityProvider>
  )
}

function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-black">
      <AdminTopbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <AdminSidebar open={sidebarOpen} />
      <div className="pt-14 lg:pl-64">
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
