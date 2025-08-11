"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Shield, Lock, Eye, EyeOff } from "lucide-react"

interface AdminPinDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userEmail: string
}

export function AdminPinDialog({ isOpen, onClose, onSuccess, userEmail }: AdminPinDialogProps) {
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPin, setShowPin] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) {
      setError("Please enter your admin PIN")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("🔐 Verifying admin PIN for:", userEmail)

      // Call the verify_admin_pin function
      const { data, error } = await supabase.rpc("verify_admin_pin", {
        user_email: userEmail,
        input_pin: pin.trim(),
      })

      if (error) {
        console.error("❌ PIN verification error:", error)
        setError("Failed to verify PIN. Please try again.")
        return
      }

      if (data === true) {
        console.log("✅ PIN verified successfully")

        // Store PIN verification in session storage
        sessionStorage.setItem("admin_pin_verified", "true")
        sessionStorage.setItem("admin_pin_timestamp", Date.now().toString())

        // Log successful PIN verification
        await supabase.rpc("log_admin_action", {
          p_action: "pin_verification_success",
          p_resource: "auth",
          p_details: JSON.stringify({ email: userEmail }),
        })

        setPin("")
        onSuccess()
      } else {
        console.log("❌ Invalid PIN")
        setError("Invalid PIN. Please check your PIN and try again.")

        // Log failed PIN attempt
        await supabase.rpc("log_admin_action", {
          p_action: "pin_verification_failed",
          p_resource: "auth",
          p_details: JSON.stringify({ email: userEmail }),
        })
      }
    } catch (error) {
      console.error("❌ Unexpected error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPin("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-black border border-red-600/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-red-500" />
            Admin Access Verification
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your admin PIN to access the admin panel. This is required for security purposes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="pin" className="text-sm font-medium text-white">
              Admin PIN
            </label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your admin PIN"
                className="bg-gray-900 border-gray-700 text-white pr-10"
                disabled={loading}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPin(!showPin)}
                disabled={loading}
              >
                {showPin ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-600/20">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !pin.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Verify PIN
                </div>
              )}
            </Button>
          </div>
        </form>

        <div className="text-xs text-gray-500 text-center pt-2">
          PIN verification is valid for 1 hour for security purposes.
        </div>
      </DialogContent>
    </Dialog>
  )
}
