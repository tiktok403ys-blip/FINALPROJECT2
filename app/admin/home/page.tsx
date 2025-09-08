'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/sonner'
import {
  Home,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Eye
} from 'lucide-react'

interface HomeContent {
  id: string
  title: string
  description: string
  content: string
  section: string
  is_active: boolean
  created_at: string
  updated_at: string
}

function HomeContentPage() {
  const [contents, setContents] = useState<HomeContent[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    section: '',
    is_active: true
  })

  useEffect(() => {
    loadHomeContents()
  }, [])

  const loadHomeContents = async () => {
    try {
      setLoading(true)
      const supabaseClient = supabase()
      const { data, error } = await supabaseClient
        .from('home_contents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContents(data || [])
    } catch (error) {
      console.error('Error loading home contents:', error)
      toast.error('Load Failed', 'Unable to load home contents. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.title.trim() || !formData.content.trim()) {
        toast.error('Validation Error', 'Title and content are required fields')
        return
      }

      if (editingId) {
        // Update existing content
        const supabaseClient = supabase()
        const { error } = await supabaseClient
          .from('home_contents')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Content Updated', 'Home content has been updated successfully')
      } else {
        // Create new content
        const supabaseClient = supabase()
        const { error } = await supabaseClient
          .from('home_contents')
          .insert([formData])

        if (error) throw error
        toast.success('Content Created', 'New home content has been added successfully')
      }

      resetForm()
      loadHomeContents()
    } catch (error) {
      console.error('Error saving home content:', error)
      toast.error('Save Failed', 'Unable to save home content. Please check your connection and try again.')
    }
  }

  const handleEdit = (content: HomeContent) => {
    setEditingId(content.id)
    setFormData({
      title: content.title,
      description: content.description,
      content: content.content,
      section: content.section,
      is_active: content.is_active
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('home_contents')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Content Deleted', 'Home content has been deleted successfully')
      loadHomeContents()
    } catch (error) {
      console.error('Error deleting home content:', error)
      toast.error('Delete Failed', 'Unable to delete home content. Please try again or contact support.')
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('home_contents')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      toast.success('Status Updated', 'Content status has been updated successfully')
      loadHomeContents()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Status Update Failed', 'Unable to update content status. Please try again.')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      content: '',
      section: '',
      is_active: true
    })
  }

  const filteredContents = contents.filter(content =>
    content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.section.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading home contents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Home className="w-8 h-8 mr-3" />
            Home Content Management
          </h1>
          <p className="text-white/70">Manage content for the home page</p>
        </div>
        <Button
          onClick={() => setEditingId('new')}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>

      {/* Shortcuts */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          <a href="/admin/home/alerts" className="px-4 py-2 rounded border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/10">Manage Alerts</a>
        </div>
      </div>

      {/* Search */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              placeholder="Search by title or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {editingId && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              {editingId === 'new' ? 'Add New Content' : 'Edit Content'}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Content title"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Section</label>
                <Input
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="Content section (e.g., hero, features)"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Content body (supports HTML)"
                rows={6}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-white/90">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span>Active</span>
              </label>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save Content
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      <div className="grid gap-4">
        {filteredContents.map((content) => (
          <Card key={content.id} className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">{content.title}</CardTitle>
                  <CardDescription className="text-white/60">
                    Section: {content.section} • {content.description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={content.is_active ? "secondary" : "destructive"}
                    className={content.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                    onClick={() => toggleStatus(content.id, content.is_active)}
                    style={{ cursor: 'pointer' }}
                  >
                    {content.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(content)}
                    className="text-white/70 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(content.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-white/80 text-sm line-clamp-3">
                {content.content.length > 200 ? `${content.content.substring(0, 200)}...` : content.content}
              </div>
              <div className="flex justify-between items-center mt-4 text-xs text-white/50">
                <span>Created: {new Date(content.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(content.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContents.length === 0 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="text-center py-12">
            <Home className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No home contents found</p>
            <Button
              onClick={() => setEditingId('new')}
              className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function HomeContentPageWrapper() {
  return (
    <ProtectedRoute>
      <HomeContentPage />
    </ProtectedRoute>
  )
}