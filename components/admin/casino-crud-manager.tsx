// Casino CRUD Manager Component for Admin Panel
// Integrated with realtime updates and optimistic UI

'use client'

import React, { useState, useCallback } from 'react'
import { useRealtimeCasinoContext } from '@/components/providers/realtime-casino-provider'
import { Casino } from '@/lib/types'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ImageUpload from '@/components/admin/ImageUpload'
import Image from 'next/image'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react'

interface CasinoCrudManagerProps {
  casinos: Casino[]
  onCasinosChange: (casinos: Casino[]) => void
  enableRealtimeUpdates?: boolean
}

interface EditingCasino extends Partial<Casino> {
  isNew?: boolean
}

export function CasinoCrudManager({
  casinos,
  onCasinosChange,
  enableRealtimeUpdates = true
}: CasinoCrudManagerProps) {
  const {
    createCasino,
    updateCasino,
    deleteCasino,
    isConnected,
    error: realtimeError
  } = useRealtimeCasinoContext()

  const [editingCasino, setEditingCasino] = useState<EditingCasino | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set())

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    logo_url: '',
    rating: 6,
    bonus_info: '',
    license: '',
    established_year: new Date().getFullYear(),
    is_featured: false,
    is_active: true,
    display_order: 999
  })

  // Start editing a casino
  const startEditing = useCallback((casino: Casino | null) => {
    if (casino) {
      setFormData({
        name: casino.name || '',
        description: casino.description || '',
        website_url: casino.website_url || '',
        logo_url: casino.logo_url || '',
        rating: casino.rating || 6,
        bonus_info: casino.bonus_info || '',
        license: casino.license || '',
        established_year: casino.established_year || new Date().getFullYear(),
        is_featured: casino.is_featured ?? false,
        is_active: casino.is_active ?? true,
        display_order: casino.display_order || 999
      })
      setEditingCasino(casino)
    } else {
      // New casino
      setFormData({
        name: '',
        description: '',
        website_url: '',
        logo_url: '',
        rating: 6,
        bonus_info: '',
        license: '',
        established_year: new Date().getFullYear(),
        is_featured: false,
        is_active: true,
        display_order: 999
      })
      setEditingCasino({ isNew: true })
    }
  }, [])

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingCasino(null)
    setFormData({
      name: '',
      description: '',
      website_url: '',
      logo_url: '',
      rating: 6,
      bonus_info: '',
      license: '',
      established_year: new Date().getFullYear(),
      is_featured: false,
      is_active: true,
      display_order: 999
    })
  }, [])

  // Validate form data
  const validateForm = useCallback(() => {
    const errors: string[] = []

    if (!formData.name.trim()) errors.push('Name is required')
    if (!formData.website_url.trim()) errors.push('Website URL is required')
    if (formData.rating < 1 || formData.rating > 10) errors.push('Rating must be between 1-10')
    if (formData.established_year < 1900 || formData.established_year > new Date().getFullYear()) {
      errors.push('Invalid established year')
    }

    return errors
  }, [formData])

  // Save casino (create or update)
  const saveCasino = useCallback(async () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      toast.error('Validation Error', `Please check: ${validationErrors.join(', ')}`)
      return
    }

    setIsLoading(true)
    const operationId = editingCasino?.isNew ? 'create' : `update-${editingCasino?.id}`

    try {
      setPendingOperations(prev => new Set([...prev, operationId]))

      // Optimistic update for better UX
      const tempCasino: Casino = {
        id: editingCasino?.isNew ? `temp-${Date.now()}` : editingCasino?.id!,
        name: formData.name,
        description: formData.description,
        location: null, // Required by Casino type
        website_url: formData.website_url,
        logo_url: formData.logo_url,
        rating: formData.rating,
        bonus_info: formData.bonus_info,
        license: formData.license,
        established_year: formData.established_year,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        display_order: formData.display_order,
        created_at: editingCasino?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (editingCasino?.isNew) {
        // Create new casino
        const result = await createCasino(tempCasino)
        toast.success('Casino Created', `${result.name} has been added to the system`)
      } else {
        // Update existing casino
        const result = await updateCasino(editingCasino?.id!, tempCasino)
        toast.success('Casino Updated', `${result.name} has been updated successfully`)
      }

      cancelEditing()
    } catch (error) {
      console.error('Error saving casino:', error)
      toast.error('Save Failed', 'Unable to save casino data. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
      setPendingOperations(prev => {
        const next = new Set(prev)
        next.delete(operationId)
        return next
      })
    }
  }, [formData, editingCasino, validateForm, createCasino, updateCasino, cancelEditing])

  // Delete casino
  const handleDelete = useCallback(async (casino: Casino) => {
    if (!confirm(`Are you sure you want to delete "${casino.name}"?`)) {
      return
    }

    const operationId = `delete-${casino.id}`
    setPendingOperations(prev => new Set([...prev, operationId]))

    try {
      await deleteCasino(casino.id)
      toast.success('Casino Deleted', 'Casino has been successfully removed from the system')
    } catch (error) {
      console.error('Error deleting casino:', error)
      toast.error('Delete Failed', 'Unable to delete casino. Please try again or contact support.')
    } finally {
      setPendingOperations(prev => {
        const next = new Set(prev)
        next.delete(operationId)
        return next
      })
    }
  }, [deleteCasino])

  // Generate slug from name
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }, [])

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Casino Management</h2>
          {enableRealtimeUpdates && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          )}
        </div>

        <Button
          onClick={() => startEditing(null)}
          disabled={!!editingCasino}
          className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Casino
        </Button>
      </div>

      {/* Realtime Error Alert */}
      {realtimeError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Realtime Error</span>
          </div>
          <p className="text-red-300 mt-1">{realtimeError}</p>
        </div>
      )}

      {/* Edit Form */}
      {editingCasino && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {editingCasino.isNew ? (
                <>
                  <Plus className="w-5 h-5" />
                  Add New Casino
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5" />
                  Edit Casino
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Casino name"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Website URL *
                </label>
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Rating (1-10)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 6 }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Established Year
                </label>
                <Input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.established_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, established_year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  License
                </label>
                <Input
                  value={formData.license}
                  onChange={(e) => setFormData(prev => ({ ...prev, license: e.target.value }))}
                  placeholder="License number"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Display Order
                </label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 999 }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Casino description"
                rows={3}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bonus Info
              </label>
              <Textarea
                value={formData.bonus_info}
                onChange={(e) => setFormData(prev => ({ ...prev, bonus_info: e.target.value }))}
                placeholder="Bonus information"
                rows={2}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                Featured
              </label>

              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                Active
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Logo URL
              </label>
              <ImageUpload
                value={formData.logo_url}
                onChange={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                bucket="casino-logos"
                accept="image/*"
                maxSize={2}
                placeholder="Upload casino logo"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                onClick={saveCasino}
                disabled={isLoading}
                className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black font-medium"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingCasino.isNew ? 'Create' : 'Update'} Casino
              </Button>

              <Button
                onClick={cancelEditing}
                variant="outline"
                disabled={isLoading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Casinos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {casinos.map((casino) => {
          const isPending = pendingOperations.has(`update-${casino.id}`) || pendingOperations.has(`delete-${casino.id}`)

          return (
            <Card key={casino.id} className="bg-gray-900/50 border-gray-700 relative">
              {isPending && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
                  <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold truncate">{casino.name}</h3>
                    <p className="text-gray-400 text-sm truncate">{casino.website_url}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {casino.is_featured && <Badge className="bg-[#00ff88] text-black">Featured</Badge>}
                    <Badge variant={casino.is_active ? "default" : "secondary"}>
                      {casino.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {casino.logo_url && (
                  <Image
                    src={casino.logo_url}
                    alt={casino.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-lg mb-3"
                  />
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Rating:</span>
                    <span className="text-white">{casino.rating}/10</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Year:</span>
                    <span className="text-white">{casino.established_year}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Order:</span>
                    <span className="text-white">{casino.display_order}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => startEditing(casino)}
                    disabled={!!editingCasino || isPending}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                  <Button
                    onClick={() => handleDelete(casino)}
                    disabled={isPending}
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {casinos.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎰</div>
          <h3 className="text-2xl font-bold text-white mb-4">No Casinos Yet</h3>
          <p className="text-gray-400 text-lg mb-6">Get started by adding your first casino.</p>
          <Button
            onClick={() => startEditing(null)}
            className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Casino
          </Button>
        </div>
      )}
    </div>
  )
}

export default CasinoCrudManager
