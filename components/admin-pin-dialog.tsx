"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Settings } from "lucide-react"
import { AdminSetPinDialog } from "./admin-set-pin-dialog"
import { createClient } from "@/lib/supabase/client"

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
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
      return {}
    }
  }

  const checkPinStatus = useCallback(async () => {
    try {
      setCheckingPinStatus(true)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/pin-status', {
        method: 'GET',
        credentials: 'include',
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        setHasPinSet(data.hasPinSet)
        if (!data.hasPinSet) {
          setShowSetPinDialog(true)
        }
      }
    } catch (error) {
      console.error('Failed to check PIN status:', error)
    } finally {
      setCheckingPinStatus(false)
    }
  }, [])

  // Check if admin has PIN set when dialog opens
  useEffect(() => {
    if (!open) return

    // Pre-fetch CSRF token for subsequent POST
    ;(async () => {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/admin/csrf-token', { method: 'GET', credentials: 'include', headers })
        if (res.ok) {
          const data = await res.json()
          setCsrfToken(data?.token || null)
        }
      } catch {}
      finally {
        checkPinStatus()
      }
    })()
  }, [open, checkPinStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!pin) {
      setError("PIN is required")
      return
    }

    setIsLoading(true)

    try {
      // Ensure CSRF token
      let token = csrfToken
      if (!token) {
        try {
          const headers = await getAuthHeaders()
          const res = await fetch('/api/admin/csrf-token', { method: 'GET', credentials: 'include', headers })
          if (res.ok) {
            const data = await res.json()
            token = data?.token || null
            setCsrfToken(token)
          }
        } catch {}
      }

      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/pin-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-csrf-token': token } : {}),
          ...headers,
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
        <DialogContent className="sm:max-w-md bg-[#0B0F1A] text-white border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#00ff88]" />
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
                <Label htmlFor="pin" className="text-white/90">Admin PIN</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter your admin PIN"
                    className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
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
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/70"
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
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !pin}
                    className="min-w-[100px] w-full sm:w-auto bg-[#00ff88] text-black hover:bg-[#00e07a]"
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
