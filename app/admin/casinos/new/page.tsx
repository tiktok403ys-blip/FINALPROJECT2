"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function NewCasinoPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rating: "",
    location: "",
    bonus_info: "",
    website_url: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.from("casinos").insert({
        ...formData,
        rating: formData.rating ? Number.parseFloat(formData.rating) : null,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/admin/casinos")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="text-white mr-4">
            <Link href="/admin/casinos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Casinos
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Add New Casino</h1>
            <p className="text-gray-400">Create a new casino listing</p>
          </div>
        </div>

        <GlassCard className="p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Casino Name *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="Enter casino name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Rating (0-5)</label>
                <Input
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="4.5"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Location</label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="Malta, Curacao, etc."
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Website URL</label>
                <Input
                  name="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="https://casino.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder-gray-400 min-h-[100px]"
                placeholder="Describe the casino..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Bonus Information</label>
              <Textarea
                name="bonus_info"
                value={formData.bonus_info}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder-gray-400 min-h-[80px]"
                placeholder="Welcome bonus details..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Casino
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
                <Link href="/admin/casinos">Cancel</Link>
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
