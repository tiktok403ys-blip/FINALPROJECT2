'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { Plus, Edit, Eye, AlertTriangle, CheckCircle, XCircle, Clock, User, Calendar, FileText, MessageSquare, Flag, Archive, Download } from 'lucide-react'
import { DataTable, DataTableColumn, DataTableAction } from '@/components/admin/data-table'
import { FormBuilder, FormSection } from '@/components/admin/form-builder'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { useCrud } from '@/hooks/use-crud'
import { AdminAuth } from '@/lib/auth/admin-auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'

// Report interface
interface Report {
  id: string
  title: string
  description: string
  category: 'bug' | 'feature_request' | 'complaint' | 'suggestion' | 'security' | 'content' | 'payment' | 'technical' | 'other'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected'
  reporter_name: string
  reporter_email: string
  reporter_ip?: string
  user_agent?: string
  page_url?: string
  casino_id?: string
  casino_name?: string
  assigned_to?: string
  assigned_admin_name?: string
  resolution_notes?: string
  resolution_time?: number // in hours
  attachments?: string[]
  tags?: string[]
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  reproducible: boolean
  steps_to_reproduce?: string
  expected_behavior?: string
  actual_behavior?: string
  browser_info?: string
  device_info?: string
  screenshot_urls?: string[]
  internal_notes?: string
  public_response?: string
  follow_up_required: boolean
  follow_up_date?: string
  escalated: boolean
  escalated_to?: string
  escalated_at?: string
  source: 'website' | 'email' | 'phone' | 'chat' | 'social' | 'internal'
  created_at: string
  updated_at: string
  resolved_at?: string
  closed_at?: string
}

// Admin interface for assignment
interface Admin {
  id: string
  name: string
  email: string
  role: string
}

// Casino interface for selection
interface Casino {
  id: string
  name: string
  status: string
}

// Validation schema
const reportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  category: z.enum(['bug', 'feature_request', 'complaint', 'suggestion', 'security', 'content', 'payment', 'technical', 'other'], {
    required_error: 'Category is required'
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: 'Priority is required'
  }),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'rejected'], {
    required_error: 'Status is required'
  }),
  reporter_name: z.string().min(1, 'Reporter name is required').max(100, 'Name too long'),
  reporter_email: z.string().email('Invalid email address'),
  page_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  casino_id: z.string().optional(),
  assigned_to: z.string().optional(),
  resolution_notes: z.string().max(2000, 'Resolution notes too long').optional(),
  tags: z.array(z.string()).max(10, 'Too many tags').optional().default([]),
  severity: z.enum(['minor', 'moderate', 'major', 'critical'], {
    required_error: 'Severity is required'
  }),
  reproducible: z.boolean().default(false),
  steps_to_reproduce: z.string().max(2000, 'Steps too long').optional(),
  expected_behavior: z.string().max(1000, 'Expected behavior too long').optional(),
  actual_behavior: z.string().max(1000, 'Actual behavior too long').optional(),
  browser_info: z.string().max(200, 'Browser info too long').optional(),
  device_info: z.string().max(200, 'Device info too long').optional(),
  internal_notes: z.string().max(2000, 'Internal notes too long').optional(),
  public_response: z.string().max(1000, 'Public response too long').optional(),
  follow_up_required: z.boolean().default(false),
  follow_up_date: z.string().optional(),
  escalated: z.boolean().default(false),
  escalated_to: z.string().optional(),
  source: z.enum(['website', 'email', 'phone', 'chat', 'social', 'internal'], {
    required_error: 'Source is required'
  }),
})

type ReportFormData = z.infer<typeof reportSchema>

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
  const adminAuth = AdminAuth.getInstance()
  const [showForm, setShowForm] = useState(false)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [viewingReport, setViewingReport] = useState<Report | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [admins, setAdmins] = useState<Admin[]>([])
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [loadingCasinos, setLoadingCasinos] = useState(false)

  const [crudState, crudActions] = useCrud<Report>({
    table: 'reports',
    orderBy: { column: 'created_at', ascending: false },
    filters: {
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(categoryFilter !== 'all' && { category: categoryFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      ...(severityFilter !== 'all' && { severity: severityFilter })
    }
  })

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await adminAuth.getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [adminAuth])

  // Load admins and casinos for selection
  useEffect(() => {
    const loadData = async () => {
      setLoadingAdmins(true)
      setLoadingCasinos(true)
      
      try {
        // Load admins
        const supabaseClient = supabase()
        const { data: adminData, error: adminError } = await supabaseClient
          .from('admin_users')
          .select('id, name, email, role')
          .eq('status', 'active')
          .order('name')
        
        if (adminError) throw adminError
        setAdmins(adminData || [])
        
        // Load casinos
        const { data: casinoData, error: casinoError } = await supabaseClient
          .from('casinos')
          .select('id, name, status')
          .eq('status', 'active')
          .order('name')
        
        if (casinoError) throw casinoError
        setCasinos(casinoData || [])
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load reference data')
      } finally {
        setLoadingAdmins(false)
        setLoadingCasinos(false)
      }
    }

    loadData()
  }, [])

  // Form sections configuration
  const formSections: FormSection[] = [
    {
      title: 'Report Information',
      description: 'Basic report details and categorization',
      fields: [
        {
          name: 'title',
          label: 'Report Title',
          type: 'text',
          placeholder: 'Brief summary of the issue or request',
          required: true,
          maxLength: 200
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Detailed description of the issue, request, or feedback...',
          required: true,
          rows: 4,
          maxLength: 5000
        },
        {
          name: 'category',
          label: 'Category',
          type: 'select',
          required: true,
          options: [
            { label: 'Bug Report', value: 'bug' },
            { label: 'Feature Request', value: 'feature_request' },
            { label: 'Complaint', value: 'complaint' },
            { label: 'Suggestion', value: 'suggestion' },
            { label: 'Security Issue', value: 'security' },
            { label: 'Content Issue', value: 'content' },
            { label: 'Payment Issue', value: 'payment' },
            { label: 'Technical Issue', value: 'technical' },
            { label: 'Other', value: 'other' }
          ]
        },
        {
          name: 'priority',
          label: 'Priority',
          type: 'select',
          required: true,
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Critical', value: 'critical' }
          ],
          defaultValue: 'medium'
        },
        {
          name: 'severity',
          label: 'Severity',
          type: 'select',
          required: true,
          options: [
            { label: 'Minor', value: 'minor' },
            { label: 'Moderate', value: 'moderate' },
            { label: 'Major', value: 'major' },
            { label: 'Critical', value: 'critical' }
          ],
          defaultValue: 'moderate'
        },
        {
          name: 'tags',
          label: 'Tags',
          type: 'tags',
          placeholder: 'Add relevant tags (e.g., mobile, payment, ui)'
        }
      ]
    },
    {
      title: 'Reporter Information',
      description: 'Information about the person reporting the issue',
      fields: [
        {
          name: 'reporter_name',
          label: 'Reporter Name',
          type: 'text',
          placeholder: 'Name of the person reporting',
          required: true,
          maxLength: 100
        },
        {
          name: 'reporter_email',
          label: 'Reporter Email',
          type: 'email',
          placeholder: 'reporter@example.com',
          required: true
        },
        {
          name: 'page_url',
          label: 'Page URL',
          type: 'url',
          placeholder: 'https://example.com/page-where-issue-occurred'
        },
        {
          name: 'casino_id',
          label: 'Related Casino',
          type: 'select',
          options: casinos.map(casino => ({
            label: casino.name,
            value: casino.id
          }))
        },
        {
          name: 'source',
          label: 'Report Source',
          type: 'select',
          required: true,
          options: [
            { label: 'Website Form', value: 'website' },
            { label: 'Email', value: 'email' },
            { label: 'Phone Call', value: 'phone' },
            { label: 'Live Chat', value: 'chat' },
            { label: 'Social Media', value: 'social' },
            { label: 'Internal Report', value: 'internal' }
          ],
          defaultValue: 'website'
        }
      ]
    },
    {
      title: 'Technical Details',
      description: 'Technical information for bug reports and issues',
      collapsible: true,
      fields: [
        {
          name: 'reproducible',
          label: 'Reproducible',
          type: 'switch',
          placeholder: 'Can this issue be reproduced consistently?'
        },
        {
          name: 'steps_to_reproduce',
          label: 'Steps to Reproduce',
          type: 'textarea',
          placeholder: '1. Go to...\n2. Click on...\n3. See error...',
          rows: 4,
          maxLength: 2000,
          conditional: (values: any) => values.reproducible
        },
        {
          name: 'expected_behavior',
          label: 'Expected Behavior',
          type: 'textarea',
          placeholder: 'What should have happened?',
          rows: 2,
          maxLength: 1000
        },
        {
          name: 'actual_behavior',
          label: 'Actual Behavior',
          type: 'textarea',
          placeholder: 'What actually happened?',
          rows: 2,
          maxLength: 1000
        },
        {
          name: 'browser_info',
          label: 'Browser Information',
          type: 'text',
          placeholder: 'Chrome 120.0, Firefox 121.0, Safari 17.0, etc.',
          maxLength: 200
        },
        {
          name: 'device_info',
          label: 'Device Information',
          type: 'text',
          placeholder: 'Windows 11, macOS 14, iPhone 15, Android 14, etc.',
          maxLength: 200
        }
      ]
    },
    {
      title: 'Assignment & Status',
      description: 'Report assignment and status management',
      fields: [
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { label: 'Open', value: 'open' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Resolved', value: 'resolved' },
            { label: 'Closed', value: 'closed' },
            { label: 'Rejected', value: 'rejected' }
          ],
          defaultValue: 'open'
        },
        {
          name: 'assigned_to',
          label: 'Assigned To',
          type: 'select',
          options: admins.map(admin => ({
            label: `${admin.name} (${admin.role})`,
            value: admin.id
          }))
        },
        {
          name: 'resolution_notes',
          label: 'Resolution Notes',
          type: 'textarea',
          placeholder: 'Notes about how this issue was resolved...',
          rows: 3,
          maxLength: 2000,
          conditional: (values: any) => ['resolved', 'closed'].includes(values.status)
        },
        {
          name: 'follow_up_required',
          label: 'Follow-up Required',
          type: 'switch',
          placeholder: 'Does this report require follow-up?'
        },
        {
          name: 'follow_up_date',
          label: 'Follow-up Date',
          type: 'date',
          conditional: (values: any) => values.follow_up_required
        },
        {
          name: 'escalated',
          label: 'Escalated',
          type: 'switch',
          placeholder: 'Has this report been escalated?'
        },
        {
          name: 'escalated_to',
          label: 'Escalated To',
          type: 'text',
          placeholder: 'Name or department escalated to',
          conditional: (values: any) => values.escalated
        }
      ]
    },
    {
      title: 'Internal Notes & Response',
      description: 'Internal notes and public response',
      collapsible: true,
      fields: [
        {
          name: 'internal_notes',
          label: 'Internal Notes',
          type: 'textarea',
          placeholder: 'Internal notes for team members...',
          rows: 3,
          maxLength: 2000
        },
        {
          name: 'public_response',
          label: 'Public Response',
          type: 'textarea',
          placeholder: 'Response to send to the reporter...',
          rows: 3,
          maxLength: 1000
        }
      ]
    }
  ]

  // Table columns configuration
  const columns: DataTableColumn<Report>[] = [
    {
      key: 'title',
      label: 'Report Title',
      sortable: true,
      searchable: true,
      render: (value, item) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white truncate">{value}</span>
            {item.escalated && <Flag className="w-4 h-4 text-red-400" />}
          </div>
          <div className="text-xs text-white/60">
            #{item.id.slice(0, 8)}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => {
        const categoryColors = {
          bug: 'bg-red-500/20 text-red-300',
          feature_request: 'bg-blue-500/20 text-blue-300',
          complaint: 'bg-orange-500/20 text-orange-300',
          suggestion: 'bg-green-500/20 text-green-300',
          security: 'bg-purple-500/20 text-purple-300',
          content: 'bg-yellow-500/20 text-yellow-300',
          payment: 'bg-pink-500/20 text-pink-300',
          technical: 'bg-gray-500/20 text-gray-300',
          other: 'bg-indigo-500/20 text-indigo-300'
        }
        return (
          <Badge className={categoryColors[value as keyof typeof categoryColors] || 'bg-gray-500/20 text-gray-300'}>
            {value.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </Badge>
        )
      }
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value) => {
        const priorityColors = {
          low: 'bg-green-500/20 text-green-300',
          medium: 'bg-yellow-500/20 text-yellow-300',
          high: 'bg-orange-500/20 text-orange-300',
          critical: 'bg-red-500/20 text-red-300'
        }
        const priorityIcons = {
          low: CheckCircle,
          medium: Clock,
          high: AlertTriangle,
          critical: XCircle
        }
        const Icon = priorityIcons[value as keyof typeof priorityIcons]
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <Badge className={priorityColors[value as keyof typeof priorityColors] || 'bg-gray-500/20 text-gray-300'}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Badge>
          </div>
        )
      },
      align: 'center'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors = {
          open: 'bg-blue-500/20 text-blue-300',
          in_progress: 'bg-yellow-500/20 text-yellow-300',
          resolved: 'bg-green-500/20 text-green-300',
          closed: 'bg-gray-500/20 text-gray-300',
          rejected: 'bg-red-500/20 text-red-300'
        }
        const statusIcons = {
          open: FileText,
          in_progress: Clock,
          resolved: CheckCircle,
          closed: Archive,
          rejected: XCircle
        }
        const Icon = statusIcons[value as keyof typeof statusIcons]
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-300'}>
              {value.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Badge>
          </div>
        )
      },
      align: 'center'
    },
    {
      key: 'reporter_name',
      label: 'Reporter',
      sortable: true,
      searchable: true,
      render: (value, item) => (
        <div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-white/60" />
            <span className="font-medium text-white">{value}</span>
          </div>
          <div className="text-xs text-white/60 mt-1">{item.reporter_email}</div>
        </div>
      )
    },
    {
      key: 'assigned_admin_name',
      label: 'Assigned To',
      render: (value) => (
        <div className="text-white">
          {value || <span className="text-white/60 italic">Unassigned</span>}
        </div>
      )
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (value) => {
        const severityColors = {
          minor: 'bg-green-500/20 text-green-300',
          moderate: 'bg-yellow-500/20 text-yellow-300',
          major: 'bg-orange-500/20 text-orange-300',
          critical: 'bg-red-500/20 text-red-300'
        }
        return (
          <Badge className={severityColors[value as keyof typeof severityColors] || 'bg-gray-500/20 text-gray-300'}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        )
      }
    },
    {
      key: 'source',
      label: 'Source',
      render: (value) => (
        <Badge variant="outline" className="bg-white/10 border-white/20 text-white capitalize">
          {value}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="text-white/80 text-sm">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    }
  ]

  const handleCreate = () => {
    setEditingReport(null)
    setShowForm(true)
  }

  const handleEdit = (report: Report) => {
    setEditingReport(report)
    setShowForm(true)
  }

  const handleView = (report: Report) => {
    setViewingReport(report)
  }

  const handleFormSubmit = async (data: ReportFormData) => {
    // Calculate resolution time if resolving
    let resolutionTime: number | undefined
    if (data.status === 'resolved' && editingReport && editingReport.status !== 'resolved') {
      const createdAt = new Date(editingReport.created_at)
      const now = new Date()
      resolutionTime = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)) // hours
    }

    // Prepare report data
    const reportData = {
      ...data,
      resolution_time: resolutionTime,
      resolved_at: data.status === 'resolved' ? new Date().toISOString() : undefined,
      closed_at: data.status === 'closed' ? new Date().toISOString() : undefined,
      escalated_at: data.escalated && !editingReport?.escalated ? new Date().toISOString() : editingReport?.escalated_at
    }

    if (editingReport) {
      await crudActions.updateItem(editingReport.id, reportData)
    } else {
      await crudActions.createItem(reportData)
    }
    setShowForm(false)
    setEditingReport(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingReport(null)
  }

  const handleAssign = async (report: Report, adminId: string) => {
    const admin = admins.find(a => a.id === adminId)
    await crudActions.updateItem(report.id, {
      assigned_to: adminId,
      assigned_admin_name: admin?.name,
      status: report.status === 'open' ? 'in_progress' : report.status
    })
    toast.success(`Report assigned to ${admin?.name}`)
  }

  const handleResolve = async (report: Report) => {
    const createdAt = new Date(report.created_at)
    const now = new Date()
    const resolutionTime = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
    
    await crudActions.updateItem(report.id, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_time: resolutionTime
    })
    toast.success('Report marked as resolved')
  }

  const handleClose = async (report: Report) => {
    await crudActions.updateItem(report.id, {
      status: 'closed',
      closed_at: new Date().toISOString()
    })
    toast.success('Report closed')
  }

  const handleEscalate = async (report: Report) => {
    await crudActions.updateItem(report.id, {
      escalated: true,
      escalated_at: new Date().toISOString(),
      priority: report.priority === 'low' ? 'medium' : report.priority === 'medium' ? 'high' : 'critical'
    })
    toast.success('Report escalated')
  }

  const itemActions: DataTableAction<Report>[] = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: handleView
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEdit,
      show: () => adminAuth.hasPermission('reports.update')
    },
    {
      label: 'Resolve',
      icon: CheckCircle,
      onClick: handleResolve,
      show: (item) => adminAuth.hasPermission('reports.update') && !['resolved', 'closed'].includes(item.status)
    },
    {
      label: 'Close',
      icon: Archive,
      onClick: handleClose,
      show: (item) => adminAuth.hasPermission('reports.update') && item.status !== 'closed'
    },
    {
      label: 'Escalate',
      icon: Flag,
      onClick: handleEscalate,
      show: (item) => adminAuth.hasPermission('reports.update') && !item.escalated
    }
  ]

  const filters = (
    <>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-black/90 border-white/20 backdrop-blur-xl">
          <SelectItem value="all" className="text-white hover:bg-white/20">All Status</SelectItem>
          <SelectItem value="open" className="text-white hover:bg-white/20">Open</SelectItem>
          <SelectItem value="in_progress" className="text-white hover:bg-white/20">In Progress</SelectItem>
          <SelectItem value="resolved" className="text-white hover:bg-white/20">Resolved</SelectItem>
          <SelectItem value="closed" className="text-white hover:bg-white/20">Closed</SelectItem>
          <SelectItem value="rejected" className="text-white hover:bg-white/20">Rejected</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-36 bg-white/10 border-white/20 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-black/90 border-white/20 backdrop-blur-xl">
          <SelectItem value="all" className="text-white hover:bg-white/20">All Categories</SelectItem>
          <SelectItem value="bug" className="text-white hover:bg-white/20">Bug Report</SelectItem>
          <SelectItem value="feature_request" className="text-white hover:bg-white/20">Feature Request</SelectItem>
          <SelectItem value="complaint" className="text-white hover:bg-white/20">Complaint</SelectItem>
          <SelectItem value="suggestion" className="text-white hover:bg-white/20">Suggestion</SelectItem>
          <SelectItem value="security" className="text-white hover:bg-white/20">Security</SelectItem>
          <SelectItem value="content" className="text-white hover:bg-white/20">Content</SelectItem>
          <SelectItem value="payment" className="text-white hover:bg-white/20">Payment</SelectItem>
          <SelectItem value="technical" className="text-white hover:bg-white/20">Technical</SelectItem>
          <SelectItem value="other" className="text-white hover:bg-white/20">Other</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
        <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-black/90 border-white/20 backdrop-blur-xl">
          <SelectItem value="all" className="text-white hover:bg-white/20">All Priority</SelectItem>
          <SelectItem value="low" className="text-white hover:bg-white/20">Low</SelectItem>
          <SelectItem value="medium" className="text-white hover:bg-white/20">Medium</SelectItem>
          <SelectItem value="high" className="text-white hover:bg-white/20">High</SelectItem>
          <SelectItem value="critical" className="text-white hover:bg-white/20">Critical</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={severityFilter} onValueChange={setSeverityFilter}>
        <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-black/90 border-white/20 backdrop-blur-xl">
          <SelectItem value="all" className="text-white hover:bg-white/20">All Severity</SelectItem>
          <SelectItem value="minor" className="text-white hover:bg-white/20">Minor</SelectItem>
          <SelectItem value="moderate" className="text-white hover:bg-white/20">Moderate</SelectItem>
          <SelectItem value="major" className="text-white hover:bg-white/20">Major</SelectItem>
          <SelectItem value="critical" className="text-white hover:bg-white/20">Critical</SelectItem>
        </SelectContent>
      </Select>
    </>
  )

  return (
    <ProtectedRoute requiredPermissions={['reports.read']}>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        {!showForm ? (
          <DataTable
            title="Report Management"
            description="Manage user reports, bug reports, and feedback"
            columns={columns}
            state={crudState}
            actions={crudActions}
            itemActions={itemActions}
            onCreateNew={adminAuth.hasPermission('reports.create') ? handleCreate : undefined}
            filters={filters}
            emptyMessage="No reports found"
            emptyDescription="Start by creating your first report or wait for user submissions."
          />
        ) : (
          <FormBuilder
            title={editingReport ? 'Edit Report' : 'Create New Report'}
            description={editingReport ? 'Update report information and status' : 'Create a new report or issue'}
            sections={formSections}
            schema={reportSchema as any}
            defaultValues={editingReport ? {
              ...editingReport,
              tags: editingReport.tags || []
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            mode={editingReport ? 'edit' : 'create'}
            loading={crudState.loading}
          />
        )}

        {/* Report Details Modal */}
        <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/90 border-white/20 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  <div>
                    <div className="flex items-center gap-2">
                      {viewingReport?.title}
                      {viewingReport?.escalated && <Flag className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="text-sm text-white/60 font-normal">
                      Report #{viewingReport?.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {viewingReport && (
              <div className="space-y-6">
                {/* Report Overview */}
                <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Report Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Category:</span>
                        <div className="mt-1">
                          <Badge className={{
                            bug: 'bg-red-500/20 text-red-300',
                            feature_request: 'bg-blue-500/20 text-blue-300',
                            complaint: 'bg-orange-500/20 text-orange-300',
                            suggestion: 'bg-green-500/20 text-green-300',
                            security: 'bg-purple-500/20 text-purple-300',
                            content: 'bg-yellow-500/20 text-yellow-300',
                            payment: 'bg-pink-500/20 text-pink-300',
                            technical: 'bg-gray-500/20 text-gray-300',
                            other: 'bg-indigo-500/20 text-indigo-300'
                          }[viewingReport.category] || 'bg-gray-500/20 text-gray-300'}>
                            {viewingReport.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Priority:</span>
                        <div className="mt-1">
                          <Badge className={{
                            low: 'bg-green-500/20 text-green-300',
                            medium: 'bg-yellow-500/20 text-yellow-300',
                            high: 'bg-orange-500/20 text-orange-300',
                            critical: 'bg-red-500/20 text-red-300'
                          }[viewingReport.priority] || 'bg-gray-500/20 text-gray-300'}>
                            {viewingReport.priority.charAt(0).toUpperCase() + viewingReport.priority.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Status:</span>
                        <div className="mt-1">
                          <Badge className={{
                            open: 'bg-blue-500/20 text-blue-300',
                            in_progress: 'bg-yellow-500/20 text-yellow-300',
                            resolved: 'bg-green-500/20 text-green-300',
                            closed: 'bg-gray-500/20 text-gray-300',
                            rejected: 'bg-red-500/20 text-red-300'
                          }[viewingReport.status] || 'bg-gray-500/20 text-gray-300'}>
                            {viewingReport.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Severity:</span>
                        <div className="mt-1">
                          <Badge className={{
                            minor: 'bg-green-500/20 text-green-300',
                            moderate: 'bg-yellow-500/20 text-yellow-300',
                            major: 'bg-orange-500/20 text-orange-300',
                            critical: 'bg-red-500/20 text-red-300'
                          }[viewingReport.severity] || 'bg-gray-500/20 text-gray-300'}>
                            {viewingReport.severity.charAt(0).toUpperCase() + viewingReport.severity.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Reporter:</span>
                        <p className="text-white mt-1">{viewingReport.reporter_name}</p>
                        <p className="text-white/60 text-xs">{viewingReport.reporter_email}</p>
                      </div>
                      <div>
                        <span className="text-white/60">Source:</span>
                        <p className="text-white mt-1 capitalize">{viewingReport.source}</p>
                      </div>
                    </div>
                    
                    {viewingReport.tags && viewingReport.tags.length > 0 && (
                      <div className="mt-4">
                        <span className="text-white/60">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {viewingReport.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-500/20 border-blue-500/40 text-blue-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                    <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{viewingReport.description}</p>
                  </CardContent>
                </Card>

                {/* Technical Details */}
                {['bug', 'technical'].includes(viewingReport.category) && (
                  <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Technical Details</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Reproducible:</span>
                            <p className={`mt-1 ${viewingReport.reproducible ? 'text-green-400' : 'text-red-400'}`}>
                              {viewingReport.reproducible ? '✓ Yes' : '✗ No'}
                            </p>
                          </div>
                          {viewingReport.browser_info && (
                            <div>
                              <span className="text-white/60">Browser:</span>
                              <p className="text-white mt-1">{viewingReport.browser_info}</p>
                            </div>
                          )}
                          {viewingReport.device_info && (
                            <div>
                              <span className="text-white/60">Device:</span>
                              <p className="text-white mt-1">{viewingReport.device_info}</p>
                            </div>
                          )}
                          {viewingReport.page_url && (
                            <div>
                              <span className="text-white/60">Page URL:</span>
                              <p className="text-white mt-1 break-all">{viewingReport.page_url}</p>
                            </div>
                          )}
                        </div>
                        
                        {viewingReport.steps_to_reproduce && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Steps to Reproduce:</h4>
                            <p className="text-white/90 whitespace-pre-wrap">{viewingReport.steps_to_reproduce}</p>
                          </div>
                        )}
                        
                        {viewingReport.expected_behavior && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Expected Behavior:</h4>
                            <p className="text-white/90">{viewingReport.expected_behavior}</p>
                          </div>
                        )}
                        
                        {viewingReport.actual_behavior && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Actual Behavior:</h4>
                            <p className="text-white/90">{viewingReport.actual_behavior}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assignment & Resolution */}
                <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Assignment & Resolution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Assigned To:</span>
                        <p className="text-white mt-1">{viewingReport.assigned_admin_name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <span className="text-white/60">Created:</span>
                        <p className="text-white mt-1">{new Date(viewingReport.created_at).toLocaleString()}</p>
                      </div>
                      {viewingReport.resolved_at && (
                        <div>
                          <span className="text-white/60">Resolved:</span>
                          <p className="text-white mt-1">{new Date(viewingReport.resolved_at).toLocaleString()}</p>
                        </div>
                      )}
                      {viewingReport.resolution_time && (
                        <div>
                          <span className="text-white/60">Resolution Time:</span>
                          <p className="text-white mt-1">{viewingReport.resolution_time} hours</p>
                        </div>
                      )}
                      {viewingReport.follow_up_required && (
                        <div>
                          <span className="text-white/60">Follow-up Required:</span>
                          <p className="text-green-400 mt-1">✓ Yes</p>
                          {viewingReport.follow_up_date && (
                            <p className="text-white/60 text-xs mt-1">
                              Due: {new Date(viewingReport.follow_up_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      {viewingReport.escalated && (
                        <div>
                          <span className="text-white/60">Escalated:</span>
                          <p className="text-red-400 mt-1">✓ Yes</p>
                          {viewingReport.escalated_to && (
                            <p className="text-white/60 text-xs mt-1">To: {viewingReport.escalated_to}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {viewingReport.resolution_notes && (
                      <div className="mt-4">
                        <h4 className="text-white font-medium mb-2">Resolution Notes:</h4>
                        <p className="text-white/90 whitespace-pre-wrap">{viewingReport.resolution_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes & Response */}
                {(viewingReport.internal_notes || viewingReport.public_response) && (
                  <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Notes & Response</h3>
                      <div className="space-y-4">
                        {viewingReport.internal_notes && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Internal Notes:</h4>
                            <p className="text-white/90 whitespace-pre-wrap">{viewingReport.internal_notes}</p>
                          </div>
                        )}
                        
                        {viewingReport.public_response && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Public Response:</h4>
                            <p className="text-white/90 whitespace-pre-wrap">{viewingReport.public_response}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}