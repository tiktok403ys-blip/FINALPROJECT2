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

export default function NewNewsPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    published: false,
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
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("news").insert({
        ...formData,
        author_id: user?.id,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/admin/news")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const categories = ["Regulation", "Games", "Security", "Industry", "Reviews", "Bonuses"]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="text-white mr-4">
            <Link href="/admin/news">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create News Article</h1>
            <p className="text-gray-400">Write and publish a new news article</p>
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
                <label className="text-white text-sm font-medium">Title *</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="Enter article title"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                >
                  <option value="" className="bg-black">
                    Select category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-black">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Excerpt</label>
              <Textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder-gray-400 min-h-[80px]"
                placeholder="Brief summary of the article..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Content *</label>
              <Textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder-gray-400 min-h-[300px]"
                placeholder="Write your article content here..."
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="published"
                name="published"
                checked={formData.published}
                onChange={handleChange}
                className="w-4 h-4 text-[#00ff88] bg-white/5 border-white/10 rounded focus:ring-[#00ff88]"
              />
              <label htmlFor="published" className="text-white text-sm font-medium">
                Publish immediately
              </label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {formData.published ? "Publish Article" : "Save Draft"}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
                <Link href="/admin/news">Cancel</Link>
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
