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
import { toast } from 'sonner'
import { useOptimizedQuery, useOptimizedMutation } from '@/hooks/use-optimized-query'
import { TableSkeleton } from '@/components/admin/loading-skeleton'
import { ImageUpload } from '@/components/admin/image-upload'
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
  established_year: number
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

function CasinosContentPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    logo_url: '',
    rating: 5,
    bonus_info: '',
    features: [] as string[],
    payment_methods: [] as string[],
    license: '',
    established_year: new Date().getFullYear(),
    is_featured: false,
    is_active: true
  })
  const [featuresInput, setFeaturesInput] = useState('')
  const [paymentMethodsInput, setPaymentMethodsInput] = useState('')

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
      toast.success('Operation completed successfully')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
    invalidateQueries: [`casinos-${searchTerm}-${statusFilter}`]
  })

  // Data is automatically loaded by useOptimizedQuery hook

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.description.trim()) {
        toast.error('Name and description are required')
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
        toast.success('Casino updated successfully')
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
        toast.success('Casino created successfully')
      }

      resetForm()
      refetch()
    } catch (error) {
      console.error('Error saving casino:', error)
      toast.error('Failed to save casino')
    }
  }

  const handleEdit = (casino: Casino) => {
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
      established_year: casino.established_year,
      is_featured: casino.is_featured,
      is_active: casino.is_active
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
      toast.success('Casino deleted successfully')
      refetch()
    } catch (error) {
      console.error('Error deleting casino:', error)
      toast.error('Failed to delete casino')
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
      toast.success(`${field === 'is_active' ? 'Status' : 'Featured'} updated successfully`)
      refetch()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      website_url: '',
      logo_url: '',
      rating: 5,
      bonus_info: '',
      features: [],
      payment_methods: [],
      license: '',
      established_year: new Date().getFullYear(),
      is_featured: false,
      is_active: true
    })
    setFeaturesInput('')
    setPaymentMethodsInput('')
  }

  const filteredCasinos = (casinos || []).filter(casino => {
    const matchesSearch = casino.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (casino.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && casino.is_active) ||
                         (statusFilter === 'inactive' && !casino.is_active) ||
                         (statusFilter === 'featured' && casino.is_featured)
    return matchesSearch && matchesStatus
  })

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
                    {[1, 2, 3, 4, 5].map(rating => (
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
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Logo Casino</label>
              <ImageUpload
                value={formData.logo_url}
                onChange={(url) => setFormData({ ...formData, logo_url: url })}
                bucket="casino-images"
                label="Upload logo casino"
              />
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
                      className="w-9 h-9 md:w-12 md:h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <CardTitle className="text-white flex items-center">
                      {casino.name}
                      {casino.is_featured && (
                        <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">Featured</Badge>
                      )}
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