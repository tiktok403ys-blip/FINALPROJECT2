"use client"

import type React from "react"

import { useState } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, Send, CheckCircle } from "lucide-react"

export default function ReportsPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [casinoName, setCasinoName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.from("reports").insert({
        title,
        description,
        casino_name: casinoName,
        user_email: userEmail,
        status: "pending",
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTitle("")
        setDescription("")
        setCasinoName("")
        setUserEmail("")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <GlassCard className="p-12">
              <CheckCircle className="w-16 h-16 text-[#00ff88] mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">Report Submitted</h1>
              <p className="text-gray-400 text-lg mb-8">
                Thank you for your report. We take all reports seriously and will investigate this matter promptly. You
                should receive a confirmation email shortly.
              </p>
              <Button onClick={() => setSuccess(false)} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                Submit Another Report
              </Button>
            </GlassCard>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Report an Issue</h1>
          <p className="text-gray-400 text-lg">
            Help us maintain a safe and fair gaming environment by reporting any issues or concerns
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <GlassCard className="p-8">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-6 h-6 text-[#00ff88] mr-3" />
              <h2 className="text-xl font-semibold text-white">Submit a Report</h2>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Your Email</label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Casino Name</label>
                  <Input
                    value={casinoName}
                    onChange={(e) => setCasinoName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    placeholder="Name of the casino"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Issue Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Detailed Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400 min-h-[150px]"
                  placeholder="Please provide as much detail as possible about the issue you experienced..."
                  required
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  <strong>Note:</strong> All reports are reviewed by our team. We may contact you for additional
                  information. Please ensure your contact information is accurate.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </form>
          </GlassCard>

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">What to Report</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• Unfair gaming practices</li>
                <li>• Payment issues or delays</li>
                <li>• Misleading bonus terms</li>
                <li>• Poor customer service</li>
                <li>• Technical problems</li>
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Our Process</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• Reports reviewed within 24 hours</li>
                <li>• Investigation conducted if needed</li>
                <li>• Follow-up communication provided</li>
                <li>• Action taken when appropriate</li>
                <li>• Confidentiality maintained</li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
