import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sanitizeHtml } from "@/lib/utils"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  const { data: userData } = await supabase
    .from("admin_users")
    .select("role, is_active")
    .eq("user_id", user.id)
    .single()
  if (!userData || !userData.is_active || !["admin", "super_admin"].includes(userData.role)) {
    throw new Error("Insufficient permissions")
  }
  return supabase
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await requireAdmin()
    const { id } = await context.params
    const body = await req.json()

    const updateFields: any = {}

    if (body.status) {
      const allowed = ["pending", "investigating", "resolved", "closed"] as const
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
      }
      updateFields.status = body.status
      if (body.status === "resolved") updateFields.resolved_at = new Date().toISOString()
    }

    if (body.admin_notes !== undefined) updateFields.admin_notes = sanitizeHtml(String(body.admin_notes))
    if (body.estimated_resolution_date) updateFields.estimated_resolution_date = String(body.estimated_resolution_date)
    if (body.time_limit_hours !== undefined) updateFields.time_limit_hours = Number(body.time_limit_hours)

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase.from("reports").update(updateFields).eq("id", id).select().single()
    if (error) {
      console.error("Admin update report error:", error)
      return NextResponse.json({ success: false, error: "Failed to update report" }, { status: 500 })
    }

    try {
      await supabase.from("analytics_events").insert({
        event_type: "report_updated_admin",
        event_data: { report_id: id, status: data.status },
      })
    } catch {}

    revalidatePath("/admin/reports")
    revalidatePath("/reports")
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    const msg = e?.message || "Unknown error"
    const status = msg === "Unauthorized" ? 401 : msg === "Insufficient permissions" ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await requireAdmin()
    const { id } = await context.params

    const { error } = await supabase.from("reports").delete().eq("id", id)
    if (error) {
      console.error("Admin delete report error:", error)
      return NextResponse.json({ success: false, error: "Failed to delete report" }, { status: 500 })
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from("analytics_events").insert({
        event_type: "report_deleted_admin",
        event_data: { report_id: id, admin_id: user?.id },
      })
    } catch {}

    revalidatePath("/admin/reports")
    revalidatePath("/reports")
    return NextResponse.json({ success: true })
  } catch (e: any) {
    const msg = e?.message || "Unknown error"
    const status = msg === "Unauthorized" ? 401 : msg === "Insufficient permissions" ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}
