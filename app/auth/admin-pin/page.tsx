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
    window.location.href = "https://sg44admin.gurusingapore.com"
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {user && (
        <AdminPinDialog
          isOpen={open}
          onClose={() => setOpen(false)}
          onSuccess={onSuccess}
          userEmail={user.email || ""}
        />
      )}
    </div>
  )
}


