"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PaginationControls } from "@/components/admin/pagination"
import { AdminAuth } from "@/lib/auth/admin-auth"
import { 
  Eye, 
  EyeOff, 
  Search, 
  Trash2, 
  Edit, 
  Plus, 
  Save, 
  X, 
  Star, 
  ExternalLink,
  Building2,
  Calendar,
  User,
  Award
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExpertReviewRow {
  id: string
  casino_id: string
  title: string
  content: string
  rating: number
  pros: string[]
  cons: string[]
  summary: string | null
  slug: string
  author_name: string | null
  author_id: string | null
  is_featured: boolean
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  casinos?: { 
    id: string
    name: string | null
    logo_url: string | null
    website_url: string | null
  }
}

interface FormData {
  casino_id: string
  title: string
  content: string
  rating: number
  pros: string[]
  cons: string[]
  summary: string
  slug: string
  author_name: string
  is_featured: boolean
  is_published: boolean
  published_at: string | null
}

export default function AdminExpertReviewsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<ExpertReviewRow[]>([])
  const [casinos, setCasinos] = useState<Array<{ id: string; name: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "published" | "draft">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating" | "featured">("newest")
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const pageSize = 12
  const adminAuth = AdminAuth.getInstance()
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    casino_id: "",
    title: "",
    content: "",
    rating: 7.0,
    pros: [""],
    cons: [""],
    summary: "",
    slug: "",
    author_name: "GuruSingapore Expert Team",
    is_featured: false,
    is_published: false,
    published_at: null
  })

  const fetchRows = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    const { data } = await supabase
      .from("casino_reviews")
      .select("*, casinos(id, name, logo_url, website_url)")
      .order("created_at", { ascending: false })
      .range(from, to)
    
    setRows(data || [])
    setLoading(false)
  }, [page, pageSize, supabase])

  const fetchCasinos = useCallback(async () => {
    const { data } = await supabase
      .from("casinos")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
    
    setCasinos(data || [])
  }, [supabase])

  useEffect(() => {
    fetchRows()
    fetchCasinos()
  }, [fetchRows, fetchCasinos])

  useEffect(() => {
    const channel = supabase
      .channel("expert-reviews-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "casino_reviews" }, () => fetchRows())
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRows, supabase])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows
      .filter((r) => (status === "published" ? r.is_published : status === "draft" ? !r.is_published : true))
      .filter((r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.author_name || "").toLowerCase().includes(q) ||
        (r.casinos?.name || "").toLowerCase().includes(q)
      )
  }, [rows, search, status])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortBy === "newest") arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === "oldest") arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sortBy === "rating") arr.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    else if (sortBy === "featured") arr.sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    return arr
  }, [filtered, sortBy])

  const generateSlug = useCallback((title: string, casinoName: string) => {
    const casinoSlug = casinoName.toLowerCase().replace(/\s+/g, "-")
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    return `${casinoSlug}-${titleSlug}`
  }, [])

  const handleCasinoChange = useCallback((casinoId: string) => {
    const casino = casinos.find(c => c.id === casinoId)
    if (casino && formData.title) {
      const newSlug = generateSlug(formData.title, casino.name || "")
      setFormData(prev => ({ ...prev, casino_id: casinoId, slug: newSlug }))
    } else {
      setFormData(prev => ({ ...prev, casino_id: casinoId }))
    }
  }, [casinos, formData.title, generateSlug])

  const handleTitleChange = useCallback((title: string) => {
    const casino = casinos.find(c => c.id === formData.casino_id)
    if (casino) {
      const newSlug = generateSlug(title, casino.name || "")
      setFormData(prev => ({ ...prev, title, slug: newSlug }))
    } else {
      setFormData(prev => ({ ...prev, title }))
    }
  }, [casinos, formData.casino_id, generateSlug])

  const addPro = useCallback(() => {
    setFormData(prev => ({ ...prev, pros: [...prev.pros, ""] }))
  }, [])

  const removePro = useCallback((index: number) => {
    setFormData(prev => ({ ...prev, pros: prev.pros.filter((_, i) => i !== index) }))
  }, [])

  const updatePro = useCallback((index: number, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      pros: prev.pros.map((pro, i) => i === index ? value : pro)
    }))
  }, [])

  const addCon = useCallback(() => {
    setFormData(prev => ({ ...prev, cons: [...prev.cons, ""] }))
  }, [])

  const removeCon = useCallback((index: number) => {
    setFormData(prev => ({ ...prev, cons: prev.cons.filter((_, i) => i !== index) }))
  }, [])

  const updateCon = useCallback((index: number, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      cons: prev.cons.map((con, i) => i === index ? value : con)
    }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      casino_id: "",
      title: "",
      content: "",
      rating: 7.0,
      pros: [""],
      cons: [""],
      summary: "",
      slug: "",
      author_name: "GuruSingapore Expert Team",
      is_featured: false,
      is_published: false,
      published_at: null
    })
    setEditingId(null)
    setShowForm(false)
  }, [])

  const handleEdit = useCallback((row: ExpertReviewRow) => {
    setFormData({
      casino_id: row.casino_id,
      title: row.title,
      content: row.content,
      rating: row.rating,
      pros: row.pros.length > 0 ? row.pros : [""],
      cons: row.cons.length > 0 ? row.cons : [""],
      summary: row.summary || "",
      slug: row.slug,
      author_name: row.author_name || "GuruSingapore Expert Team",
      is_featured: row.is_featured,
      is_published: row.is_published,
      published_at: row.published_at
    })
    setEditingId(row.id)
    setShowForm(true)
  }, [])

  const handleSave = useCallback(async () => {
    try {
      // Validation
      if (!formData.casino_id || !formData.title || !formData.content) {
        toast({ title: "Validation Error", description: "Casino, title, and content are required", variant: "error" })
        return
      }

      if (formData.rating < 0 || formData.rating > 10) {
        toast({ title: "Validation Error", description: "Rating must be between 0 and 10", variant: "error" })
        return
      }

      // Filter out empty pros/cons
      const cleanPros = formData.pros.filter(pro => pro.trim() !== "")
      const cleanCons = formData.cons.filter(con => con.trim() !== "")

      const reviewData = {
        ...formData,
        pros: cleanPros,
        cons: cleanCons,
        published_at: formData.is_published ? (formData.published_at || new Date().toISOString()) : null,
        updated_at: new Date().toISOString()
      }

      if (editingId) {
        // Update existing review
        const { error } = await supabase
          .from("casino_reviews")
          .update(reviewData)
          .eq("id", editingId)

        if (error) throw error
        
        await adminAuth.logAdminAction("update", "casino_reviews", editingId, { updated_data: reviewData })
        toast({ title: "Review Updated", description: "Expert review has been updated successfully" })
      } else {
        // Create new review
        const { error } = await supabase
          .from("casino_reviews")
          .insert([{
            ...reviewData,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
        
        await adminAuth.logAdminAction("create", "casino_reviews", "*", { new_data: reviewData })
        toast({ title: "Review Created", description: "New expert review has been created successfully" })
      }

      resetForm()
      fetchRows()
    } catch (error: any) {
      console.error("Error saving review:", error)
      toast({ title: "Error", description: error.message, variant: "error" })
    }
  }, [formData, editingId, supabase, adminAuth, toast, resetForm, fetchRows])

  const togglePublished = useCallback(async (row: ExpertReviewRow) => {
    try {
      const newPublishedStatus = !row.is_published
      const publishedAt = newPublishedStatus ? new Date().toISOString() : null
      
      const { error } = await supabase
        .from("casino_reviews")
        .update({ 
          is_published: newPublishedStatus, 
          published_at: publishedAt,
          updated_at: new Date().toISOString()
        })
        .eq("id", row.id)

      if (error) throw error
      
      await adminAuth.logAdminAction("toggle_published", "casino_reviews", row.id, { 
        is_published: newPublishedStatus,
        published_at: publishedAt
      })
      
      toast({ 
        title: newPublishedStatus ? "Review Published" : "Review Unpublished", 
        description: row.title 
      })
      
      fetchRows()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "error" })
    }
  }, [supabase, adminAuth, toast, fetchRows])

  const toggleFeatured = useCallback(async (row: ExpertReviewRow) => {
    try {
      const { error } = await supabase
        .from("casino_reviews")
        .update({ 
          is_featured: !row.is_featured,
          updated_at: new Date().toISOString()
        })
        .eq("id", row.id)

      if (error) throw error
      
      await adminAuth.logAdminAction("toggle_featured", "casino_reviews", row.id, { 
        is_featured: !row.is_featured 
      })
      
      toast({ 
        title: row.is_featured ? "Review Unfeatured" : "Review Featured", 
        description: row.title 
      })
      
      fetchRows()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "error" })
    }
  }, [supabase, adminAuth, toast, fetchRows])

  const deleteRow = useCallback(async (row: ExpertReviewRow) => {
    if (!confirm(`Delete expert review: "${row.title}"?`)) return
    
    try {
      const { error } = await supabase
        .from("casino_reviews")
        .delete()
        .eq("id", row.id)

      if (error) throw error
      
      await adminAuth.logAdminAction("delete", "casino_reviews", row.id, {})
      toast({ title: "Review Deleted", description: row.title })
      fetchRows()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "error" })
    }
  }, [supabase, adminAuth, toast, fetchRows])

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Expert Reviews Management</h1>
              <p className="text-gray-400">Manage professional casino reviews and expert analysis</p>
            </div>
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Review
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="rating">Highest Rating</SelectItem>
                <SelectItem value="featured">Featured First</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-right">
              <span className="text-gray-400 text-sm">
                {sorted.length} of {rows.length} reviews
              </span>
            </div>
          </div>

          {/* Reviews Table */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Loading reviews...</div>
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400">No reviews found</div>
              </div>
            ) : (
              sorted.map((row) => (
                <GlassCard key={row.id} className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Casino Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {row.casinos?.logo_url ? (
                          <Image 
                            src={row.casinos.logo_url} 
                            alt={row.casinos.name || "Casino"} 
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {row.casinos?.name || "Unknown Casino"}
                        </h3>
                        <p className="text-gray-300 text-sm line-clamp-2">{row.title}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {row.rating}/10
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(row.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {row.author_name || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col gap-3 min-w-0">
                      <div className="flex items-center gap-2">
                        {row.is_featured && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                            <Award className="w-3 h-3 inline mr-1" />
                            Featured
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          row.is_published 
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}>
                          {row.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePublished(row)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          {row.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFeatured(row)}
                          className={`border-white/20 text-white hover:bg-white/10 ${
                            row.is_featured ? "bg-yellow-500/20 border-yellow-500/30" : ""
                          }`}
                        >
                          <Award className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(row)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRow(row)}
                          className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="mt-8">
            <PaginationControls
              page={page}
              setPage={setPage}
              disablePrev={page === 1}
              disableNext={page >= Math.ceil(rows.length / pageSize)}
            />
          </div>
        </div>

        {/* Form Sidebar */}
        {showForm && (
          <div className="lg:w-96">
            <GlassCard className="p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingId ? "Edit Review" : "New Review"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                {/* Casino Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Casino *</label>
                  <Select value={formData.casino_id} onValueChange={handleCasinoChange}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select casino" />
                    </SelectTrigger>
                    <SelectContent>
                      {casinos.map((casino) => (
                        <SelectItem key={casino.id} value={casino.id}>
                          {casino.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Review title"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="URL slug"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rating (0-10) *</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Summary</label>
                  <Textarea
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Brief summary of the review"
                    rows={3}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Pros */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pros</label>
                  <div className="space-y-2">
                    {formData.pros.map((pro, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={pro}
                          onChange={(e) => updatePro(index, e.target.value)}
                          placeholder={`Pro ${index + 1}`}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                        {formData.pros.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePro(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPro}
                      className="border-white/20 text-white hover:bg-white/10 w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pro
                    </Button>
                  </div>
                </div>

                {/* Cons */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cons</label>
                  <div className="space-y-2">
                    {formData.cons.map((con, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={con}
                          onChange={(e) => updateCon(index, e.target.value)}
                          placeholder={`Con ${index + 1}`}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                        {formData.cons.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCon(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCon}
                      className="border-white/20 text-white hover:bg-white/10 w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Con
                    </Button>
                  </div>
                </div>

                {/* Author Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Author Name</label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                    placeholder="Author name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content *</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Full review content"
                    rows={8}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked as boolean }))}
                      className="border-white/20 data-[state=checked]:bg-[#00ff88] data-[state=checked]:border-[#00ff88]"
                    />
                    <label htmlFor="is_featured" className="text-sm text-gray-300">Featured Review</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked as boolean }))}
                      className="border-white/20 data-[state=checked]:bg-[#00ff88] data-[state=checked]:border-[#00ff88]"
                    />
                    <label htmlFor="is_published" className="text-sm text-gray-300">Published</label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  )
}
