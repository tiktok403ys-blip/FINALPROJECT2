'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/admin/image-upload'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useOptimizedQuery, useOptimizedMutation } from '@/hooks/use-optimized-query'
import { TableSkeleton } from '@/components/admin/loading-skeleton'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Shield,
  ShieldCheck,
  Calendar,
  Mail,
  User,
  Crown,
  Ban,
  CheckCircle
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login: string
  created_at: string
  updated_at: string
  permissions: string[]
  avatar_url: string
  phone: string
  department: string
}

function UsersManagementPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: '',
    is_active: true,
    permissions: [] as string[],
    phone: '',
    department: '',
    avatar_url: ''
  })

  // Use optimized query hook
  const { 
    data: users = [], 
    loading, 
    error, 
    refetch 
  } = useOptimizedQuery<AdminUser>({
    table: 'admin_users',
    select: '*',
    filters: {
      ...(searchTerm && { full_name: `%${searchTerm}%` }),
      ...(roleFilter !== 'all' && { role: roleFilter }),
      ...(statusFilter !== 'all' && { is_active: statusFilter === 'active' })
    },
    orderBy: { column: 'created_at', ascending: false },
    enableRealtime: true,
    cacheKey: `admin-users-${searchTerm}-${roleFilter}-${statusFilter}`,
    debounceMs: 500
  })

  // Use optimized mutation hook
  const { mutate, loading: mutationLoading } = useOptimizedMutation<AdminUser>({
    table: 'admin_users',
    onSuccess: () => {
      toast.success('Operation completed successfully')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
    invalidateQueries: [`admin-users-${searchTerm}-${roleFilter}-${statusFilter}`]
  })

  const roles = [
    'Super Admin',
    'Admin',
    'Content Manager',
    'Moderator',
    'Analyst'
  ]

  const departments = [
    'Administration',
    'Content Management',
    'Customer Support',
    'Marketing',
    'Analytics',
    'Security'
  ]

  const availablePermissions = [
    'users.read',
    'users.write',
    'users.delete',
    'content.read',
    'content.write',
    'content.delete',
    'reviews.moderate',
    'reports.manage',
    'analytics.view',
    'system.admin'
  ]

  // Handle form submission with optimized mutation
  const handleSaveOptimized = async () => {
    try {
      if (!formData.email.trim() || !formData.full_name.trim() || !formData.role) {
        toast.error('Email, full name, and role are required')
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address')
        return
      }

      if (editingId && editingId !== 'new') {
        // Update existing user
        const supabaseClient = supabase()
        await mutate('update', {
          ...formData,
          updated_at: new Date().toISOString()
        }, { id: editingId })
      } else {
        // Create new user
        const supabaseClient = supabase()
        await mutate('insert', {
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      resetForm()
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  const handleSave = handleSaveOptimized

  const handleEdit = (user: AdminUser) => {
    setEditingId(user.id)
    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      permissions: user.permissions || [],
      phone: user.phone || '',
      department: user.department || '',
      avatar_url: user.avatar_url || ''
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      await mutate('delete', null, { id })
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await mutate('update', {
        is_active: !currentStatus,
        updated_at: new Date().toISOString()
      }, { id })
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      email: '',
      full_name: '',
      role: '',
      is_active: true,
      permissions: [],
      phone: '',
      department: '',
      avatar_url: ''
    })
  }

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active)
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return <Crown className="w-4 h-4" />
      case 'Admin':
        return <ShieldCheck className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-500/20 text-purple-400'
      case 'Admin':
        return 'bg-blue-500/20 text-blue-400'
      case 'Content Manager':
        return 'bg-green-500/20 text-green-400'
      case 'Moderator':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'Analyst':
        return 'bg-orange-500/20 text-orange-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const formatLastLogin = (lastLogin: string) => {
    if (!lastLogin) return 'Never'
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return <TableSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading users: {error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
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
            <Users className="w-8 h-8 mr-3" />
            Users Management
          </h1>
          <p className="text-white/70">Manage admin users and permissions</p>
        </div>
        <Button
          onClick={() => setEditingId('new')}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{users?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">{users?.filter(u => u.is_active).length || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Super Admins</p>
                <p className="text-2xl font-bold text-white">{users?.filter(u => u.role === 'Super Admin').length || 0}</p>
              </div>
              <Crown className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Inactive Users</p>
                <p className="text-2xl font-bold text-white">{users?.filter(u => !u.is_active).length || 0}</p>
              </div>
              <Ban className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
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
              {editingId === 'new' ? 'Add New User' : 'Edit User'}
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
                <label className="text-white/90 text-sm font-medium mb-2 block">Full Name</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Role</label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Department</label>
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Avatar</label>
              <ImageUpload
                bucket="user-avatars"
                value={formData.avatar_url}
                onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                className="bg-white/5 border-white/20"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availablePermissions.map(permission => (
                  <label key={permission} className="flex items-center space-x-2 text-white/90 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, permissions: [...formData.permissions, permission] })
                        } else {
                          setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== permission) })
                        }
                      }}
                      className="rounded"
                    />
                    <span>{permission}</span>
                  </label>
                ))}
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
                Save User
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white/70" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-white font-semibold text-lg mr-3">{user.full_name}</h3>
                      <Badge className={`${getRoleBadgeColor(user.role)} flex items-center`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{user.role}</span>
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-white/70">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {user.email}
                      </div>
                      {user.department && (
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          {user.department}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Last login: {formatLastLogin(user.last_login)}
                      </div>
                    </div>
                    {user.permissions && user.permissions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-white/60 text-xs mb-1">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.slice(0, 3).map(permission => (
                            <Badge key={permission} className="bg-white/5 text-white/60 text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {user.permissions.length > 3 && (
                            <Badge className="bg-white/5 text-white/60 text-xs">
                              +{user.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={user.is_active ? "secondary" : "destructive"}
                    className={user.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                    onClick={() => toggleStatus(user.id, user.is_active)}
                    style={{ cursor: 'pointer' }}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    className="text-white/70 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No users found</p>
            <Button
              onClick={() => setEditingId('new')}
              className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First User
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function UsersManagementPageWrapper() {
  return (
    <ProtectedRoute>
      <UsersManagementPage />
    </ProtectedRoute>
  )
}