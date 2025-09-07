"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
// PIN dialog removed

export default function AdminPinPage() {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/auth/login"
    }
  }, [loading, user])

  const onSuccess = () => {
    // Fallback to main domain if admin subdomain not configured
    const adminSubdomain = process.env.NEXT_PUBLIC_ADMIN_SUBDOMAIN
    if (adminSubdomain && adminSubdomain !== 'undefined') {
      window.location.href = `https://${adminSubdomain}`
    } else {
      // Redirect to admin path on main domain as fallback
      window.location.href = '/admin'
    }
  }

  return <div className="min-h-screen bg-black flex items-center justify-center" />
}


