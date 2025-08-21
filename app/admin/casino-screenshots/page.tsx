"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PaginationControls } from "@/components/admin/pagination"
import { AdminAuth } from "@/lib/auth/admin-auth"
import ImageUpload from "@/components/admin/ImageUpload"
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
  Image as ImageIcon,
  Building2,
  Calendar,
  Award,
  Grid3X3
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CasinoScreenshotRow {
  id: string
  casino_id: string
  image_url: string
  title: string | null
  description: string | null
  category: string | null
  display_order: number
  is_featured: boolean
  created_at: string
  updated_at: string
  casinos?: { 
    id: string
    name: string | null
    logo_url: string | null
  }
}

interface FormData {
  casino_id: string
  image_url: string
  title: string
  description: string
  category: string
  display_order: number
  is_featured: boolean
}

export default function AdminCasinoScreenshotsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<CasinoScreenshotRow[]>([])
  const [casinos, setCasinos] = useState<Array<{ id: string; name: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<"all" | "lobby" | "games" | "mobile" | "promotions">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "order" | "featured">("newest")
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const pageSize = 12
  const adminAuth = AdminAuth.getInstance()
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    casino_id: "",
    image_url: "",
    title: "",
    description: "",
    category: "lobby",
    display_order: 1,
    is_featured: false
  })

  const fetchRows = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    const { data } = await supabase
      .from("casino_screenshots")
      .select("*, casinos(id, name, logo_url)")
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
      .channel("casino-screenshots-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "casino_screenshots" }, () => fetchRows())
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRows, supabase])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows
      .filter((r) => (category === "all" ? true : r.category === category))
      .filter((r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.casinos?.name || "").toLowerCase().includes(q)
      )
  }, [rows, search, category])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortBy === "newest") arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === "oldest") arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sortBy === "order") arr.sort((a, b) => a.display_order - b.display_order)
    else if (sortBy === "featured") arr.sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    return arr
  }, [filtered, sortBy])

  const resetForm = useCallback(() => {
    setFormData({
      casino_id: "",
      image_url: "",
      title: "",
      description: "",
      category: "lobby",
      display_order: 1,
      is_featured: false
    })
    setEditingId(null)
    setShowForm(false)
  }, [])

  const handleEdit = useCallback((row: CasinoScreenshotRow) => {
    setFormData({
      casino_id: row.casino_id,
      image_url: row.image_url,
      title: row.title || "",
      description: row.description || "",
      category: row.category || "lobby",
      display_order: row.display_order,
      is_featured: row.is_featured
    })
    setEditingId(row.id)
    setShowForm(true)
  }, [])

  const handleSave = useCallback(async () => {
    try {
      // Validation
      if (!formData.casino_id || !formData.image_url) {
        toast({ title: "Validation Error", description: "Casino and image are required", variant: "destructive" })
        return
      }

      const screenshotData = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      if (editingId) {
        // Update existing screenshot
        const { error } = await supabase
          .from("casino_screenshots")
          .update(screenshotData)
          .eq("id", editingId)

        if (error) throw error
        
        await adminAuth.logAdminAction("update", "casino_screenshots", editingId, { updated_data: screenshotData })
        toast({ title: "Screenshot Updated", description: "Casino screenshot has been updated successfully" })
      } else {
        // Create new screenshot
        const { error } = await supabase
          .from("casino_screenshots")
          .insert([{
            ...screenshotData,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
        
        await adminAuth.logAdminAction("create", "casino_screenshots", "*", { new_data: screenshotData })
        toast({ title: "Screenshot Created", description: "New casino screenshot has been created successfully" })
      }

      resetForm()
      fetchRows()
    } catch (error: any) {
      console.error("Error saving screenshot:", error)
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }, [formData, editingId, supabase, adminAuth, toast, resetForm, fetchRows])

  const toggleFeatured = useCallback(async (row: CasinoScreenshotRow) => {
    try {
      const { error } = await supabase
        .from("casino_screenshots")
        .update({ 
          is_featured: !row.is_featured,
          updated_at: new Date().toISOString()
        })
        .eq("id", row.id)

      if (error) throw error
      
      await adminAuth.logAdminAction("toggle_featured", "casino_screenshots", row.id, { 
        is_featured: !row.is_featured 
      })
      
      toast({ 
        title: row.is_featured ? "Screenshot Unfeatured" : "Screenshot Featured", 
        description: row.title || "Screenshot" 
      })
      
      fetchRows()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }, [supabase, adminAuth, toast, fetchRows])

  const deleteRow = useCallback(async (row: CasinoScreenshotRow) => {
    if (!confirm(`Delete screenshot: "${row.title || 'Untitled'}"?`)) return
    
    try {
      const { error } = await supabase
        .from("casino_screenshots")
        .delete()
        .eq("id", row.id)

      if (error) throw error
      
      await adminAuth.logAdminAction("delete", "casino_screenshots", row.id, {})
      toast({ title: "Screenshot Deleted", description: row.title || "Screenshot" })
      fetchRows()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }, [supabase, adminAuth, toast, fetchRows])

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Casino Screenshots Management</h1>
              <p className="text-gray-400">Manage visual content and screenshots for casino reviews</p>
            </div>
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Screenshot
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search screenshots..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="lobby">Lobby</SelectItem>
                <SelectItem value="games">Games</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="promotions">Promotions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="order">Display Order</SelectItem>
                <SelectItem value="featured">Featured First</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-right">
              <span className="text-gray-400 text-sm">
                {sorted.length} of {rows.length} screenshots
              </span>
            </div>
          </div>

          {/* Screenshots Grid */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Loading screenshots...</div>
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400">No screenshots found</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sorted.map((row) => (
                  <GlassCard key={row.id} className="p-4">
                    <div className="space-y-4">
                      {/* Image Preview */}
                      <div className="relative aspect-video bg-white/10 rounded-lg overflow-hidden">
                        <img 
                          src={row.image_url} 
                          alt={row.title || "Casino screenshot"} 
                          className="w-full h-full object-cover"
                        />
                        {row.is_featured && (
                          <div className="absolute top-2 right-2">
                            <Award className="w-5 h-5 text-[#00ff88]" />
                          </div>
                        )}
                      </div>

                      {/* Screenshot Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-white text-lg">
                          {row.title || "Untitled Screenshot"}
                        </h3>
                        {row.description && (
                          <p className="text-gray-300 text-sm line-clamp-2">{row.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Building2 className="w-3 h-3" />
                          {row.casinos?.name || "Unknown Casino"}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Grid3X3 className="w-3 h-3" />
                          {row.category || "General"}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(row.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFeatured(row)}
                          className={`border-white/20 text-white hover:bg-white/10 ${
                            row.is_featured ? "bg-yellow-500/20 border-yellow-500/30" : ""
                          }`}
                        >
                          <Star className="w-3 h-3" />
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
                  </GlassCard>
                ))}
              </div>
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
                  {editingId ? "Edit Screenshot" : "New Screenshot"}
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
                  <Select value={formData.casino_id} onValueChange={(value) => setFormData(prev => ({ ...prev, casino_id: value }))}>
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

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Screenshot Image *</label>
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                    bucket="casino-screenshots"
                    folder="expert-reviews"
                    accept="image/*"
                    maxSize={5}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Screenshot title"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Screenshot description"
                    rows={3}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lobby">Lobby</SelectItem>
                      <SelectItem value="games">Games</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="promotions">Promotions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Featured Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked as boolean }))}
                    className="border-white/20 data-[state=checked]:bg-[#00ff88] data-[state=checked]:border-[#00ff88]"
                  />
                  <label htmlFor="is_featured" className="text-sm text-gray-300">Featured Screenshot</label>
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
