"use client"

import { useState, useEffect } from "react"
import { useReportsRealtime } from "@/hooks/use-reports-realtime"
import { updateReport, deleteReport, bulkUpdateReports } from "@/app/actions/report-actions"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  AlertTriangle,
  FileText,
  Users,
  Flag,
  Clock,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Download,
  MoreHorizontal,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

export default function AdminReportsPage() {
  const { reports, stats, loading, error, refresh } = useReportsRealtime(50)
  const { toast } = useToast()
  
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingReport, setEditingReport] = useState<any>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  // Filter reports based on search and filters
  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.casino_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || report.status === filterStatus
    const matchesPriority = filterPriority === "all" || report.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Handle report selection
  const handleReportSelect = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    )
  }

  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectedReports.length === filteredReports.length) {
      setSelectedReports([])
    } else {
      setSelectedReports(filteredReports.map(r => r.id))
    }
  }

  // Handle status update
  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      const result = await updateReport({
        id: reportId,
        status: newStatus as any
      })

      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Report status updated to ${newStatus}`,
        })
        refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "error",
      })
    }
  }

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedReports.length === 0) {
      toast({
        title: "No Reports Selected",
        description: "Please select reports to update",
        variant: "error",
      })
      return
    }

    try {
      const result = await bulkUpdateReports(selectedReports, newStatus)
      
      if (result.success) {
        toast({
          title: "Bulk Update Successful",
          description: `Updated ${selectedReports.length} reports to ${newStatus}`,
        })
        setSelectedReports([])
        refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to bulk update reports",
        variant: "error",
      })
    }
  }

  // Handle report deletion
  const handleDeleteReport = async () => {
    if (!reportToDelete) return

    try {
      const result = await deleteReport(reportToDelete)
      
      if (result.success) {
        toast({
          title: "Report Deleted",
          description: "Report has been permanently deleted",
        })
        setReportToDelete(null)
        setDeleteDialogOpen(false)
        refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "error",
      })
    }
  }

  // Handle report edit
  const handleEditReport = async (formData: any) => {
    try {
      const result = await updateReport({
        id: editingReport.id,
        ...formData
      })

      if (result.success) {
        toast({
          title: "Report Updated",
          description: "Report has been updated successfully",
        })
        setEditingReport(null)
        setEditDialogOpen(false)
        refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "error",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-blue-500"
      case "investigating": return "bg-yellow-500"
      case "resolved": return "bg-green-500"
      case "closed": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const formatTime = (num: number) => num.toString().padStart(2, "0")

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="container mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Reports Management</h1>
            <p className="text-gray-400">Manage and monitor casino reports and complaints</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={refresh}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Reports</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Cases</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolved</p>
                <p className="text-2xl font-bold text-white">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">{stats.success_rate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </GlassCard>
        </div>

        {/* Filters and Search */}
        <GlassCard className="p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {selectedReports.length === filteredReports.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedReports.length > 0 && (
                <Select onValueChange={handleBulkStatusUpdate}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Bulk Update" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    <SelectItem value="pending">Mark as Pending</SelectItem>
                    <SelectItem value="investigating">Mark as Investigating</SelectItem>
                    <SelectItem value="resolved">Mark as Resolved</SelectItem>
                    <SelectItem value="closed">Mark as Closed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Reports Table */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <GlassCard key={report.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Checkbox
                    checked={selectedReports.includes(report.id)}
                    onCheckedChange={() => handleReportSelect(report.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                      <Badge className={getPriorityColor(report.priority)}>
                        {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-2">{report.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {report.submittedDate}
                      </span>
                      {report.casino_name && (
                        <span>Casino: {report.casino_name}</span>
                      )}
                      <span>Email: {report.user_email}</span>
                      {report.amount_disputed && (
                        <span>Amount: ${report.amount_disputed}</span>
                      )}
                    </div>

                    {report.status !== "resolved" && report.timeElapsed && (
                      <div className="mt-2 text-sm text-gray-400">
                        Time elapsed: {formatTime(report.timeElapsed.days)}d {formatTime(report.timeElapsed.hours)}h {formatTime(report.timeElapsed.minutes)}m {formatTime(report.timeElapsed.seconds)}s
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={report.status}
                    onValueChange={(value) => handleStatusUpdate(report.id, value)}
                  >
                    <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingReport(report)
                      setEditDialogOpen(true)
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReportToDelete(report.id)
                      setDeleteDialogOpen(true)
                    }}
                    className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}

          {filteredReports.length === 0 && (
            <GlassCard className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Reports Found</h3>
              <p className="text-gray-400">No reports match your current filters.</p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Edit Report Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-black border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
          </DialogHeader>
          {editingReport && (
            <EditReportForm
              report={editingReport}
              onSubmit={handleEditReport}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-black border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteReport}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Edit Report Form Component
function EditReportForm({ report, onSubmit, onCancel }: {
  report: any
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    status: report.status,
    admin_notes: report.admin_notes || "",
    estimated_resolution_date: report.estimated_resolution_date || "",
    time_limit_hours: report.time_limit_hours || 72,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-white">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
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
          <label className="text-sm font-medium text-white">Time Limit (hours)</label>
          <Input
            type="number"
            value={formData.time_limit_hours}
            onChange={(e) => setFormData({ ...formData, time_limit_hours: parseInt(e.target.value) })}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-white">Estimated Resolution Date</label>
        <Input
          type="datetime-local"
          value={formData.estimated_resolution_date}
          onChange={(e) => setFormData({ ...formData, estimated_resolution_date: e.target.value })}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-white">Admin Notes</label>
        <Textarea
          value={formData.admin_notes}
          onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
          className="bg-white/5 border-white/10 text-white min-h-[100px]"
          placeholder="Add internal notes about this report..."
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
          Update Report
        </Button>
      </div>
    </form>
  )
}
