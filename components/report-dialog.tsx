"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, Send, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportDialogProps {
  children: React.ReactNode
  casinoId?: string
  casinoName?: string
}

export function ReportDialog({ children, casinoId, casinoName }: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    casino_name: casinoName || "",
    user_email: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    amount_disputed: "",
    contact_method: "email" as "email" | "phone" | "both",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Import server action
      const { createReport } = await import("@/app/actions/report-actions")
      
      const result = await createReport(formData)

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Report Submitted Successfully!",
          description: "We've received your report and will investigate it within 24 hours.",
          variant: "default",
        })

        // Reset form
        setFormData({
          title: "",
          description: "",
          casino_name: casinoName || "",
          user_email: "",
          category: "",
          priority: "medium" as "low" | "medium" | "high" | "urgent",
          amount_disputed: "",
          contact_method: "email" as "email" | "phone" | "both",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setSuccess(false)
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="bg-black border-white/10 text-white max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-[#00ff88] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Report Submitted Successfully</h3>
            <p className="text-gray-400 mb-6">
              Thank you for your report. We take all reports seriously and will investigate this matter promptly.
            </p>
            <Button onClick={handleClose} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-black border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <AlertTriangle className="w-6 h-6 text-[#00ff88] mr-2" />
            Submit a Report
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Your Email *</label>
              <Input
                type="email"
                value={formData.user_email}
                onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Contact Method</label>
              <Select
                value={formData.contact_method}
                onValueChange={(value) => setFormData({ ...formData, contact_method: value as "email" | "phone" | "both" })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Casino Name</label>
              <Input
                value={formData.casino_name}
                onChange={(e) => setFormData({ ...formData, casino_name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Name of the casino"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Category *</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="payment_issue">Payment Issue</SelectItem>
                  <SelectItem value="withdrawal_delay">Withdrawal Delay</SelectItem>
                  <SelectItem value="bonus_dispute">Bonus Dispute</SelectItem>
                  <SelectItem value="account_closure">Account Closure</SelectItem>
                  <SelectItem value="unfair_terms">Unfair Terms</SelectItem>
                  <SelectItem value="technical_issue">Technical Issue</SelectItem>
                  <SelectItem value="customer_service">Customer Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Priority</label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as "low" | "medium" | "high" | "urgent" })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Amount Disputed (if applicable)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount_disputed}
                onChange={(e) => setFormData({ ...formData, amount_disputed: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Issue Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Detailed Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/5 border-white/10 text-white min-h-[120px]"
              placeholder="Please provide as much detail as possible about the issue you experienced..."
              required
            />
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              <strong>Important:</strong> All reports are reviewed by our team within 24 hours. We may contact you for
              additional information. Please ensure your contact information is accurate.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
