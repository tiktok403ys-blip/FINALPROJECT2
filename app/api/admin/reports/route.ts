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

export async function POST(req: Request) {
  try {
    const supabase = await requireAdmin()
    const body = await req.json()

    // Current admin user (for audit trail)
    const { data: { user } } = await supabase.auth.getUser()

    // Normalize IDs; auto-generate where appropriate to reduce friction
    const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v))
    const reporterId = user?.id ?? (isUuid(body?.reporter_id) ? String(body.reporter_id) : null)
    const reportedContentId = isUuid(body?.reported_content_id)
      ? String(body.reported_content_id)
      : (globalThis.crypto?.randomUUID?.() || `${Date.now()}-0000-4000-8000-000000000000`)

    // Validate (server will auto-fill reporter_id / reported_content_id if absent)
    const required = ["title", "description", "reported_content_type", "reason"]
    for (const k of required) {
      if (!body?.[k] || String(body[k]).trim() === "") {
        return NextResponse.json({ success: false, error: `Missing field: ${k}` }, { status: 400 })
      }
    }

    if (String(body.title).length > 200) {
      return NextResponse.json({ success: false, error: "Title too long (max 200 chars)" }, { status: 400 })
    }
    if (String(body.description).length > 5000) {
      return NextResponse.json({ success: false, error: "Description too long (max 5000 chars)" }, { status: 400 })
    }

    // Map UI statuses to DB baseline if needed (older schema uses reviewing/dismissed)
    const normalizeStatus = (s: any) => {
      const v = String(s ?? "pending").toLowerCase()
      if (v === "investigating") return "reviewing"
      if (v === "closed") return "dismissed"
      return v
    }

    // Minimal, broadly compatible payload (avoid columns that might not exist on some DBs)
    const data: any = {
      title: sanitizeHtml(String(body.title)),
      description: sanitizeHtml(String(body.description)),
      reporter_id: reporterId,
      reported_content_type: sanitizeHtml(String(body.reported_content_type)),
      reported_content_id: reportedContentId,
      reason: sanitizeHtml(String(body.reason)),
      priority: (body.priority ?? "medium") as "low" | "medium" | "high" | "urgent",
      status: normalizeStatus(body.status),
    }

    const { data: inserted, error } = await supabase.from("reports").insert([data]).select().single()
    if (error) {
      console.error("Admin create report error:", error)
      const message =
        (error as any)?.message ||
        (error as any)?.hint ||
        (error as any)?.details ||
        "Failed to create report"
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }

    // Optional analytics (best effort)
    try {
      await supabase.from("analytics_events").insert({
        event_type: "report_created_admin",
        event_data: { report_id: inserted.id, category: inserted.category, priority: inserted.priority },
      })
    } catch {}

    revalidatePath("/admin/reports")
    revalidatePath("/reports")
    return NextResponse.json({ success: true, data: inserted })
  } catch (e: any) {
    const msg = e?.message || "Unknown error"
    const status = msg === "Unauthorized" ? 401 : msg === "Insufficient permissions" ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}

export async function PATCH(req: Request) {
  // Bulk status update: { ids: string[], status: "pending"|"investigating"|"resolved"|"closed" }
  try {
    const supabase = await requireAdmin()
    const body = await req.json()

    const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
    const status = body?.status as "pending" | "investigating" | "resolved" | "closed"

    if (!ids.length) return NextResponse.json({ success: false, error: "No reports selected" }, { status: 400 })
    const allowed = ["pending", "investigating", "resolved", "closed"] as const
    if (!allowed.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    const map = (s: string) => s === "investigating" ? "reviewing" : s === "closed" ? "dismissed" : s
    const dbStatus = map(status)
    const updateFields: any = { status: dbStatus }
    if (dbStatus === "resolved") updateFields.resolved_at = new Date().toISOString()

    const { error } = await supabase.from("reports").update(updateFields).in("id", ids)
    if (error) {
      console.error("Admin bulk update error:", error)
      return NextResponse.json({ success: false, error: "Failed to bulk update reports" }, { status: 500 })
    }

    try {
      await supabase.from("analytics_events").insert({
        event_type: "reports_bulk_updated_admin",
        event_data: { report_ids: ids, status },
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
