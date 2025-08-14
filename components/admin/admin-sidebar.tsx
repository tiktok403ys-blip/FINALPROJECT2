"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Newspaper, Building2, Gift, Users, FileText, MessageSquare, ListOrdered } from "lucide-react"

const items = [
  { href: "/admin", name: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/news", name: "News", icon: Newspaper },
  { href: "/admin/casinos", name: "Casinos", icon: Building2 },
  { href: "/admin/bonuses", name: "Bonuses", icon: Gift },
  { href: "/admin/reviews", name: "Reviews", icon: FileText },
  { href: "/admin/player-reviews", name: "Player Reviews", icon: Users },
  { href: "/admin/reports", name: "Reports", icon: MessageSquare },
  { href: "/admin/audit", name: "Audit Logs", icon: ListOrdered },
  { href: "/admin/site-settings", name: "Site Settings", icon: ListOrdered },
]

interface AdminSidebarProps {
  open: boolean
}

export function AdminSidebar({ open }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-black/90 border-r border-white/10 transform transition-transform duration-200 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Admin sidebar"
    >
      <nav className="mt-14 p-3 space-y-1">
        {items.map(({ href, name, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                active
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}


