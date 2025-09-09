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

    // Validate UUIDs and normalize IDs
    const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    if (!isUuid(String(body.reported_content_id))) {
      return NextResponse.json({ success: false, error: "reported_content_id must be a valid UUID" }, { status: 400 })
    }
    const reporterInput = String(body.reporter_id || "").trim()
    const reporterId = isUuid(reporterInput) ? reporterInput : (user?.id ?? reporterInput)

    // Validate
    const required = ["title", "description", "reporter_id", "reported_content_type", "reported_content_id", "reason"]
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

    const data = {
      title: sanitizeHtml(String(body.title)),
      description: sanitizeHtml(String(body.description)),
      reporter_id: reporterId,
      reported_content_type: sanitizeHtml(String(body.reported_content_type)),
      reported_content_id: String(body.reported_content_id),
      reason: sanitizeHtml(String(body.reason)),
      category: body.category ? sanitizeHtml(String(body.category)) : null,
      priority: (body.priority ?? "medium") as "low" | "medium" | "high" | "urgent",
      amount_disputed: body.amount_disputed !== undefined && body.amount_disputed !== null && String(body.amount_disputed) !== ""
        ? Number(body.amount_disputed)
        : null,
      contact_method: (body.contact_method ?? "email") as "email" | "phone" | "both",
      casino_name: body.casino_name ? sanitizeHtml(String(body.casino_name)) : null,
      status: (body.status ?? "pending") as "pending" | "investigating" | "resolved" | "closed",
      admin_id: user?.id ?? null,
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

    const updateFields: any = { status }
    if (status === "resolved") updateFields.resolved_at = new Date().toISOString()

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
