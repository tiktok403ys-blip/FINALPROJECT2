"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sanitizeHtml } from "@/lib/utils"

export interface ReportFormData {
  title: string
  description: string
  reporter_id: string
  reported_content_type: string
  reported_content_id: string
  reason: string
  category?: string
  priority: "low" | "medium" | "high" | "urgent"
  amount_disputed?: string
  contact_method: "email" | "phone" | "both"
  casino_name?: string
}

export interface ReportUpdateData {
  id: string
  status?: "pending" | "investigating" | "resolved" | "closed"
  admin_notes?: string
  estimated_resolution_date?: string
  time_limit_hours?: number
}

// CREATE - Submit new report
export async function createReport(formData: ReportFormData) {
  try {
    const supabase = await createClient()

    // Validate required fields
    if (!formData.title || !formData.description || !formData.reporter_id || !formData.reported_content_type || !formData.reported_content_id || !formData.reason) {
      throw new Error("Missing required fields")
    }

    // Basic input constraints
    if (formData.title.length > 200) {
      throw new Error("Title too long (max 200 chars)")
    }
    if (formData.description.length > 5000) {
      throw new Error("Description too long (max 5000 chars)")
    }
    // ✅ FIXED: Remove email validation since user_email is no longer in interface
    // Email validation will be handled by the frontend form

    // Sanitize inputs
    const sanitizedData = {
      title: sanitizeHtml(formData.title),
      description: sanitizeHtml(formData.description),
      reporter_id: formData.reporter_id,
      reported_content_type: sanitizeHtml(formData.reported_content_type),
      reported_content_id: formData.reported_content_id,
      reason: sanitizeHtml(formData.reason),
      category: formData.category ? sanitizeHtml(formData.category) : null,
      priority: formData.priority,
      amount_disputed: formData.amount_disputed ? parseFloat(formData.amount_disputed) : null,
      contact_method: formData.contact_method,
      casino_name: formData.casino_name ? sanitizeHtml(formData.casino_name) : null,
    }

    // Insert report
    const { data, error } = await supabase
      .from("reports")
      .insert([sanitizedData])
      .select()
      .single()

    if (error) {
      console.error("Error creating report:", error)
      throw new Error("Failed to create report")
    }

    // Track analytics (non-blocking)
    try {
      await supabase.from("analytics_events").insert({
        event_type: "report_created",
        event_data: {
          report_id: data.id,
          category: data.category,
          priority: data.priority,
        },
      })
    } catch (e) {
      console.warn("Analytics insert failed (non-blocking)", e)
    }

    revalidatePath("/reports")
    return { success: true, data }
  } catch (error) {
    console.error("Create report error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// READ - Get reports with realtime data
export async function getReports(limit: number = 10) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching reports:", error)
      throw new Error("Failed to fetch reports")
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get reports error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// READ - Get single report
export async function getReport(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching report:", error)
      throw new Error("Failed to fetch report")
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get report error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// READ - Get reports statistics
export async function getReportsStats() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_reports_stats")

    if (error) {
      console.error("Error fetching stats:", error)
      throw new Error("Failed to fetch statistics")
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get stats error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// UPDATE - Update report (admin only)
export async function updateReport(updateData: ReportUpdateData) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Unauthorized")
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userData || !["admin", "super_admin"].includes(userData.role)) {
      throw new Error("Insufficient permissions")
    }

    // Prepare update data
    const updateFields: any = {}
    
    if (updateData.status) {
      updateFields.status = updateData.status
      if (updateData.status === "resolved") {
        updateFields.resolved_at = new Date().toISOString()
      }
    }
    
    if (updateData.admin_notes !== undefined) {
      updateFields.admin_notes = sanitizeHtml(updateData.admin_notes)
    }
    
    if (updateData.estimated_resolution_date) {
      updateFields.estimated_resolution_date = updateData.estimated_resolution_date
    }
    
    if (updateData.time_limit_hours !== undefined) {
      updateFields.time_limit_hours = updateData.time_limit_hours
    }

    // Update report
    const { data, error } = await supabase
      .from("reports")
      .update(updateFields)
      .eq("id", updateData.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating report:", error)
      throw new Error("Failed to update report")
    }

    // Track analytics (non-blocking)
    try {
      await supabase.from("analytics_events").insert({
        event_type: "report_updated",
        event_data: {
          report_id: data.id,
          admin_id: user.id,
          status: data.status,
        },
      })
    } catch (e) {
      console.warn("Analytics insert failed (non-blocking)", e)
    }

    revalidatePath("/admin/reports")
    revalidatePath("/reports")
    return { success: true, data }
  } catch (error) {
    console.error("Update report error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// DELETE - Delete report (admin only)
export async function deleteReport(id: string) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Unauthorized")
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userData || !["admin", "super_admin"].includes(userData.role)) {
      throw new Error("Insufficient permissions")
    }

    // Delete report
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting report:", error)
      throw new Error("Failed to delete report")
    }

    // Track analytics (non-blocking)
    try {
      await supabase.from("analytics_events").insert({
        event_type: "report_deleted",
        event_data: {
          report_id: id,
          admin_id: user.id,
        },
      })
    } catch (e) {
      console.warn("Analytics insert failed (non-blocking)", e)
    }

    revalidatePath("/admin/reports")
    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    console.error("Delete report error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// BULK OPERATIONS
const ALLOWED_STATUSES = ["pending", "investigating", "resolved", "closed"] as const
type AllowedStatus = typeof ALLOWED_STATUSES[number]

export async function bulkUpdateReports(reportIds: string[], status: AllowedStatus) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Unauthorized")
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userData || !["admin", "super_admin"].includes(userData.role)) {
      throw new Error("Insufficient permissions")
    }

    if (!reportIds || reportIds.length === 0) {
      throw new Error("No reports selected")
    }

    // Prepare update data
    const updateFields: any = { status }
    if (status === "resolved") {
      updateFields.resolved_at = new Date().toISOString()
    }

    // Bulk update
    const { error } = await supabase
      .from("reports")
      .update(updateFields)
      .in("id", reportIds)

    if (error) {
      console.error("Error bulk updating reports:", error)
      throw new Error("Failed to bulk update reports")
    }

    // Track analytics (non-blocking)
    try {
      await supabase.from("analytics_events").insert({
        event_type: "reports_bulk_updated",
        event_data: {
          report_ids: reportIds,
          admin_id: user.id,
          status,
        },
      })
    } catch (e) {
      console.warn("Analytics insert failed (non-blocking)", e)
    }

    revalidatePath("/admin/reports")
    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    console.error("Bulk update reports error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
