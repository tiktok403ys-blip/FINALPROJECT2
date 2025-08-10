"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface EditCasinoPageProps {
  params: Promise<{ id: string }>
}

export default function EditCasinoPage({ params }: EditCasinoPageProps) {
  const [casinoId, setCasinoId] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rating: "",
    location: "",
    bonus_info: "",
    website_url: "",
    logo_url: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCasinoId(resolvedParams.id)
      fetchCasino(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchCasino = async (id: string) => {
    const { data, error } = await supabase.from("casinos").select("*").eq("id", id).single()

    if (error) {
      setError("Casino not found")
      return
    }

    if (data) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
        rating: data.rating?.toString() || "",
        location: data.location || "",
        bonus_info: data.bonus_info || "",
        website_url: data.website_url || "",
        logo_url: data.logo_url || "",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase
        .from("casinos")
        .update({
          ...formData,
          rating: formData.rating ? Number.parseFloat(formData.rating) : null,
        })
        .eq("id", casinoId)

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

  const generateLogoUrl = () => {
    const name = formData.name.replace(/\s+/g, "+")
    const colors = [
      { bg: "1a1a2e", color: "16213e" },
      { bg: "0f3460", color: "16537e" },
      { bg: "533483", color: "7209b7" },
      { bg: "f39801", color: "f39c12" },
      { bg: "00ff88", color: "000000" },
      { bg: "2c3e50", color: "ecf0f1" },
      { bg: "8e44ad", color: "ffffff" },
      { bg: "e74c3c", color: "ffffff" },
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const logoUrl = `/placeholder.svg?height=80&width=200&text=${name}&bg=${randomColor.bg}&color=${randomColor.color}`
    setFormData({ ...formData, logo_url: logoUrl })
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
            <h1 className="text-3xl font-bold text-white">Edit Casino</h1>
            <p className="text-gray-400">Update casino information and logo</p>
          </div>
        </div>

        <GlassCard className="p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Preview and URL */}
            <div className="space-y-4">
              <label className="text-white text-sm font-medium">Casino Logo</label>

              {/* Logo Preview */}
              {formData.logo_url && (
                <div className="w-full max-w-md mx-auto">
                  <div className="w-full h-20 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image
                      src={formData.logo_url || "/placeholder.svg"}
                      alt="Casino logo preview"
                      width={200}
                      height={80}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Logo URL Input */}
              <div className="flex gap-2">
                <Input
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="Logo URL or leave empty to auto-generate"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#00ff88] text-[#00ff88] bg-transparent"
                  onClick={generateLogoUrl}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
              <p className="text-gray-400 text-xs">
                Upload your logo to Supabase Storage or use the generate button for a placeholder logo
              </p>
            </div>

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
                  "Updating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Casino
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
