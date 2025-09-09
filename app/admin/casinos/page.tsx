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
import { useOptimizedQuery, useOptimizedMutation } from '@/hooks/use-optimized-query'
import { TableSkeleton } from '@/components/admin/loading-skeleton'
import ImageUpload from '@/components/admin/ImageUpload'
import { CasinoCrudManager } from '@/components/admin/casino-crud-manager'
import { useToast } from '@/hooks/use-toast'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Eye,
  ExternalLink,
  Star
} from 'lucide-react'

interface Casino {
  id: string
  name: string
  description: string | null
  website_url: string
  logo_url: string
  rating: number | null
  bonus_info: string | null
  features: any
  payment_methods: any
  license?: string | null
  license_info?: string | null
  website_languages?: number | null
  live_chat_languages?: number | null
  customer_support_languages?: number | null
  established_year: number
  is_featured: boolean
  is_active: boolean
  placeholder_bg_color?: string
  display_order?: number | null
  created_at: string
  updated_at: string
}

function CasinosContentPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const { success, error: toastError, warning } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    logo_url: '',
    rating: 6,
    bonus_info: '',
    features: [] as string[],
    payment_methods: [] as string[],
    license: '',
    website_languages: undefined as number | undefined,
    live_chat_languages: undefined as number | undefined,
    customer_support_languages: undefined as number | undefined,
    established_year: new Date().getFullYear(),
    is_featured: false,
    is_active: true,
    placeholder_bg_color: '#1f2937',
    display_order: 999
  })
  const [featuresInput, setFeaturesInput] = useState('')
  const [paymentMethodsInput, setPaymentMethodsInput] = useState('')

  // Debug useEffect untuk memantau perubahan placeholder_bg_color
  useEffect(() => {
    console.log('formData.placeholder_bg_color changed to:', formData.placeholder_bg_color)
  }, [formData.placeholder_bg_color])

  const toStringArray = (value: any): string[] => {
    if (!value) return []
    if (Array.isArray(value)) return value.map(v => String(v)).filter(Boolean)
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean)
    return []
  }

  // Use optimized query hook
  const { 
    data: casinos = [], 
    loading, 
    error, 
    refetch 
  } = useOptimizedQuery<Casino>({
    table: 'casinos',
    select: '*',
    filters: {
      ...(searchTerm && { name: `%${searchTerm}%` }),
      ...(statusFilter !== 'all' && { 
        ...(statusFilter === 'active' && { is_active: true }),
        ...(statusFilter === 'inactive' && { is_active: false }),
        ...(statusFilter === 'featured' && { is_featured: true })
      })
    },
    orderBy: { column: 'created_at', ascending: false },
    enableRealtime: true,
    cacheKey: `casinos-${searchTerm}-${statusFilter}`,
    debounceMs: 500
  })

  // Use optimized mutation hook
  const { mutate, loading: mutationLoading } = useOptimizedMutation<Casino>({
    table: 'casinos',
    onSuccess: () => {
      success('Operation completed successfully', 'Casino data has been updated')
      refetch()
    },
    onError: (error) => {
      toastError('Save Failed', error.message)
    },
    invalidateQueries: [`casinos-${searchTerm}-${statusFilter}`]
  })

  // Data is automatically loaded by useOptimizedQuery hook

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.description.trim()) {
        toastError('Validation Error', 'Please fill in the required fields')
        return
      }

      const dataToSave = {
        ...formData,
        features: featuresInput.split(',').map(f => f.trim()).filter(f => f),
        payment_methods: paymentMethodsInput.split(',').map(p => p.trim()).filter(p => p)
      }
      // Map UI field 'license' to DB column 'license_info'
      const { license: uiLicense, ...restForDb } = dataToSave as any
      const payload: any = { ...restForDb, license_info: uiLicense }
      // Avoid overwriting existing values with empty placeholders on update
      if (!featuresInput.trim()) delete payload.features
      if (!paymentMethodsInput.trim()) delete payload.payment_methods
      if (!uiLicense?.trim?.()) delete payload.license_info
      if (!formData.bonus_info?.trim?.()) delete payload.bonus_info
      if (payload.established_year === null || Number.isNaN(payload.established_year)) delete payload.established_year
      // Clean empty numeric optional fields
      if (payload.website_languages === undefined || payload.website_languages === null || payload.website_languages === '') delete payload.website_languages
      if (payload.live_chat_languages === undefined || payload.live_chat_languages === null || payload.live_chat_languages === '') delete payload.live_chat_languages
      if (payload.customer_support_languages === undefined || payload.customer_support_languages === null || payload.customer_support_languages === '') delete payload.customer_support_languages

      if (editingId && editingId !== 'new') {
        // Update existing casino
        const supabaseClient = supabase()
        const { error } = await supabaseClient
          .from('casinos')
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (error) throw error
        success('Casino Updated', 'Changes have been saved successfully')
      } else {
        // Create new casino
        const supabaseClient = supabase()
        // Auto-generate slug from name; ensure uniqueness best-effort
        const slugBase = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 80)
        let slug = slugBase || `casino-${Date.now().toString(36)}`
        const { data: existing } = await supabaseClient
          .from('casinos')
          .select('id')
          .eq('slug', slug)
          .limit(1)
        if (existing && existing.length > 0) {
          slug = `${slug}-${Date.now().toString(36).slice(-4)}`
        }
        const { error } = await supabaseClient
          .from('casinos')
          .insert([{ slug, ...payload }])

        if (error) throw error
        success('Casino Created', 'New casino has been added to the system')
      }

      resetForm()
      refetch()
    } catch (error) {
      console.error('Error saving casino:', error)
      toastError('Save Failed', 'Unable to save casino data. Please check your connection and try again.')
    }
  }

  const handleEdit = (casino: Casino) => {
    // Auto scroll to top when edit is triggered
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })

    setEditingId(casino.id)
    setFormData({
      name: casino.name,
      description: casino.description || '',
      website_url: casino.website_url,
      logo_url: casino.logo_url,
      rating: (casino.rating ?? 5) as number,
      bonus_info: casino.bonus_info || '',
      features: toStringArray(casino.features),
      payment_methods: toStringArray(casino.payment_methods),
      license: casino.license_info ?? casino.license ?? '',
      website_languages: (casino.website_languages as any) ?? undefined,
      live_chat_languages: (casino.live_chat_languages as any) ?? undefined,
      customer_support_languages: (casino.customer_support_languages as any) ?? undefined,
      established_year: casino.established_year,
      is_featured: casino.is_featured,
      is_active: casino.is_active,
      placeholder_bg_color: casino.placeholder_bg_color || '#1f2937',
      display_order: casino.display_order ?? 999
    })
    setFeaturesInput(toStringArray(casino.features).join(', '))
    setPaymentMethodsInput(toStringArray(casino.payment_methods).join(', '))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this casino?')) return

    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('casinos')
        .delete()
        .eq('id', id)

      if (error) throw error
      success('Casino Deleted', 'Casino has been successfully removed from the system')
      refetch()
    } catch (error) {
      console.error('Error deleting casino:', error)
      toastError('Delete Failed', 'Unable to delete casino. Please try again or contact support.')
    }
  }

  const toggleStatus = async (id: string, field: 'is_active' | 'is_featured', currentStatus: boolean) => {
    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('casinos')
        .update({ [field]: !currentStatus })
        .eq('id', id)

      if (error) throw error
      success('Status Updated', `Casino ${field === 'is_active' ? 'status' : 'featured flag'} has been successfully updated`)
      refetch()
    } catch (error) {
      console.error('Error updating status:', error)
      toastError('Status Update Failed', 'Unable to update casino status. Please try again.')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      website_url: '',
      logo_url: '',
      rating: 6,
      bonus_info: '',
      features: [],
      payment_methods: [],
      license: '',
      website_languages: undefined,
      live_chat_languages: undefined,
      customer_support_languages: undefined,
      established_year: new Date().getFullYear(),
      is_featured: false,
      is_active: true,
      placeholder_bg_color: '#1f2937',
      display_order: 999
    })
    setFeaturesInput('')
    setPaymentMethodsInput('')
  }

  const filteredCasinos = (casinos || [])
    .filter(casino => {
      const matchesSearch = casino.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (casino.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'active' && casino.is_active) ||
                           (statusFilter === 'inactive' && !casino.is_active) ||
                           (statusFilter === 'featured' && casino.is_featured)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Primary sorting: display_order (lower number = higher position)
      const orderA = a.display_order || 999
      const orderB = b.display_order || 999

      if (orderA !== orderB) {
        return orderA - orderB
      }

      // Secondary sorting: created_at (newest first for same order)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Debug: Log sorting results for verification
  console.log('[DEBUG] Admin Casinos - Filtered & Sorted:', filteredCasinos.map(c => ({
    name: c.name,
    display_order: c.display_order || 999,
    created_at: c.created_at
  })))

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}
      />
    ))
  }

  if (loading) {
    return <TableSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading casinos: {error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center">
            <Building2 className="w-8 h-8 mr-3" />
            Casinos Management
          </h1>
          <p className="text-white/70">Manage casino listings and information</p>
        </div>
        <Button
          onClick={() => setEditingId('new')}
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Casino
        </Button>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-4 md:mb-6">
        <CardContent className="p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Search by name or description..."
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
                <SelectItem value="all">All Casinos</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {editingId && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-white flex items-center justify-between">
              {editingId === 'new' ? 'Add New Casino' : 'Edit Casino'}
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
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Casino Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Casino name"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Website URL</label>
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://casino-website.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Rating</label>
                <Select value={formData.rating.toString()} onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} Star{rating > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Established Year</label>
                <Input
                  type="number"
                  value={formData.established_year}
                  onChange={(e) => setFormData({ ...formData, established_year: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="2020"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">License</label>
                <Input
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  placeholder="Malta Gaming Authority"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Display Order</label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 999 })}
                  placeholder="999"
                  min="1"
                  max="999"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
                <p className="text-xs text-white/60 mt-1">Lower number = higher position</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Website Languages</label>
                <Input
                  type="number"
                  value={formData.website_languages ?? ''}
                  onChange={(e) => setFormData({ ...formData, website_languages: e.target.value === '' ? undefined : (parseInt(e.target.value) || 0) })}
                  placeholder="e.g., 51"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Live Chat Languages</label>
                <Input
                  type="number"
                  value={formData.live_chat_languages ?? ''}
                  onChange={(e) => setFormData({ ...formData, live_chat_languages: e.target.value === '' ? undefined : (parseInt(e.target.value) || 0) })}
                  placeholder="e.g., 6"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Customer Support Languages</label>
                <Input
                  type="number"
                  value={formData.customer_support_languages ?? ''}
                  onChange={(e) => setFormData({ ...formData, customer_support_languages: e.target.value === '' ? undefined : (parseInt(e.target.value) || 0) })}
                  placeholder="e.g., 6"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Logo Casino</label>
              <div className="space-y-4">
                <ImageUpload
                  value={formData.logo_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                  bucket="casino-images"
                  label="Upload logo casino"
                  placeholderBgColor={formData.placeholder_bg_color}
                />
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Background Color Placeholder
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.placeholder_bg_color}
                      onChange={(e) => {
                        console.log('Color picker changed to:', e.target.value)
                        setFormData(prev => ({ ...prev, placeholder_bg_color: e.target.value }))
                      }}
                      className="w-12 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.placeholder_bg_color}
                      onChange={(e) => {
                        console.log('Text input changed to:', e.target.value)
                        setFormData(prev => ({ ...prev, placeholder_bg_color: e.target.value }))
                      }}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#1f2937"
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Pilih warna background untuk placeholder logo casino
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Casino description"
                rows={4}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Bonus Information</label>
              <Textarea
                value={formData.bonus_info}
                onChange={(e) => setFormData({ ...formData, bonus_info: e.target.value })}
                placeholder="Welcome bonus and promotions"
                rows={3}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Features (comma separated)</label>
              <Input
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                placeholder="Live Casino, Sports Betting, Mobile App"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Payment Methods (comma separated)</label>
              <Input
                value={paymentMethodsInput}
                onChange={(e) => setPaymentMethodsInput(e.target.value)}
                placeholder="Visa, Mastercard, Bitcoin, PayPal"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-white/90">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center space-x-2 text-white/90">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <span>Featured</span>
                </label>
              </div>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save Casino
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Casinos List */}
      <div className="grid gap-3 md:gap-4">
        {filteredCasinos.map((casino) => (
          <Card key={casino.id} className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {casino.logo_url && (
                    <Image
                      src={casino.logo_url}
                      alt={casino.name}
                      width={48}
                      height={48}
                      className="w-9 h-9 md:w-12 md:h-12 rounded-lg object-contain bg-black/20"
                    />
                  )}
                  <div>
                    <CardTitle className="text-white flex items-center">
                      {casino.name}
                      {casino.is_featured && (
                        <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">Featured</Badge>
                      )}
                      <Badge className="ml-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5">
                        #{casino.display_order || 999}
                      </Badge>
                      {casino.website_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(casino.website_url, '_blank')}
                          className="ml-2 text-white/70 hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription className="text-white/60 flex items-center mt-1 text-sm md:text-base">
                      <div className="flex items-center mr-4">
                        {renderStars(Math.round((casino.rating ?? 0)))}
                      </div>
                      <span className="mr-4 hidden sm:inline">Est. {casino.established_year}</span>
                      {(casino.license_info || casino.license) && <span>{casino.license_info || casino.license}</span>}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Badge
                    variant={casino.is_active ? "secondary" : "destructive"}
                    className={casino.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                    onClick={() => toggleStatus(casino.id, 'is_active', casino.is_active)}
                    style={{ cursor: 'pointer' }}
                  >
                    {casino.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleStatus(casino.id, 'is_featured', casino.is_featured)}
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(casino)}
                    className="text-white/70 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(casino.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="text-white/80 text-sm mb-3 md:mb-4 line-clamp-2 md:line-clamp-none">
                {(casino.description || '').length > 200 ? `${(casino.description || '').substring(0, 200)}...` : (casino.description || '')}
              </div>
              {casino.bonus_info && (
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <h4 className="text-white/90 font-medium mb-1">Bonus Information</h4>
                  <p className="text-white/70 text-sm">{casino.bonus_info}</p>
                </div>
              )}
              {toStringArray(casino.features).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white/90 font-medium mb-2">Features</h4>
                  <div className="hidden md:flex flex-wrap gap-2">
                    {toStringArray(casino.features).map((feature, index) => (
                      <Badge key={index} className="bg-blue-500/20 text-blue-400">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {toStringArray(casino.payment_methods).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white/90 font-medium mb-2">Payment Methods</h4>
                  <div className="hidden md:flex flex-wrap gap-2">
                    {toStringArray(casino.payment_methods).map((method, index) => (
                      <Badge key={index} className="bg-green-500/20 text-green-400">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center text-xs text-white/50">
                <span>Created: {new Date(casino.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(casino.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCasinos.length === 0 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No casinos found</p>
            <Button
              onClick={() => setEditingId('new')}
              className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Casino
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Toast handled globally via <Toaster /> */}
    </div>
  )
}

export default function CasinosContentPageWrapper() {
  return (
    <ProtectedRoute>
      <CasinosContentPage />
    </ProtectedRoute>
  )
}