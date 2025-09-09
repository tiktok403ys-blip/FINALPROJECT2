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

export async function GET() {
  try {
    const supabase = await requireAdmin()

    const { data, error } = await supabase
      .from("reports_list_public")
      .select("id, casino_name, status, created_at, updated_at")
      .order("updated_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (e: any) {
    const msg = e?.message || "Unknown error"
    const status = msg === "Unauthorized" ? 401 : msg === "Insufficient permissions" ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await requireAdmin()
    const body = await req.json()

    const casino_name_raw = String(body?.casino_name ?? "").trim()
    const status_raw = String(body?.status ?? "suspicious").trim().toLowerCase()

    if (!casino_name_raw) {
      return NextResponse.json({ success: false, error: "Casino name is required" }, { status: 400 })
    }

    const allowed: Array<"scam" | "suspicious"> = ["scam", "suspicious"]
    if (!allowed.includes(status_raw as any)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    const insertPayload = {
      casino_name: sanitizeHtml(casino_name_raw),
      status: status_raw as "scam" | "suspicious",
    }

    const { data, error } = await supabase
      .from("reports_list_public")
      .insert([insertPayload])
      .select("id, casino_name, status, created_at, updated_at")
      .single()

    if (error) throw error

    try {
      revalidatePath("/reports/list")
      revalidatePath("/admin/reports/list")
    } catch {}

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    const msg = e?.message || "Unknown error"
    const status = msg === "Unauthorized" ? 401 : msg === "Insufficient permissions" ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}


