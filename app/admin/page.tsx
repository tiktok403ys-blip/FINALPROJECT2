'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { AdminAuth } from '@/lib/auth/admin-auth'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart3, 
  Users, 
  FileText, 
  MessageSquare, 
  AlertTriangle,
  Settings,
  Dice6,
  Gift,
  LogOut,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardSkeleton } from '@/components/admin/loading-skeleton'

interface DashboardStats {
  totalUsers: number
  totalCasinos: number
  totalBonuses: number
  totalNews: number
  totalReviews: number
  pendingReports: number
  recentActivities: any[]
  dailyActiveUsers: number
  dailyLogins: number
  reviewsToday: number
  reviewsThisWeek: number
}

function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const adminAuth = AdminAuth.getInstance()
  const supabase = createClient()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCasinos: 0,
    totalBonuses: 0,
    totalNews: 0,
    totalReviews: 0,
    pendingReports: 0,
    recentActivities: [],
    dailyActiveUsers: 0,
    dailyLogins: 0,
    reviewsToday: 0,
    reviewsThisWeek: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load current user
    const loadUser = async () => {
      const currentUser = await adminAuth.getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
    loadDashboardStats()
    
    // Set up real-time subscriptions for dashboard updates
    const subscriptions = [
      // Listen for new reviews
      supabase
        .channel('dashboard-reviews')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'casino_reviews'
        }, () => {
          loadDashboardStats()
        })
        .subscribe(),
      
      // Listen for new reports
      supabase
        .channel('dashboard-reports')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reports'
        }, () => {
          loadDashboardStats()
        })
        .subscribe(),
      
      // Listen for audit log changes
      supabase
        .channel('dashboard-audit')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        }, () => {
          loadDashboardStats()
        })
        .subscribe()
    ]
    
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      // Load analytics statistics
      const supabaseClient = supabase()
      const [usersResult, casinosResult, bonusesResult, newsResult, reviewsResult, reportsResult, activitiesResult, dailyUsersResult, dailyLoginsResult, reviewsTodayResult, reviewsWeekResult] = await Promise.all([
        supabaseClient.from('admin_users').select('id', { count: 'exact', head: true }),
        supabaseClient.from('casinos').select('id', { count: 'exact', head: true }),
        supabaseClient.from('bonuses').select('id', { count: 'exact', head: true }),
        supabaseClient.from('news').select('id', { count: 'exact', head: true }),
        supabaseClient.from('casino_reviews').select('id', { count: 'exact', head: true }),
        supabaseClient.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseClient.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(10),
        supabaseClient.from('audit_logs').select('id', { count: 'exact', head: true }).gte('timestamp', today).eq('action', 'user_active'),
        supabaseClient.from('audit_logs').select('id', { count: 'exact', head: true }).gte('timestamp', today).eq('action', 'user_login'),
        supabaseClient.from('casino_reviews').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabaseClient.from('casino_reviews').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo)
      ])

      setStats({
        totalUsers: usersResult.count || 0,
        totalCasinos: casinosResult.count || 0,
        totalBonuses: bonusesResult.count || 0,
        totalNews: newsResult.count || 0,
        totalReviews: reviewsResult.count || 0,
        pendingReports: reportsResult.count || 0,
        recentActivities: activitiesResult.data || [],
        dailyActiveUsers: dailyUsersResult.count || 0,
        dailyLogins: dailyLoginsResult.count || 0,
        reviewsToday: reviewsTodayResult.count || 0,
        reviewsThisWeek: reviewsWeekResult.count || 0
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }



  const handleSignOut = async () => {
    await adminAuth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/70">Welcome back, {user?.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            <Shield className="w-3 h-3 mr-1" />
            {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Badge>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Daily Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.dailyActiveUsers}</div>
            <p className="text-xs text-white/60">Active today</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Daily Logins</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.dailyLogins}</div>
            <p className="text-xs text-white/60">Logins today</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Reviews Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.reviewsToday}</div>
            <p className="text-xs text-white/60">New reviews</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Pending Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pendingReports}</div>
            <p className="text-xs text-white/60">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
              Reviews This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{stats.reviewsThisWeek}</div>
            <div className="flex items-center text-sm">
              <span className="text-green-400 mr-1">+{stats.reviewsToday}</span>
              <span className="text-white/60">today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              Total Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Casinos:</span>
                <span className="text-white font-medium">{stats.totalCasinos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Reviews:</span>
                <span className="text-white font-medium">{stats.totalReviews}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">News:</span>
                <span className="text-white font-medium">{stats.totalNews}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Bonuses:</span>
                <span className="text-white font-medium">{stats.totalBonuses}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Eye className="w-5 h-5 mr-2 text-purple-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Admin Users:</span>
                <span className="text-white font-medium">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Reports:</span>
                <Badge variant={stats.pendingReports > 0 ? "destructive" : "secondary"} className="bg-white/10">
                  {stats.pendingReports > 0 ? `${stats.pendingReports} Pending` : 'All Clear'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Status:</span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                  Online
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Recent Activities */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activities
          </CardTitle>
          <CardDescription className="text-white/60">
            Latest admin actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <div>
                      <p className="text-white text-sm font-medium">{activity.action}</p>
                      <p className="text-white/60 text-xs">
                        {activity.table_name && `Table: ${activity.table_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No recent activities</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  )
}