'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/sonner'
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Eye,
  Calendar,
  User,
  Tag
} from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'

interface NewsArticle {
  id: string
  title: string
  content: string
  excerpt: string
  featured_image: string
  author: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

function NewsContentPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    author: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    is_featured: false,
    published_at: null as string | null
  })
  const [tagsInput, setTagsInput] = useState('')

  const categories = [
    'Casino News',
    'Industry Updates',
    'Game Reviews',
    'Promotions',
    'Regulations',
    'Technology',
    'Events',
    'General'
  ]

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const supabaseClient = supabase()
      const { data, error } = await supabaseClient
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error('Error loading articles:', error)
      toast.error('Load Failed', 'Unable to load news articles. Please check your connection and try again.')
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

      const dataToSave = {
        ...formData,
        tags: tagsInput.split(',').map(t => t.trim()).filter(t => t),
        published_at: formData.status === 'published' && !formData.published_at 
          ? new Date().toISOString() 
          : formData.published_at
      }

      if (editingId && editingId !== 'new') {
        // Update existing article
        const supabaseClient = supabase()
        const { error } = await supabaseClient
          .from('news_articles')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Article Updated', 'Changes have been saved successfully')
      } else {
        // Create new article
        const supabaseClient = supabase()
        const { error } = await supabaseClient
          .from('news_articles')
          .insert([dataToSave])

        if (error) throw error
        toast.success('Article Created', 'New article has been added to the system')
      }

      resetForm()
      loadArticles()
    } catch (error) {
      console.error('Error saving article:', error)
      toast.error('Save Failed', 'Unable to save article data. Please check your connection and try again.')
    }
  }

  const handleEdit = (article: NewsArticle) => {
    setEditingId(article.id)
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      featured_image: article.featured_image,
      author: article.author,
      category: article.category,
      tags: article.tags,
      status: article.status,
      is_featured: article.is_featured,
      published_at: article.published_at
    })
    setTagsInput(article.tags.join(', '))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('news_articles')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Article Deleted', 'Article has been successfully removed from the system')
      loadArticles()
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Delete Failed', 'Unable to delete article. Please try again or contact support.')
    }
  }

  const toggleStatus = async (id: string, field: 'is_featured', currentStatus: boolean) => {
    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('news_articles')
        .update({ [field]: !currentStatus })
        .eq('id', id)

      if (error) throw error
      toast.success('Featured Status Updated', 'Article featured status has been successfully updated')
      loadArticles()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Status Update Failed', 'Unable to update article status. Please try again.')
    }
  }

  const changeStatus = async (id: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString()
      }

      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('news_articles')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      toast.success('Status Changed', `Article has been ${newStatus} successfully`)
      loadArticles()
    } catch (error) {
      console.error('Error changing status:', error)
      toast.error('Status Change Failed', 'Unable to change article status. Please try again.')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      featured_image: '',
      author: '',
      category: '',
      tags: [],
      status: 'draft',
      is_featured: false,
      published_at: null
    })
    setTagsInput('')
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400'
      case 'draft': return 'bg-yellow-500/20 text-yellow-400'
      case 'archived': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading articles...</p>
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
            <Newspaper className="w-8 h-8 mr-3" />
            News Management
          </h1>
          <p className="text-white/70">Manage news articles and content</p>
        </div>
        <Button
          onClick={() => setEditingId('new')}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Article
        </Button>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
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
              {editingId === 'new' ? 'Add New Article' : 'Edit Article'}
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
                  placeholder="Article title"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Author</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Status</label>
                <Select value={formData.status} onValueChange={(value: 'draft' | 'published' | 'archived') => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Featured Image</label>
              <ImageUpload
                bucket="news-images"
                value={formData.featured_image}
                onChange={(url) => setFormData({ ...formData, featured_image: url })}
                label="Upload featured image"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Excerpt</label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of the article"
                rows={3}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Article content"
                rows={8}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Tags (comma separated)</label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="casino, gambling, news, review"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-white/90">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded"
                />
                <span>Featured Article</span>
              </label>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save Article
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      <div className="grid gap-4">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white flex items-center mb-2">
                    {article.title}
                    {article.is_featured && (
                      <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">Featured</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-white/60 flex items-center space-x-4">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {article.author}
                    </span>
                    <span className="flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      {article.category}
                    </span>
                    {article.published_at && (
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(article.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(article.status)}>
                    {article.status}
                  </Badge>
                  <Select value={article.status} onValueChange={(value: 'draft' | 'published' | 'archived') => changeStatus(article.id, value)}>
                    <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatus(article.id, 'is_featured', article.is_featured)}
                    className={`${article.is_featured ? 'text-yellow-400' : 'text-white/50'} hover:text-yellow-300`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(article)}
                    className="text-white/70 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {article.featured_image && (
                <Image
                  src={article.featured_image}
                  alt={article.title}
                  width={400}
                  height={192}
                  className="w-full h-48 object-contain bg-black/20 rounded-lg mb-4"
                />
              )}
              <div className="text-white/80 text-sm mb-4">
                {article.excerpt || (article.content.length > 200 ? `${article.content.substring(0, 200)}...` : article.content)}
              </div>
              {article.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, index) => (
                      <Badge key={index} className="bg-blue-500/20 text-blue-400">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center text-xs text-white/50">
                <span>Created: {new Date(article.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(article.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="text-center py-12">
            <Newspaper className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No articles found</p>
            <Button
              onClick={() => setEditingId('new')}
              className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Article
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function NewsContentPageWrapper() {
  return (
    <ProtectedRoute>
      <NewsContentPage />
    </ProtectedRoute>
  )
}