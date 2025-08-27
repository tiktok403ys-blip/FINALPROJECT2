"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Shield } from "lucide-react"
import { toast } from "sonner"

interface AdminSetPinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AdminSetPinDialog({ open, onOpenChange, onSuccess }: AdminSetPinDialogProps) {
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasPinSet, setHasPinSet] = useState(false)
  const [checkingPinStatus, setCheckingPinStatus] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  // Check if admin already has PIN set
  useEffect(() => {
    if (open) {
      // Prefetch CSRF token for POST operations
      ;(async () => {
        try {
          const res = await fetch('/api/admin/csrf-token', { method: 'GET', credentials: 'include' })
          if (res.ok) {
            const data = await res.json()
            setCsrfToken(data?.token || null) // Fixed: use 'token' not 'csrfToken'
          }
        } catch {}
        finally {
          checkPinStatus()
        }
      })()
    }
  }, [open])

  const checkPinStatus = async () => {
    try {
      setCheckingPinStatus(true)
      // FIXED: Use the correct PIN status endpoint
      const response = await fetch('/api/admin/pin-status', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setHasPinSet(data.hasPinSet || false)
      }
    } catch (error) {
      console.error('Failed to check PIN status:', error)
      setHasPinSet(false) // Fallback to false
    } finally {
      setCheckingPinStatus(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!newPin || !confirmPin) {
      setError("Both PIN fields are required")
      return
    }

    if (newPin.length < 4) {
      setError("PIN must be at least 4 characters long")
      return
    }

    if (newPin.length > 20) {
      setError("PIN must be no more than 20 characters long")
      return
    }

    if (newPin !== confirmPin) {
      setError("PIN confirmation does not match")
      return
    }

    // Check for weak PINs
    if (/^(\d)\1+$/.test(newPin)) {
      setError("PIN cannot be all the same digit")
      return
    }

    if (/^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(newPin)) {
      setError("PIN cannot be a sequential pattern")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/set-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}), // Fixed: use correct header name
        },
        credentials: 'include',
        body: JSON.stringify({
          pin: newPin,           // FIXED: Backend expects 'pin' not 'newPin'
          confirmPin: confirmPin // FIXED: Backend expects 'confirmPin'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(hasPinSet ? "PIN updated successfully" : "PIN set successfully")
        setNewPin("")
        setConfirmPin("")
        onOpenChange(false)
        onSuccess?.()
      } else {
        setError(data.error || 'Failed to set PIN')
      }
    } catch (error) {
      console.error('Set PIN error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNewPin("")
    setConfirmPin("")
    setError("")
    setShowNewPin(false)
    setShowConfirmPin(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0B0F1A] text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#00ff88]" />
            {hasPinSet ? "Update Admin PIN" : "Set Admin PIN"}
          </DialogTitle>
          <DialogDescription>
            {hasPinSet 
              ? "Update your admin PIN for secure access to admin features."
              : "Set a secure PIN for admin access. This PIN will be required for sensitive admin operations."
            }
          </DialogDescription>
        </DialogHeader>

        {checkingPinStatus ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPin" className="text-white/90">New PIN</Label>
              <div className="relative">
                <Input
                  id="newPin"
                  type={showNewPin ? "text" : "password"}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN (4-20 characters)"
                  className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/70"
                  onClick={() => setShowNewPin(!showNewPin)}
                  disabled={isLoading}
                >
                  {showNewPin ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin" className="text-white/90">Confirm PIN</Label>
              <div className="relative">
                <Input
                  id="confirmPin"
                  type={showConfirmPin ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Confirm new PIN"
                  className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/70"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  disabled={isLoading}
                >
                  {showConfirmPin ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-[#00ff88] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/90">
                  <p className="font-medium mb-1">PIN Security Guidelines:</p>
                  <ul className="text-xs space-y-1 text-white/70">
                    <li>• Use 4-20 characters</li>
                    <li>• Avoid sequential numbers (1234, 4321)</li>
                    <li>• Avoid repeated digits (1111, 2222)</li>
                    <li>• Mix numbers and letters for better security</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !newPin || !confirmPin}
                className="min-w-[100px] bg-[#00ff88] text-black hover:bg-[#00e07a]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Setting...
                  </div>
                ) : (
                  hasPinSet ? "Update PIN" : "Set PIN"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}