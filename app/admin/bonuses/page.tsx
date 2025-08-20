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
  Gift,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Star,
  Calendar,
  Percent,
  DollarSign
} from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'

interface Bonus {
  id: string
  title: string
  description: string
  bonus_type: string
  bonus_amount: number
  bonus_percentage: number
  wagering_requirement: number
  min_deposit: number
  max_bonus: number
  casino_name: string
  casino_id: string
  promo_code: string
  terms_conditions: string
  valid_from: string
  valid_until: string
  image_url: string
  is_exclusive: boolean
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

function BonusesContentPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bonus_type: '',
    bonus_amount: 0,
    bonus_percentage: 0,
    wagering_requirement: 0,
    min_deposit: 0,
    max_bonus: 0,
    casino_name: '',
    casino_id: '',
    promo_code: '',
    terms_conditions: '',
    valid_from: '',
    valid_until: '',
    image_url: '',
    is_exclusive: false,
    is_featured: false,
    is_active: true
  })

  const bonusTypes = [
    'Welcome Bonus',
    'No Deposit Bonus',
    'Free Spins',
    'Reload Bonus',
    'Cashback',
    'VIP Bonus',
    'Tournament Prize',
    'Loyalty Reward'
  ]

  useEffect(() => {
    loadBonuses()
  }, [])

  const loadBonuses = async () => {
    try {
      setLoading(true)
      const supabaseClient = supabase()
      const { data, error } = await supabaseClient
        .from('bonuses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBonuses(data || [])
    } catch (error) {
      console.error('Error loading bonuses:', error)
      toast.error('Failed to load bonuses')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.title.trim() || !formData.description.trim()) {
        toast.error('Title and description are required')
        return
      }

      if (editingId && editingId !== 'new') {
        // Update existing bonus
        const supabaseClient = supabase()
        const { error } = await supabaseClient
          .from('bonuses')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Bonus updated successfully')
      } else {
        // Create new bonus
        const supabaseClient = supabase()
        const { error } = await supabaseClient
          .from('bonuses')
          .insert([formData])

        if (error) throw error
        toast.success('Bonus created successfully')
      }

      resetForm()
      loadBonuses()
    } catch (error) {
      console.error('Error saving bonus:', error)
      toast.error('Failed to save bonus')
    }
  }

  const handleEdit = (bonus: Bonus) => {
    setEditingId(bonus.id)
    setFormData({
      title: bonus.title,
      description: bonus.description,
      bonus_type: bonus.bonus_type,
      bonus_amount: bonus.bonus_amount,
      bonus_percentage: bonus.bonus_percentage,
      wagering_requirement: bonus.wagering_requirement,
      min_deposit: bonus.min_deposit,
      max_bonus: bonus.max_bonus,
      casino_name: bonus.casino_name,
      casino_id: bonus.casino_id,
      promo_code: bonus.promo_code,
      terms_conditions: bonus.terms_conditions,
      valid_from: bonus.valid_from ? bonus.valid_from.split('T')[0] : '',
      valid_until: bonus.valid_until ? bonus.valid_until.split('T')[0] : '',
      image_url: bonus.image_url || '',
      is_exclusive: bonus.is_exclusive,
      is_featured: bonus.is_featured,
      is_active: bonus.is_active
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bonus?')) return

    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('bonuses')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Bonus deleted successfully')
      loadBonuses()
    } catch (error) {
      console.error('Error deleting bonus:', error)
      toast.error('Failed to delete bonus')
    }
  }

  const toggleStatus = async (id: string, field: 'is_active' | 'is_featured' | 'is_exclusive', currentStatus: boolean) => {
    try {
      const supabaseClient = supabase()
      const { error } = await supabaseClient
        .from('bonuses')
        .update({ [field]: !currentStatus })
        .eq('id', id)

      if (error) throw error
      toast.success(`${field.replace('is_', '').charAt(0).toUpperCase() + field.replace('is_', '').slice(1)} status updated successfully`)
      loadBonuses()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      bonus_type: '',
      bonus_amount: 0,
      bonus_percentage: 0,
      wagering_requirement: 0,
      min_deposit: 0,
      max_bonus: 0,
      casino_name: '',
      casino_id: '',
      promo_code: '',
      terms_conditions: '',
      valid_from: '',
      valid_until: '',
      image_url: '',
      is_exclusive: false,
      is_featured: false,
      is_active: true
    })
  }

  const filteredBonuses = bonuses.filter(bonus => {
    const matchesSearch = bonus.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bonus.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bonus.casino_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || bonus.bonus_type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && bonus.is_active) ||
                         (statusFilter === 'inactive' && !bonus.is_active) ||
                         (statusFilter === 'featured' && bonus.is_featured) ||
                         (statusFilter === 'exclusive' && bonus.is_exclusive)
    return matchesSearch && matchesType && matchesStatus
  })

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading bonuses...</p>
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
            <Gift className="w-8 h-8 mr-3" />
            Bonuses Management
          </h1>
          <p className="text-white/70">Manage casino bonuses and promotions</p>
        </div>
        <Button
          onClick={() => setEditingId('new')}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bonus
        </Button>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-4 md:mb-6">
        <CardContent className="p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Search bonuses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {bonusTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="exclusive">Exclusive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {editingId && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-4 md:mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              {editingId === 'new' ? 'Add New Bonus' : 'Edit Bonus'}
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
          <CardContent className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Bonus title"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Bonus Type</label>
                <Select value={formData.bonus_type} onValueChange={(value) => setFormData({ ...formData, bonus_type: value })}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select bonus type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bonusTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Casino Name</label>
                <Input
                  value={formData.casino_name}
                  onChange={(e) => setFormData({ ...formData, casino_name: e.target.value })}
                  placeholder="Casino name"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Promo Code</label>
                <Input
                  value={formData.promo_code}
                  onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })}
                  placeholder="BONUS100"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Bonus Amount ($)</label>
                <Input
                  type="number"
                  value={formData.bonus_amount}
                  onChange={(e) => setFormData({ ...formData, bonus_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="100"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Bonus Percentage (%)</label>
                <Input
                  type="number"
                  value={formData.bonus_percentage}
                  onChange={(e) => setFormData({ ...formData, bonus_percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="100"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Min Deposit ($)</label>
                <Input
                  type="number"
                  value={formData.min_deposit}
                  onChange={(e) => setFormData({ ...formData, min_deposit: parseFloat(e.target.value) || 0 })}
                  placeholder="20"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Max Bonus ($)</label>
                <Input
                  type="number"
                  value={formData.max_bonus}
                  onChange={(e) => setFormData({ ...formData, max_bonus: parseFloat(e.target.value) || 0 })}
                  placeholder="500"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Wagering Requirement (x)</label>
                <Input
                  type="number"
                  value={formData.wagering_requirement}
                  onChange={(e) => setFormData({ ...formData, wagering_requirement: parseFloat(e.target.value) || 0 })}
                  placeholder="35"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Valid From</label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Valid Until</label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bonus description"
                rows={3}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Bonus Image</label>
              <ImageUpload
                bucket="bonus-images"
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Terms & Conditions</label>
              <Textarea
                value={formData.terms_conditions}
                onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                placeholder="Terms and conditions"
                rows={4}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                <label className="flex items-center space-x-2 text-white/90">
                  <input
                    type="checkbox"
                    checked={formData.is_exclusive}
                    onChange={(e) => setFormData({ ...formData, is_exclusive: e.target.checked })}
                    className="rounded"
                  />
                  <span>Exclusive</span>
                </label>
              </div>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save Bonus
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bonuses List */}
      <div className="grid gap-3 md:gap-4">
        {filteredBonuses.map((bonus) => (
          <Card key={bonus.id} className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="text-white flex items-center mb-2">
                    {bonus.title}
                    {bonus.is_featured && (
                      <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">Featured</Badge>
                    )}
                    {bonus.is_exclusive && (
                      <Badge className="ml-2 bg-purple-500/20 text-purple-400">Exclusive</Badge>
                    )}
                    {isExpired(bonus.valid_until) && (
                      <Badge className="ml-2 bg-red-500/20 text-red-400">Expired</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-white/60 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <span>{bonus.casino_name}</span>
                    <span className="flex items-center">
                      <Gift className="w-4 h-4 mr-1" />
                      {bonus.bonus_type}
                    </span>
                    {bonus.promo_code && (
                      <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono">
                        {bonus.promo_code}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <Badge
                    variant={bonus.is_active ? "secondary" : "destructive"}
                    className={bonus.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                    onClick={() => toggleStatus(bonus.id, 'is_active', bonus.is_active)}
                    style={{ cursor: 'pointer' }}
                  >
                    {bonus.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatus(bonus.id, 'is_featured', bonus.is_featured)}
                    className={`${bonus.is_featured ? 'text-yellow-400' : 'text-white/50'} hover:text-yellow-300`}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(bonus)}
                    className="text-white/70 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bonus.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-4">
                {bonus.bonus_amount > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center text-green-400 mb-1">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">Bonus Amount</span>
                    </div>
                    <div className="text-white font-bold">{formatCurrency(bonus.bonus_amount)}</div>
                  </div>
                )}
                {bonus.bonus_percentage > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center text-blue-400 mb-1">
                      <Percent className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">Percentage</span>
                    </div>
                    <div className="text-white font-bold">{bonus.bonus_percentage}%</div>
                  </div>
                )}
                {bonus.wagering_requirement > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center text-orange-400 mb-1">
                      <span className="text-xs font-medium">Wagering</span>
                    </div>
                    <div className="text-white font-bold">{bonus.wagering_requirement}x</div>
                  </div>
                )}
                {bonus.min_deposit > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center text-purple-400 mb-1">
                      <span className="text-xs font-medium">Min Deposit</span>
                    </div>
                    <div className="text-white font-bold">{formatCurrency(bonus.min_deposit)}</div>
                  </div>
                )}
              </div>
              <div className="text-white/80 text-sm mb-3 md:mb-4 line-clamp-2 md:line-clamp-none">
                {bonus.description.length > 200 ? `${bonus.description.substring(0, 200)}...` : bonus.description}
              </div>
              {bonus.terms_conditions && (
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <h4 className="text-white/90 font-medium mb-1">Terms & Conditions</h4>
                  <p className="text-white/70 text-sm">
                    {bonus.terms_conditions.length > 150 ? `${bonus.terms_conditions.substring(0, 150)}...` : bonus.terms_conditions}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-white/50">
                <div className="flex items-center space-x-4">
                  {bonus.valid_from && (
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Valid from: {new Date(bonus.valid_from).toLocaleDateString()}
                    </span>
                  )}
                  {bonus.valid_until && (
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Until: {new Date(bonus.valid_until).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span>Updated: {new Date(bonus.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBonuses.length === 0 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="text-center py-12">
            <Gift className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No bonuses found</p>
            <Button
              onClick={() => setEditingId('new')}
              className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Bonus
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function BonusesContentPageWrapper() {
  return (
    <ProtectedRoute>
      <BonusesContentPage />
    </ProtectedRoute>
  )
}