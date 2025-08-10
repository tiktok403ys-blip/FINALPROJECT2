"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  User,
  Calendar,
  DollarSign,
  Edit,
  Save,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Report } from "@/lib/types"

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [editingReport, setEditingReport] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Report>>({})
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchReports()

    // Set up real-time subscription
    const channel = supabase
      .channel("admin-reports-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        fetchReports()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          casinos (
            name,
            logo_url,
            rating
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching reports:", error)
        toast({
          title: "Error",
          description: "Failed to fetch reports",
          variant: "destructive",
        })
      } else {
        setReports(data || [])
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditReport = (report: Report) => {
    setEditingReport(report.id)
    setEditForm({
      status: report.status,
      priority: report.priority,
      assigned_to: report.assigned_to,
      resolution_notes: report.resolution_notes,
    })
  }

  const handleSaveReport = async (reportId: string) => {
    try {
      const updateData: any = {
        ...editForm,
        updated_at: new Date().toISOString(),
      }

      // If status is being changed to resolved, set resolved_at
      if (editForm.status === "resolved" && reports.find((r) => r.id === reportId)?.status !== "resolved") {
        updateData.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase.from("reports").update(updateData).eq("id", reportId)

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Report updated successfully",
        })
        setEditingReport(null)
        setEditForm({})
        fetchReports()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingReport(null)
    setEditForm({})
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-400" />
      case "investigating":
        return <Timer className="w-5 h-5 text-blue-400" />
      case "resolved":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "closed":
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "investigating":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "closed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-500/20 text-red-400"
      case "high":
        return "bg-orange-500/20 text-orange-400"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400"
      case "low":
        return "bg-green-500/20 text-green-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredReports = reports.filter((report) => {
    if (filter === "all") return true
    return report.status?.toLowerCase() === filter
  })

  const getStatusCounts = () => {
    return {
      all: reports.length,
      pending: reports.filter((r) => r.status === "pending").length,
      investigating: reports.filter((r) => r.status === "investigating").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
      closed: reports.filter((r) => r.status === "closed").length,
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff88] mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Reports Management</h1>
        <p className="text-gray-400 text-lg">Manage and respond to user reports and complaints</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        {Object.entries(statusCounts).map(([status, count]) => (
          <GlassCard key={status} className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{count}</div>
            <div className="text-gray-400 text-sm capitalize">{status} Reports</div>
          </GlassCard>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["all", "pending", "investigating", "resolved", "closed"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
            className={filter === status ? "bg-[#00ff88] text-black" : "border-white/20 text-white hover:bg-white/10"}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {statusCounts[status as keyof typeof statusCounts]}
            </span>
          </Button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {filteredReports.map((report: Report) => (
          <GlassCard key={report.id} className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Report Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {report.casinos?.logo_url ? (
                      <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={report.casinos.logo_url || "/placeholder.svg"}
                          alt={`${report.casinos.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-[#00ff88]" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{report.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {report.user_email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(report.created_at)}
                        </span>
                        {report.amount_disputed && (
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />${report.amount_disputed}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(report.status)}`}
                        >
                          {getStatusIcon(report.status)}
                          <span className="ml-1 capitalize">{report.status}</span>
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(report.priority || "medium")}`}
                        >
                          {(report.priority || "medium").toUpperCase()}
                        </span>
                        {report.category && (
                          <span className="px-2 py-1 bg-white/10 text-gray-400 rounded text-xs">
                            {report.category.replace("_", " ").toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {editingReport !== report.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditReport(report)}
                      className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>

                <p className="text-gray-300 mb-4">{report.description}</p>

                {report.casino_name && (
                  <div className="mb-4">
                    <span className="text-gray-400 text-sm">Casino: </span>
                    <span className="text-white font-semibold">{report.casino_name}</span>
                  </div>
                )}
              </div>

              {/* Admin Controls */}
              <div className="lg:w-80">
                {editingReport === report.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Status</label>
                      <Select
                        value={editForm.status || report.status}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Priority</label>
                      <Select
                        value={editForm.priority || report.priority || "medium"}
                        onValueChange={(value) => setEditForm({ ...editForm, priority: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Assigned To</label>
                      <Input
                        value={editForm.assigned_to || report.assigned_to || ""}
                        onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Assign to team member"
                      />
                    </div>

                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Resolution Notes</label>
                      <Textarea
                        value={editForm.resolution_notes || report.resolution_notes || ""}
                        onChange={(e) => setEditForm({ ...editForm, resolution_notes: e.target.value })}
                        className="bg-white/5 border-white/10 text-white min-h-[100px]"
                        placeholder="Add resolution notes..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveReport(report.id)}
                        className="flex-1 bg-[#00ff88] text-black hover:bg-[#00ff88]/80"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-3">Report Details</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className="text-white capitalize">{report.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Priority:</span>
                          <span className="text-white capitalize">{report.priority || "Medium"}</span>
                        </div>
                        {report.assigned_to && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Assigned:</span>
                            <span className="text-white">{report.assigned_to}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Contact:</span>
                          <span className="text-white capitalize">{report.contact_method || "Email"}</span>
                        </div>
                      </div>
                    </div>

                    {report.resolution_notes && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <h5 className="text-green-400 font-semibold mb-2">Resolution Notes</h5>
                        <p className="text-gray-300 text-sm">{report.resolution_notes}</p>
                        {report.resolved_at && (
                          <p className="text-gray-400 text-xs mt-2">Resolved: {formatDate(report.resolved_at)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-16">
          <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">No Reports Found</h3>
          <p className="text-gray-400 text-lg">
            {filter === "all" ? "No reports have been submitted yet." : `No reports with status "${filter}" found.`}
          </p>
        </div>
      )}
    </div>
  )
}
