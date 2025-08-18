"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Settings } from "lucide-react"
import { AdminSetPinDialog } from "./admin-set-pin-dialog"

interface AdminPinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AdminPinDialog({ open, onOpenChange, onSuccess }: AdminPinDialogProps) {
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSetPinDialog, setShowSetPinDialog] = useState(false)
  const [hasPinSet, setHasPinSet] = useState(false)
  const [checkingPinStatus, setCheckingPinStatus] = useState(true)

  // Check if admin has PIN set when dialog opens
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
        
        // If no PIN is set, show set PIN dialog
        if (!data.hasPinSet) {
          setShowSetPinDialog(true)
        }
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

    if (!pin) {
      setError("PIN is required")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/pin-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ pin })
      })

      const data = await response.json()

      if (response.ok) {
        setPin("")
        onOpenChange(false)
        onSuccess()
      } else {
        setError(data.error || 'Invalid PIN')
      }
    } catch (error) {
      console.error('PIN verification error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setPin("")
    setError("")
    setShowPin(false)
    onOpenChange(false)
  }

  const handleSetPinSuccess = () => {
    setShowSetPinDialog(false)
    setHasPinSet(true)
    // Optionally close the main dialog or keep it open for immediate PIN entry
  }

  return (
    <>
      <Dialog open={open && !showSetPinDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Admin PIN Verification
            </DialogTitle>
            <DialogDescription>
              Enter your admin PIN to access admin features.
            </DialogDescription>
          </DialogHeader>

          {checkingPinStatus ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !hasPinSet ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-white/10 flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-medium mb-1">No Admin PIN set</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-xs">
                For your security, set a PIN before accessing admin features.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
                <Button 
                  onClick={() => setShowSetPinDialog(true)}
                  className="flex items-center justify-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Set Admin PIN
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div role="alert" aria-live="polite">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="pin">Admin PIN</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter your admin PIN"
                    className="pr-10"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    spellCheck={false}
                    maxLength={20}
                    aria-invalid={!!error}
                    disabled={isLoading}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPin(!showPin)}
                    disabled={isLoading}
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-500">PIN is 4–20 characters. Avoid sequences and repeated digits.</p>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSetPinDialog(true)}
                  disabled={isLoading}
                  className="text-xs text-gray-500 hover:text-gray-700 w-full sm:w-auto"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Change PIN
                </Button>
                
                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !pin}
                    className="min-w-[100px] w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Verifying...
                      </div>
                    ) : (
                      "Verify PIN"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AdminSetPinDialog
        open={showSetPinDialog}
        onOpenChange={setShowSetPinDialog}
        onSuccess={handleSetPinSuccess}
      />
    </>
  )
}
