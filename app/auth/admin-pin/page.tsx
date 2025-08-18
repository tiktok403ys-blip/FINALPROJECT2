"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { AdminPinDialog } from "@/components/admin-pin-dialog"

export default function AdminPinPage() {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/auth/login"
    }
  }, [loading, user])

  const onSuccess = () => {
    window.location.href = `https://${process.env.NEXT_PUBLIC_ADMIN_SUBDOMAIN}`
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {user && (
        <AdminPinDialog
          open={open}
          onOpenChange={setOpen}
          onSuccess={onSuccess}
        />
      )}
    </div>
  )
}


