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
    priority: "medium",
    amount_disputed: "",
    contact_method: "email",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("reports").insert({
        title: formData.title,
        description: formData.description,
        casino_name: formData.casino_name,
        casino_id: casinoId || null,
        user_email: formData.user_email,
        category: formData.category,
        priority: formData.priority,
        amount_disputed: formData.amount_disputed ? Number.parseFloat(formData.amount_disputed) : null,
        contact_method: formData.contact_method,
        status: "pending",
        report_type: "complaint",
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setSuccess(true)
        toast({
          title: "Report Submitted",
          description: "Your report has been submitted successfully. We'll review it within 24 hours.",
        })

        // Reset form
        setFormData({
          title: "",
          description: "",
          casino_name: casinoName || "",
          user_email: "",
          category: "",
          priority: "medium",
          amount_disputed: "",
          contact_method: "email",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
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
                onValueChange={(value) => setFormData({ ...formData, contact_method: value })}
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
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
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
