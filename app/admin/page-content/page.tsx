'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'

interface PageSection {
  id: string
  page_name: string
  section_type: string
  heading: string
  content: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const PAGE_OPTIONS = [
  { value: 'reports', label: 'Reports' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'news', label: 'News' },
  { value: 'casinos', label: 'Casinos' },
  { value: 'bonuses', label: 'Bonuses' },
  { value: 'fair-gambling-codex', label: 'Fair Gambling Codex' }
]

const SECTION_TYPE_OPTIONS = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'header', label: 'Page Header' },
  { value: 'banner', label: 'Banner' },
  { value: 'intro', label: 'Introduction' }
]

export default function PageContentAdmin() {
  const [sections, setSections] = useState<PageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<PageSection | null>(null)
  const [formData, setFormData] = useState({
    page_name: '',
    section_type: 'hero',
    heading: '',
    content: '',
    display_order: 0,
    is_active: true
  })
  const { toast } = useToast()

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/page-sections')
      if (!response.ok) {
        throw new Error('Failed to fetch sections')
      }
      const result = await response.json()
      setSections(result.data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch page sections',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchSections()
  }, [fetchSections])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingSection 
        ? '/api/admin/page-sections'
        : '/api/admin/page-sections'
      
      const method = editingSection ? 'PUT' : 'POST'
      const body = editingSection 
        ? { ...formData, id: editingSection.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('Failed to save section')
      }

      toast({
        title: 'Success',
        description: `Page section ${editingSection ? 'updated' : 'created'} successfully`
      })

      setIsDialogOpen(false)
      setEditingSection(null)
      setFormData({
        page_name: '',
        section_type: 'hero',
        heading: '',
        content: '',
        display_order: 0,
        is_active: true
      })
      fetchSections()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save page section',
        variant: 'error'
      })
    }
  }

  const handleEdit = (section: PageSection) => {
    setEditingSection(section)
    setFormData({
      page_name: section.page_name,
      section_type: section.section_type,
      heading: section.heading,
      content: section.content,
      display_order: section.display_order,
      is_active: section.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/page-sections?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete section')
      }

      toast({
        title: 'Success',
        description: 'Page section deleted successfully'
      })

      fetchSections()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete page section',
        variant: 'error'
      })
    }
  }

  const toggleActive = async (section: PageSection) => {
    try {
      const response = await fetch('/api/admin/page-sections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: section.id,
          is_active: !section.is_active
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update section')
      }

      toast({
        title: 'Success',
        description: `Section ${!section.is_active ? 'activated' : 'deactivated'} successfully`
      })

      fetchSections()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update section status',
        variant: 'error'
      })
    }
  }

  const openCreateDialog = () => {
    setEditingSection(null)
    setFormData({
      page_name: '',
      section_type: 'hero',
      heading: '',
      content: '',
      display_order: 0,
      is_active: true
    })
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Content Management</h1>
          <p className="text-gray-600 mt-1">
            Manage dynamic content for page headers and hero sections
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSection ? 'Edit Page Section' : 'Create Page Section'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Page Name</label>
                  <Select
                    value={formData.page_name}
                    onValueChange={(value) => setFormData({ ...formData, page_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select page" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Section Type</label>
                  <Select
                    value={formData.section_type}
                    onValueChange={(value) => setFormData({ ...formData, section_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Heading</label>
                <Input
                  value={formData.heading}
                  onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                  placeholder="Enter section heading"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter section content"
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSection ? 'Update' : 'Create'} Section
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{section.heading}</CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary">{section.page_name}</Badge>
                    <Badge variant="outline">{section.section_type}</Badge>
                    <Badge variant={section.is_active ? 'default' : 'secondary'}>
                      {section.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(section)}
                  >
                    {section.is_active ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(section)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(section.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">{section.content}</p>
              <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                <span>Order: {section.display_order}</span>
                <span>Updated: {new Date(section.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No page sections found</p>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first section
          </Button>
        </div>
      )}
    </div>
  )
}