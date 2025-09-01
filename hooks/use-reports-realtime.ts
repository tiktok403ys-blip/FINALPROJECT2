"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"

export interface Report {
  id: string
  title: string
  description: string
  casino_name: string | null
  user_email: string
  category: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "investigating" | "resolved" | "closed"
  amount_disputed: number | null
  contact_method: "email" | "phone" | "both"
  created_at: string
  updated_at: string
  resolved_at: string | null
  admin_notes: string | null
  admin_id: string | null
  estimated_resolution_date: string | null
  time_limit_hours: number
  timeElapsed?: {
    days: number
    hours: number
    minutes: number
    seconds: number
  }
  statusDisplay?: string
  submittedDate?: string
}

export interface ReportStats {
  total: number
  resolved: number
  active: number
  success_rate: number
}

export function useReportsRealtime(limit: number = 10) {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    resolved: 0,
    active: 0,
    success_rate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const supabase = createClient()

  // Calculate time elapsed for a report
  const calculateTimeElapsed = useCallback((createdAt: string, resolvedAt?: string | null) => {
    const created = new Date(createdAt)
    const endTime = resolvedAt ? new Date(resolvedAt) : new Date()
    const diffMs = endTime.getTime() - created.getTime()
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
    
    return { days, hours, minutes, seconds }
  }, [])

  // Get status display text
  const getStatusDisplay = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for review'
      case 'investigating': return 'Under investigation'
      case 'resolved': return 'Successfully resolved'
      case 'closed': return 'Case closed'
      default: return status
    }
  }, [])

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }, [])

  // Process reports data with calculated fields
  const processReportsData = useCallback((reportsData: any[]): Report[] => {
    return reportsData.map(report => ({
      ...report,
      timeElapsed: calculateTimeElapsed(report.created_at, report.resolved_at),
      statusDisplay: getStatusDisplay(report.status),
      submittedDate: formatDate(report.created_at)
    }))
  }, [calculateTimeElapsed, getStatusDisplay, formatDate])

  // Fetch reports from database
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      const processedReports = processReportsData(data || [])
      setReports(processedReports)
    } catch (err) {
      console.error("Error fetching reports:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch reports")
    } finally {
      setLoading(false)
    }
  }, [supabase, limit, processReportsData])

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_reports_stats")

      if (error) {
        throw error
      }

      setStats(data)
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }, [supabase])

  // Update timers every second for active reports
  useEffect(() => {
    const timer = setInterval(() => {
      setReports(prevReports => 
        prevReports.map(report => ({
          ...report,
          timeElapsed: calculateTimeElapsed(report.created_at, report.resolved_at)
        }))
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [calculateTimeElapsed])

  // Setup realtime subscription
  useEffect(() => {
    // Fetch initial data
    fetchReports()
    fetchStats()

    // Setup realtime subscription
    const newChannel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        async (payload: any) => {
          console.log('Reports realtime change:', payload)
          
          // Refresh data when reports change
          await fetchReports()
          await fetchStats()
        }
      )
      .subscribe()

    setChannel(newChannel)

    // Cleanup function
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel)
      }
    }
  }, [fetchReports, fetchStats, supabase])

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchReports()
    await fetchStats()
  }, [fetchReports, fetchStats])

  // Get reports by status
  const getReportsByStatus = useCallback((status: string) => {
    return reports.filter(report => report.status === status)
  }, [reports])

  // Get reports by category
  const getReportsByCategory = useCallback((category: string) => {
    return reports.filter(report => report.category === category)
  }, [reports])

  // Get urgent reports
  const getUrgentReports = useCallback(() => {
    return reports.filter(report => report.priority === 'urgent')
  }, [reports])

  // Get reports older than X days
  const getOldReports = useCallback((days: number) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return reports.filter(report => new Date(report.created_at) < cutoffDate)
  }, [reports])

  return {
    reports,
    stats,
    loading,
    error,
    refresh,
    getReportsByStatus,
    getReportsByCategory,
    getUrgentReports,
    getOldReports,
  }
}

// Hook for single report
export function useSingleReportRealtime(reportId: string) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const supabase = createClient()

  // Calculate time elapsed
  const calculateTimeElapsed = useCallback((createdAt: string, resolvedAt?: string | null) => {
    const created = new Date(createdAt)
    const endTime = resolvedAt ? new Date(resolvedAt) : new Date()
    const diffMs = endTime.getTime() - created.getTime()
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
    
    return { days, hours, minutes, seconds }
  }, [])

  // Get status display
  const getStatusDisplay = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for review'
      case 'investigating': return 'Under investigation'
      case 'resolved': return 'Successfully resolved'
      case 'closed': return 'Case closed'
      default: return status
    }
  }, [])

  // Fetch single report
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single()

      if (error) {
        throw error
      }

      const processedReport = {
        ...data,
        timeElapsed: calculateTimeElapsed(data.created_at, data.resolved_at),
        statusDisplay: getStatusDisplay(data.status),
        submittedDate: new Date(data.created_at).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }

      setReport(processedReport)
    } catch (err) {
      console.error("Error fetching report:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch report")
    } finally {
      setLoading(false)
    }
  }, [supabase, reportId, calculateTimeElapsed, getStatusDisplay])

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (report) {
        setReport(prev => prev ? {
          ...prev,
          timeElapsed: calculateTimeElapsed(prev.created_at, prev.resolved_at)
        } : null)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [report, calculateTimeElapsed])

  // Setup realtime subscription for single report
  useEffect(() => {
    if (!reportId) return

    fetchReport()

    const newChannel = supabase
      .channel(`report-${reportId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `id=eq.${reportId}`
        },
        async (payload: any) => {
          console.log('Single report realtime change:', payload)
          await fetchReport()
        }
      )
      .subscribe()

    setChannel(newChannel)

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel)
      }
    }
  }, [reportId, fetchReport, supabase])

  return {
    report,
    loading,
    error,
    refresh: fetchReport,
  }
}
