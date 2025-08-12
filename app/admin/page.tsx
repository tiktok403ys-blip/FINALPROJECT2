import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import {
  Users,
  Building2,
  Gift,
  MessageSquare,
  Newspaper,
  AlertTriangle,
  TrendingUp,
  Eye,
  Plus,
  Activity,
  BarChart3,
} from "lucide-react"
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
    .select("name, created_at, rating")
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: recentReports } = await supabase
    .from("reports")
    .select("title, status, priority, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const stats = [
    {
      title: "Total Casinos",
      value: casinosCount || 0,
      icon: Building2,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      href: "/admin/casinos",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Active Bonuses",
      value: bonusesCount || 0,
      icon: Gift,
      color: "text-[#00ff88]",
      bgColor: "bg-[#00ff88]/10",
      borderColor: "border-[#00ff88]/20",
      href: "/admin/bonuses",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Registered Users",
      value: usersCount || 0,
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      href: "/admin/users",
      change: "+24%",
      changeType: "positive",
    },
    {
      title: "Forum Posts",
      value: postsCount || 0,
      icon: MessageSquare,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      href: "/admin/forum",
      change: "+5%",
      changeType: "positive",
    },
    {
      title: "News Articles",
      value: newsCount || 0,
      icon: Newspaper,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      href: "/admin/news",
      change: "+15%",
      changeType: "positive",
    },
    {
      title: "Pending Reports",
      value: reportsCount || 0,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      href: "/admin/reports",
      change: "-3%",
      changeType: "negative",
    },
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/5 via-transparent to-blue-500/5" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 text-xl">Manage your casino guide platform with advanced analytics</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20">
                <Activity className="w-4 h-4 text-[#00ff88]" />
                <span className="text-[#00ff88] text-sm font-medium">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Enhanced Statistics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <GlassCard
                className={`p-6 hover:scale-[1.02] transition-all duration-300 group border ${stat.borderColor} ${stat.bgColor}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor} border ${stat.borderColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      stat.changeType === "positive"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    <TrendingUp className={`w-3 h-3 ${stat.changeType === "negative" ? "rotate-180" : ""}`} />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-1 group-hover:text-[#00ff88] transition-colors">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* Enhanced Quick Actions */}
        <GlassCard className="p-8 mb-12 bg-gradient-to-r from-white/5 to-white/10 border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Quick Actions</h3>
              <p className="text-gray-400">Manage your platform efficiently</p>
            </div>
            <BarChart3 className="w-8 h-8 text-[#00ff88]" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              asChild
              className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 h-14 text-base font-semibold group"
            >
              <Link href="/admin/casinos/new">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-black/20">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span>Add Casino</span>
                </div>
              </Link>
            </Button>
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700 h-14 text-base font-semibold">
              <Link href="/admin/bonuses/new">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-white/20">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span>Add Bonus</span>
                </div>
              </Link>
            </Button>
            <Button asChild className="bg-purple-600 text-white hover:bg-purple-700 h-14 text-base font-semibold">
              <Link href="/admin/news/new">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-white/20">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span>Add News</span>
                </div>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#00ff88] text-[#00ff88] bg-[#00ff88]/5 hover:bg-[#00ff88]/10 h-14 text-base font-semibold"
            >
              <Link href="/">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[#00ff88]/20">
                    <Eye className="w-5 h-5" />
                  </div>
                  <span>View Site</span>
                </div>
              </Link>
            </Button>
          </div>
        </GlassCard>

        {/* Enhanced Recent Activities */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Casinos */}
          <GlassCard className="p-8 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Recent Casinos</h3>
                <p className="text-gray-400">Latest casino additions</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="space-y-4">
              {recentCasinos?.map((casino, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{casino.name}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">
                          {new Date(casino.created_at).toLocaleDateString()}
                        </span>
                        {casino.rating && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3 text-[#00ff88]" />
                            <span className="text-[#00ff88] text-sm font-medium">{casino.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!recentCasinos?.length && (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No recent casinos</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Recent Reports */}
          <GlassCard className="p-8 bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Recent Reports</h3>
                <p className="text-gray-400">Latest user reports</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="space-y-4">
              {recentReports?.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        report.priority === "urgent"
                          ? "bg-red-500/20"
                          : report.priority === "high"
                            ? "bg-orange-500/20"
                            : report.priority === "medium"
                              ? "bg-yellow-500/20"
                              : "bg-gray-500/20"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-6 h-6 ${
                          report.priority === "urgent"
                            ? "text-red-400"
                            : report.priority === "high"
                              ? "text-orange-400"
                              : report.priority === "medium"
                                ? "text-yellow-400"
                                : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{report.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : report.status === "resolved"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {report.status}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!recentReports?.length && (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No recent reports</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
