# Admin Panel Restructuring - Implementation Guide

## 1. Pre-Implementation Checklist

### 1.1 Environment Setup

* [ ] Backup existing database

* [ ] Create development branch

* [ ] Setup staging environment

* [ ] Verify Supabase connection

* [ ] Install required dependencies

### 1.2 Dependencies Installation

```bash
# Core dependencies
npm install @supabase/supabase-js@latest
npm install @hookform/resolvers zod
npm install @tanstack/react-query
npm install lucide-react
npm install recharts
npm install react-hot-toast

# Development dependencies
npm install -D @types/node
npm install -D eslint-config-next
npm install -D prettier
```

### 1.3 Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_SECRET_KEY=your_admin_secret_key
```

## 2. Phase 1: Database Migration

### 2.1 Backup Current Data

```sql
-- Create backup tables
CREATE TABLE casinos_backup AS SELECT * FROM casinos;
CREATE TABLE bonuses_backup AS SELECT * FROM bonuses;
CREATE TABLE news_backup AS SELECT * FROM news;
CREATE TABLE casino_reviews_backup AS SELECT * FROM casino_reviews;
```

### 2.2 Execute Migration Scripts

```sql
-- Run in sequence
\i scripts/01-create-admin-tables.sql
\i scripts/02-update-existing-tables.sql
\i scripts/03-create-audit-system.sql
\i scripts/04-setup-rls-policies.sql
\i scripts/05-create-functions-triggers.sql
```

### 2.3 Data Migration

```sql
-- Migrate existing admin users
INSERT INTO admin_users (email, password_hash, role, is_active)
SELECT 
    email,
    password_hash,
    CASE 
        WHEN is_super_admin THEN 'super_admin'
        ELSE 'admin'
    END as role,
    is_active
FROM auth.users 
WHERE role IN ('admin', 'super_admin');

-- Update existing content with proper structure
INSERT INTO content_sections (page_name, section_type, title, content, is_active)
VALUES 
    ('home', 'hero', 'Welcome to Casino Guru Singapore', 'Your trusted guide to online casinos', true),
    ('reports', 'hero', 'Casino Reports', 'Submit and track casino-related reports', true),
    ('reviews', 'hero', 'Casino Reviews', 'Read authentic casino reviews from real players', true);
```

## 3. Phase 2: Core Components Implementation

### 3.1 Authentication System

**File:** **`lib/auth/admin-auth.ts`**

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types/database'

export class AdminAuth {
  private supabase = createClientComponentClient<Database>()

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Verify admin role
    const { data: adminUser, error: adminError } = await this.supabase
      .from('admin_users')
      .select('role, permissions, is_active')
      .eq('email', email)
      .single()

    if (adminError || !adminUser?.is_active) {
      throw new Error('Unauthorized access')
    }

    return { user: data.user, adminData: adminUser }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data: adminUser } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .single()

    return { user, adminData: adminUser }
  }
}
```

### 3.2 Role-Based Access Control

**File:** **`hooks/use-admin-auth.ts`**

```typescript
import { useEffect, useState } from 'react'
import { AdminAuth } from '@/lib/auth/admin-auth'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'admin'
  permissions: Record<string, boolean>
  is_active: boolean
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const auth = new AdminAuth()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const userData = await auth.getCurrentUser()
      setUser(userData?.adminData || null)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    if (user.role === 'super_admin') return true
    return user.permissions[permission] || false
  }

  const isSuperAdmin = () => user?.role === 'super_admin'

  return {
    user,
    loading,
    hasPermission,
    isSuperAdmin,
    signOut: auth.signOut
  }
}
```

### 3.3 Protected Route Component

**File:** **`components/admin/protected-route.tsx`**

```typescript
'use client'

import { useAdminAuth } from '@/hooks/use-admin-auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  superAdminOnly?: boolean
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  superAdminOnly = false 
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, isSuperAdmin } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login')
      return
    }

    if (!loading && user) {
      if (superAdminOnly && !isSuperAdmin()) {
        router.push('/admin/unauthorized')
        return
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push('/admin/unauthorized')
        return
      }
    }
  }, [user, loading, requiredPermission, superAdminOnly])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) return null

  if (superAdminOnly && !isSuperAdmin()) return null

  if (requiredPermission && !hasPermission(requiredPermission)) return null

  return <>{children}</>
}
```

## 4. Phase 3: Dashboard Implementation

### 4.1 Analytics Dashboard

**File:** **`app/admin/page.tsx`**

```typescript
import { ProtectedRoute } from '@/components/admin/protected-route'
import { DashboardStats } from '@/components/admin/dashboard-stats'
import { RecentActivities } from '@/components/admin/recent-activities'
import { QuickActions } from '@/components/admin/quick-actions'

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        
        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivities />
          <QuickActions />
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

**File:** **`components/admin/dashboard-stats.tsx`**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Star, FileText, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface DashboardData {
  totalUsers: number
  totalReviews: number
  pendingReports: number
  averageRating: number
}

export function DashboardStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardData> => {
      const [usersResult, reviewsResult, reportsResult, ratingsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('casino_reviews').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('casino_reviews').select('rating')
      ])

      const averageRating = ratingsResult.data?.length 
        ? ratingsResult.data.reduce((sum, review) => sum + review.rating, 0) / ratingsResult.data.length
        : 0

      return {
        totalUsers: usersResult.count || 0,
        totalReviews: reviewsResult.count || 0,
        pendingReports: reportsResult.count || 0,
        averageRating: Math.round(averageRating * 10) / 10
      }
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const stats = [
    {
      title: 'Total Users',
      value: data?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Reviews',
      value: data?.totalReviews || 0,
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      title: 'Pending Reports',
      value: data?.pendingReports || 0,
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      title: 'Average Rating',
      value: data?.averageRating || 0,
      icon: FileText,
      color: 'text-green-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stat.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

### 4.2 Content Management Hub

**File:** **`app/admin/content/page.tsx`**

```typescript
import { ProtectedRoute } from '@/components/admin/protected-route'
import { ContentManagementGrid } from '@/components/admin/content-management-grid'

export default function ContentManagementPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        </div>
        
        <ContentManagementGrid />
      </div>
    </ProtectedRoute>
  )
}
```

**File:** **`components/admin/content-management-grid.tsx`**

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import Link from 'next/link'
import { 
  Building2, 
  Gift, 
  Newspaper, 
  Star, 
  FileText, 
  Settings, 
  Users, 
  Footer 
} from 'lucide-react'

interface ContentModule {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  superAdminOnly?: boolean
}

export function ContentManagementGrid() {
  const { hasPermission, isSuperAdmin } = useAdminAuth()

  const modules: ContentModule[] = [
    {
      title: 'Casino Management',
      description: 'Manage casino listings, ratings, and information',
      href: '/admin/casinos',
      icon: Building2,
      permission: 'manage_casinos'
    },
    {
      title: 'Bonus Management',
      description: 'Create and manage casino bonus offers',
      href: '/admin/bonuses',
      icon: Gift,
      permission: 'manage_bonuses'
    },
    {
      title: 'News Management',
      description: 'Publish and manage industry news articles',
      href: '/admin/news',
      icon: Newspaper,
      permission: 'manage_news'
    },
    {
      title: 'Review Management',
      description: 'Moderate and manage casino reviews',
      href: '/admin/reviews',
      icon: Star,
      permission: 'manage_reviews'
    },
    {
      title: 'Report Management',
      description: 'Handle user reports and complaints',
      href: '/admin/reports',
      icon: FileText,
      permission: 'manage_reports'
    },
    {
      title: 'Footer Management',
      description: 'Manage footer content and links',
      href: '/admin/footer',
      icon: Footer,
      superAdminOnly: true
    },
    {
      title: 'Site Settings',
      description: 'Configure global site settings',
      href: '/admin/settings',
      icon: Settings,
      superAdminOnly: true
    },
    {
      title: 'User Management',
      description: 'Manage admin users and permissions',
      href: '/admin/users',
      icon: Users,
      superAdminOnly: true
    }
  ]

  const filteredModules = modules.filter(module => {
    if (module.superAdminOnly && !isSuperAdmin()) return false
    if (module.permission && !hasPermission(module.permission)) return false
    return true
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredModules.map((module) => {
        const Icon = module.icon
        return (
          <Card key={module.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {module.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {module.description}
              </p>
              <Button asChild className="w-full">
                <Link href={module.href}>Manage</Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

## 5. Phase 4: CRUD Implementation

### 5.1 Generic CRUD Hook

**File:** **`hooks/use-crud.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface CrudOptions {
  table: string
  queryKey: string
  select?: string
  orderBy?: { column: string; ascending?: boolean }
}

export function useCrud<T>({ table, queryKey, select = '*', orderBy }: CrudOptions) {
  const queryClient = useQueryClient()

  // Read
  const { data, isLoading, error } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      let query = supabase.from(table).select(select)
      
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
      }
      
      const { data, error } = await query
      if (error) throw error
      return data as T[]
    }
  })

  // Create
  const createMutation = useMutation({
    mutationFn: async (newItem: Partial<T>) => {
      const { data, error } = await supabase
        .from(table)
        .insert(newItem)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      toast.success('Item created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create item: ${error.message}`)
    }
  })

  // Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<T> }) => {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      toast.success('Item updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update item: ${error.message}`)
    }
  })

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      toast.success('Item deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete item: ${error.message}`)
    }
  })

  return {
    data,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}
```

### 5.2 Casino Management Implementation

**File:** **`app/admin/casinos/page.tsx`**

```typescript
'use client'

import { ProtectedRoute } from '@/components/admin/protected-route'
import { CasinoDataTable } from '@/components/admin/casino-data-table'
import { CreateCasinoDialog } from '@/components/admin/create-casino-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export default function CasinoManagementPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <ProtectedRoute requiredPermission="manage_casinos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Casino Management</h1>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Casino
          </Button>
        </div>
        
        <CasinoDataTable />
        
        <CreateCasinoDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog} 
        />
      </div>
    </ProtectedRoute>
  )
}
```

## 6. Phase 5: Security Implementation

### 6.1 Input Validation

**File:** **`lib/validations/casino.ts`**

```typescript
import { z } from 'zod'

export const casinoSchema = z.object({
  name: z.string().min(1, 'Casino name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  rating: z.number().min(1).max(5),
  location: z.string().min(1, 'Location is required'),
  website_url: z.string().url('Must be a valid URL'),
  bonus_info: z.string().optional(),
  logo_url: z.string().url().optional(),
  is_featured: z.boolean().default(false)
})

export type CasinoFormData = z.infer<typeof casinoSchema>
```

### 6.2 API Route Protection

**File:** **`app/api/admin/casinos/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { casinoSchema } from '@/lib/validations/casino'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? 'anonymous'
    const { success } = await rateLimit.limit(identifier)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role, permissions')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check permissions
    if (adminUser.role !== 'super_admin' && !adminUser.permissions?.manage_casinos) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch casinos
    const { data: casinos, error } = await supabase
      .from('casinos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ casinos })
  } catch (error) {
    console.error('Casino fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const identifier = request.ip ?? 'anonymous'
    const { success } = await rateLimit.limit(identifier)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Authentication and authorization (same as GET)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role, permissions')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (adminUser.role !== 'super_admin' && !adminUser.permissions?.manage_casinos) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate input
    const body = await request.json()
    const validatedData = casinoSchema.parse(body)

    // Create casino
    const { data: casino, error } = await supabase
      .from('casinos')
      .insert(validatedData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ casino }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Casino creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// __tests__/admin-auth.test.ts
import { AdminAuth } from '@/lib/auth/admin-auth'
import { createMockSupabaseClient } from '@/lib/test-utils'

jest.mock('@supabase/auth-helpers-nextjs')

describe('AdminAuth', () => {
  let adminAuth: AdminAuth
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    adminAuth = new AdminAuth()
  })

  describe('signIn', () => {
    it('should authenticate valid admin user', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'admin@test.com' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin', is_active: true },
              error: null
            })
          })
        })
      })

      const result = await adminAuth.signIn('admin@test.com', 'password')
      
      expect(result.user.email).toBe('admin@test.com')
      expect(result.adminData.role).toBe('admin')
    })

    it('should reject inactive admin user', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'admin@test.com' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin', is_active: false },
              error: null
            })
          })
        })
      })

      await expect(adminAuth.signIn('admin@test.com', 'password'))
        .rejects.toThrow('Unauthorized access')
    })
  })
})
```

### 7.2 Integration Tests

```typescript
// __tests__/api/admin/casinos.test.ts
import { GET, POST } from '@/app/api/admin/casinos/route'
import { NextRequest } from 'next/server'
import { createMockRequest } from '@/lib/test-utils'

describe('/api/admin/casinos', () => {
  describe('GET', () => {
    it('should return casinos for authenticated admin', async () => {
      const request = createMockRequest({
        headers: { authorization: 'Bearer valid-token' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.casinos).toBeDefined()
    })

    it('should return 401 for unauthenticated request', async () => {
      const request = createMockRequest({})

      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('should create casino with valid data', async () => {
      const casinoData = {
        name: 'Test Casino',
        description: 'A test casino for testing purposes',
        rating: 4.5,
        location: 'Test Location',
        website_url: 'https://testcasino.com'
      }

      const request = createMockRequest({
        method: 'POST',
        body: JSON.stringify(casinoData),
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.casino.name).toBe('Test Casino')
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        description: 'Short', // Invalid: too short
        rating: 6 // Invalid: rating too high
      }

      const request = createMockRequest({
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })
  })
})
```

## 8. Deployment Checklist

### 8.1 Pre-Deployment

* [ ] All tests passing

* [ ] Security audit completed

* [ ] Performance testing completed

* [ ] Database migration scripts tested

* [ ] Backup procedures verified

* [ ] Environment variables configured

* [ ] SSL certificates installed

* [ ] CDN configured for static assets

### 8.2 Deployment Steps

1. **Database Migration**

   ```bash
   # Run migration scripts
   npm run db:migrate

   # Verify data integrity
   npm run db:verify
   ```

2. **Application Deployment**

   ```bash
   # Build application
   npm run build

   # Deploy to production
   npm run deploy:production
   ```

3. **Post-Deployment Verification**

   ```bash
   # Run health checks
   npm run health:check

   # Verify admin panel functionality
   npm run test:e2e:admin
   ```

### 8.3 Monitoring Setup

* [ ] Error tracking configured (Sentry)

* [ ] Performance monitoring active (Vercel Analytics)

* [ ] Database monitoring enabled (Supabase Dashboard)

* [ ] Uptime monitoring configured

* [ ] Alert notifications setup

## 9. Rollback Procedures

### 9.1 Application Rollback

```bash
# Rollback to previous version
git checkout previous-stable-tag
npm run deploy:production
```

### 9.2 Database Rollback

```sql
-- Restore from backup if needed
-- This should be tested in staging first
DROP TABLE IF EXISTS casinos;
CREATE TABLE casinos AS SELECT * FROM casinos_backup;

-- Restore other tables as needed
DROP TABLE IF EXISTS admin_users;
-- Recreate original admin structure
```

### 9.3 Emergency Contacts

* **Technical Lead**: \[contact info]

* **Database Admin**: \[contact info]

* **DevOps Engineer**: \[contact info]

* **Product Owner**: \[contact info]

## 10. Post-Implementation

### 10.1 Training Materials

* Admin user guide documentation

* Video tutorials for common tasks

* Troubleshooting guide

* API documentation for developers

### 10.2 Success Metrics Tracking

* Monitor admin task completion times

* Track system performance metrics

* Monitor security incident reports

* Collect user feedback and satisfaction scores

### 10.3 Continuous Improvement

* Weekly performance reviews

* Monthly security audits

* Quarterly feature enhancement planning

* Annual architecture review

