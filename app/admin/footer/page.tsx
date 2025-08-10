"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Edit, Trash2, Plus, Search, Eye, EyeOff } from "lucide-react"

interface FooterContent {
  id: string
  section: string
  title: string
  content: string | null
  link_url: string | null
  link_text: string | null
  display_order: number
  is_active: boolean
}

export default function AdminFooterPage() {
  const [footerContent, setFooterContent] = useState<FooterContent[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<FooterContent | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    section: "",
    title: "",
    content: "",
    link_url: "",
    link_text: "",
    display_order: 0,
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchFooterContent()
  }, [])

  const fetchFooterContent = async () => {
    const { data } = await supabase
      .from("footer_content")
      .select("*")
      .order("section", { ascending: true })
      .order("display_order", { ascending: true })

    if (data) {
      setFooterContent(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingItem) {
        const { error } = await supabase.from("footer_content").update(formData).eq("id", editingItem.id)
        if (!error) {
          setEditingItem(null)
        }
      } else {
        const { error } = await supabase.from("footer_content").insert(formData)
        if (!error) {
          setShowCreateForm(false)
        }
      }

      setFormData({
        section: "",
        title: "",
        content: "",
        link_url: "",
        link_text: "",
        display_order: 0,
      })
      fetchFooterContent()
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("footer_content").update({ is_active: !currentStatus }).eq("id", id)

    if (!error) {
      fetchFooterContent()
    }
  }

  const deleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this footer item?")) {
      const { error } = await supabase.from("footer_content").delete().eq("id", id)

      if (!error) {
        fetchFooterContent()
      }
    }
  }

  const startEdit = (item: FooterContent) => {
    setEditingItem(item)
    setFormData({
      section: item.section,
      title: item.title,
      content: item.content || "",
      link_url: item.link_url || "",
      link_text: item.link_text || "",
      display_order: item.display_order,
    })
    setShowCreateForm(true)
  }

  const filteredContent = footerContent.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.section.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sections = ["about", "quick_links", "support", "legal", "social", "contact"]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manage Footer Content</h1>
          <p className="text-gray-400">Edit footer sections, links, and contact information</p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(true)
            setEditingItem(null)
            setFormData({
              section: "",
              title: "",
              content: "",
              link_url: "",
              link_text: "",
              display_order: 0,
            })
          }}
          className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Footer Item
        </Button>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search footer content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <GlassCard className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingItem ? "Edit Footer Item" : "Add New Footer Item"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Section *</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                  required
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section} value={section} className="bg-black">
                      {section.replace("_", " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Display Order</label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                placeholder="Footer item title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder-gray-400 min-h-[80px]"
                placeholder="Footer content text..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Link URL</label>
                <Input
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Link Text</label>
                <Input
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="Click here"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                {loading ? "Saving..." : editingItem ? "Update Item" : "Create Item"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingItem(null)
                }}
                className="border-white/10 text-white bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Footer Content List */}
      <div className="space-y-6">
        {sections.map((section) => {
          const sectionItems = filteredContent.filter((item) => item.section === section)
          if (sectionItems.length === 0) return null

          return (
            <GlassCard key={section} className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 capitalize">{section.replace("_", " ")} Section</h3>
              <div className="space-y-3">
                {sectionItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium">{item.title}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {item.content && <p className="text-gray-400 text-sm mb-1">{item.content}</p>}
                      {item.link_url && (
                        <p className="text-[#00ff88] text-sm">
                          {item.link_text} → {item.link_url}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${
                          item.is_active
                            ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                            : "border-green-500 text-green-500 hover:bg-green-500/10"
                        } bg-transparent`}
                        onClick={() => toggleActive(item.id, item.is_active)}
                      >
                        {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#00ff88] text-[#00ff88] bg-transparent"
                        onClick={() => startEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-500 bg-transparent hover:bg-red-500/10"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
