"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Shield, Eye, EyeOff, Lock } from "lucide-react"

interface AdminPinDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userEmail: string
}

export function AdminPinDialog({ isOpen, onClose, onSuccess, userEmail }: AdminPinDialogProps) {
  const [pin, setPin] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const [showPin, setShowPin] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pin || pin.length < 4) {
      setError("PIN must be at least 4 characters")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      console.log("🔐 Verifying admin PIN for:", userEmail)

      // Call the database function to verify PIN
      const { data, error } = await supabase.rpc("verify_admin_pin", {
        user_email: userEmail,
        input_pin: pin,
      })

      if (error) {
        console.error("❌ PIN verification error:", error)
        setError("Failed to verify PIN. Please try again.")
        return
      }

      if (data === true) {
        console.log("✅ PIN verified successfully")

        // Store verification in session storage (expires in 1 hour)
        const expirationTime = Date.now() + 60 * 60 * 1000 // 1 hour
        sessionStorage.setItem("admin_pin_verified", "true")
        sessionStorage.setItem("admin_pin_timestamp", expirationTime.toString())

        // Clear form
        setPin("")
        setError("")

        // Call success callback
        onSuccess()
      } else {
        console.log("❌ Invalid PIN")
        setError("Invalid PIN. Please try again.")
        setPin("")
      }
    } catch (error) {
      console.error("❌ Unexpected error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClose = () => {
    setPin("")
    setError("")
    setShowPin(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-black/95 backdrop-blur-xl border border-red-500/30 text-white">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <DialogTitle className="text-xl font-bold text-red-400">Admin Access Required</DialogTitle>
          <DialogDescription className="text-gray-300">
            Enter your admin PIN to access the admin panel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="pin" className="text-sm font-medium text-gray-300">
              Admin PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                className="pl-10 pr-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                disabled={isVerifying}
                autoComplete="off"
                maxLength={30}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isVerifying}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isVerifying}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isVerifying || !pin}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Access Admin Panel
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            <strong>Security Notice:</strong> Admin access is logged and monitored. Unauthorized access attempts will be
            recorded.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
