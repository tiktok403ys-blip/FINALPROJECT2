import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Users, Building2, Gift, MessageSquare, Newspaper, AlertTriangle, TrendingUp, Eye, Plus } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get real-time statistics
  const [
    { count: casinosCount },
    { count: bonusesCount },
    { count: usersCount },
    { count: postsCount },
    { count: newsCount },
    { count: reportsCount },
  ] = await Promise.all([
    supabase.from("casinos").select("*", { count: "exact", head: true }),
    supabase.from("bonuses").select("*", { count: "exact", head: true }),
    supabase.auth.admin.listUsers().then((res) => ({ count: res.data.users?.length || 0 })),
    supabase.from("forum_posts").select("*", { count: "exact", head: true }),
    supabase.from("news").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }),
  ])

  // Get recent activities
  const { data: recentCasinos } = await supabase
    .from("casinos")
    .select("name, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: recentReports } = await supabase
    .from("reports")
    .select("title, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const stats = [
    {
      title: "Total Casinos",
      value: casinosCount || 0,
      icon: Building2,
      color: "text-blue-400",
      href: "/admin/casinos",
    },
    {
      title: "Active Bonuses",
      value: bonusesCount || 0,
      icon: Gift,
      color: "text-green-400",
      href: "/admin/bonuses",
    },
    {
      title: "Registered Users",
      value: usersCount || 0,
      icon: Users,
      color: "text-purple-400",
      href: "/admin/users",
    },
    {
      title: "Forum Posts",
      value: postsCount || 0,
      icon: MessageSquare,
      color: "text-yellow-400",
      href: "/admin/forum",
    },
    {
      title: "News Articles",
      value: newsCount || 0,
      icon: Newspaper,
      color: "text-[#00ff88]",
      href: "/admin/news",
    },
    {
      title: "Pending Reports",
      value: reportsCount || 0,
      icon: AlertTriangle,
      color: "text-red-400",
      href: "/admin/reports",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Admin Dashboard</h1>
        <p className="text-gray-400 text-lg">Manage your casino guide platform</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <GlassCard className="p-6 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <stat.icon className={`w-12 h-12 ${stat.color}`} />
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 h-12">
          <Link href="/admin/casinos/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Casino
          </Link>
        </Button>
        <Button asChild className="bg-blue-600 text-white hover:bg-blue-700 h-12">
          <Link href="/admin/bonuses/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Bonus
          </Link>
        </Button>
        <Button asChild className="bg-purple-600 text-white hover:bg-purple-700 h-12">
          <Link href="/admin/news/new">
            <Plus className="w-4 h-4 mr-2" />
            Add News
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent h-12">
          <Link href="/">
            <Eye className="w-4 h-4 mr-2" />
            View Site
          </Link>
        </Button>
      </div>

      {/* Recent Activities */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Casinos */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Casinos</h3>
            <TrendingUp className="w-5 h-5 text-[#00ff88]" />
          </div>
          <div className="space-y-4">
            {recentCasinos?.map((casino, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-white font-medium">{casino.name}</p>
                  <p className="text-gray-400 text-sm">{new Date(casino.created_at).toLocaleDateString()}</p>
                </div>
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
            ))}
            {!recentCasinos?.length && <p className="text-gray-400 text-center py-4">No recent casinos</p>}
          </div>
        </GlassCard>

        {/* Recent Reports */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Reports</h3>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="space-y-4">
            {recentReports?.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-white font-medium">{report.title}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        report.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : report.status === "resolved"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {report.status}
                    </span>
                    <span className="text-gray-400 text-sm">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {!recentReports?.length && <p className="text-gray-400 text-center py-4">No recent reports</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
