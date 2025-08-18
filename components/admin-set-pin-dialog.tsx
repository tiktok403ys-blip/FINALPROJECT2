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

  // Check if admin already has PIN set
  useEffect(() => {
    if (open) {
      checkPinStatus()
    }
  }, [open])

  const checkPinStatus = async () => {
    try {
      setCheckingPinStatus(true)
      const response = await fetch('/api/admin/set-pin', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setHasPinSet(data.hasPinSet)
      }
    } catch (error) {
      console.error('Failed to check PIN status:', error)
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
        },
        credentials: 'include',
        body: JSON.stringify({
          newPin,
          confirmPin
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
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
              <Label htmlFor="newPin">New PIN</Label>
              <div className="relative">
                <Input
                  id="newPin"
                  type={showNewPin ? "text" : "password"}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN (4-20 characters)"
                  className="pr-10"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <div className="relative">
                <Input
                  id="confirmPin"
                  type={showConfirmPin ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Confirm new PIN"
                  className="pr-10"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">PIN Security Guidelines:</p>
                  <ul className="text-xs space-y-1 text-blue-700">
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !newPin || !confirmPin}
                className="min-w-[100px]"
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