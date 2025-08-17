'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Layout,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Link,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react'

interface FooterItem {
  id: string
  section: string
  title: string
  content: string
  link_url: string
  link_text: string
  order_index: number
  is_active: boolean
  item_type: string
  created_at: string
  updated_at: string
}

function FooterContentPage() {
  const [footerItems, setFooterItems] = useState<FooterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    section: '',
    title: '',
    content: '',
    link_url: '',
    link_text: '',
    order_index: 0,
    is_active: true,
    item_type: ''
  })

  const footerSections = [
    'About Us',
    'Quick Links',
    'Legal',
    'Contact Info',
    'Social Media',
    'Newsletter',
    'Copyright',
    'Responsible Gaming'
  ]

  const itemTypes = [
    'text',
    'link',
    'contact',
    'social',
    'legal',
    'newsletter',
    'copyright'
  ]

  useEffect(() => {
    loadFooterItems()
  }, [])

  const loadFooterItems = async () => {
    try {
      setLoading(true)
      const supabaseClient = supabase()
      const { data, error } = await supabaseClient
        .from('footer_content')
        .select('*')
        .order('section', { ascending: true })
        .order('order_index', { ascending: true })

      if (error) throw error
      setFooterItems(data || [])
    } catch (error) {
      console.error('Error loading footer items:', error)
      toast.error('Failed to load footer content')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.section.trim() || !formData.title.trim()) {
        toast.error('Section and title are required')
        return
      }

      if (editingId && editingId !== 'new') {
        // Update existing footer item
        const supabaseClient = supabase()
        const { error } = await supabaseClient
          .from('footer_content')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Footer item updated successfully')
      } else {
        // Create new footer item
        const supabaseClient = supabase()
        const { error } = await supabaseClient
          .from('footer_content')
          .insert([formData])

        if (error) throw error
        toast.success('Footer item created successfully')
      }

      resetForm()
      loadFooterItems()
    } catch (error) {
      console.error('Error saving footer item:', error)
      toast.error('Failed to save footer item')
    }
  }

  const handleEdit = (item: FooterItem) => {
    setEditingId(item.id)
    setFormData({
      section: item.section,
      title: item.title,
      content: item.content,
      link_url: item.link_url,
      link_text: item.link_text,
      order_index: item.order_index,
      is_active: item.is_active,
      item_type: item.item_type
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this footer item?')) return

    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('footer_content')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Footer item deleted successfully')
      loadFooterItems()
    } catch (error) {
      console.error('Error deleting footer item:', error)
      toast.error('Failed to delete footer item')
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('footer_content')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      toast.success('Status updated successfully')
      loadFooterItems()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      section: '',
      title: '',
      content: '',
      link_url: '',
      link_text: '',
      order_index: 0,
      is_active: true,
      item_type: ''
    })
  }

  const filteredItems = footerItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.section.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSection = sectionFilter === 'all' || item.section === sectionFilter
    const matchesType = typeFilter === 'all' || item.item_type === typeFilter
    return matchesSearch && matchesSection && matchesType
  })

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = []
    }
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, FooterItem[]>)

  const getIconForType = (type: string) => {
    switch (type) {
      case 'contact':
        return <Phone className="w-4 h-4" />
      case 'social':
        return <Globe className="w-4 h-4" />
      case 'link':
        return <Link className="w-4 h-4" />
      case 'newsletter':
        return <Mail className="w-4 h-4" />
      default:
        return <Layout className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading footer content...</p>
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
            <Layout className="w-8 h-8 mr-3" />
            Footer Management
          </h1>
          <p className="text-white/70">Manage website footer content and links</p>
        </div>
        <Button
          onClick={() => setEditingId('new')}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Footer Item
        </Button>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Search footer items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Filter by section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {footerSections.map(section => (
                  <SelectItem key={section} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {itemTypes.map(type => (
                  <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {editingId && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              {editingId === 'new' ? 'Add New Footer Item' : 'Edit Footer Item'}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Section</label>
                <Select value={formData.section} onValueChange={(value) => setFormData({ ...formData, section: value })}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {footerSections.map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Item Type</label>
                <Select value={formData.item_type} onValueChange={(value) => setFormData({ ...formData, item_type: value })}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map(type => (
                      <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Order Index</label>
                <Input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Footer item title"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Footer item content"
                rows={3}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Link URL</label>
                <Input
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://example.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Link Text</label>
                <Input
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  placeholder="Click here"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
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
                Save Footer Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Items by Section */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([section, items]) => (
          <Card key={section} className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Layout className="w-5 h-5 mr-2" />
                {section}
                <Badge className="ml-2 bg-white/10 text-white/70">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getIconForType(item.item_type)}
                          <h4 className="text-white font-medium ml-2">{item.title}</h4>
                          <Badge className="ml-2 bg-blue-500/20 text-blue-400 text-xs">
                            {item.item_type}
                          </Badge>
                          <span className="ml-2 text-white/50 text-xs">Order: {item.order_index}</span>
                        </div>
                        {item.content && (
                          <p className="text-white/70 text-sm mb-2">
                            {item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content}
                          </p>
                        )}
                        {item.link_url && (
                          <div className="flex items-center text-blue-400 text-sm">
                            <Link className="w-3 h-3 mr-1" />
                            <span className="mr-2">{item.link_text || 'Link'}</span>
                            <span className="text-white/50 text-xs">{item.link_url}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={item.is_active ? "secondary" : "destructive"}
                          className={item.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                          onClick={() => toggleStatus(item.id, item.is_active)}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="text-white/70 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="text-center py-12">
            <Layout className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No footer items found</p>
            <Button
              onClick={() => setEditingId('new')}
              className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Footer Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function FooterContentPageWrapper() {
  return (
    <ProtectedRoute>
      <FooterContentPage />
    </ProtectedRoute>
  )
}