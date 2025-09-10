import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function generateUuid(): string {
  // RFC4122 v4-ish generator (sufficient for health-check dummy row)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

async function requireContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: au } = await supabase
      .from("admin_users")
      .select("role,is_active")
      .eq("user_id", user.id)
      .single()
    isAdmin = !!au && au.is_active && ["admin", "super_admin"].includes(au.role as any)
  }
  return { supabase, user, isAdmin }
}

export async function GET() {
  try {
    const { supabase, isAdmin } = await requireContext()

    // 1) Public view select
    const pubView = await supabase.from("public_reports_view").select("id").limit(1)
    const viewOk = !pubView.error

    // 2) page_sections public read
    const ps = await supabase
      .from("page_sections")
      .select("id")
      .eq("is_active", true)
      .eq("page_name", "reports")
      .limit(1)
    const pageSectionsOk = !ps.error

    // 3) resolved_at present for terminal statuses
    const term = await supabase
      .from("reports")
      .select("id")
      .in("status", ["resolved", "dismissed"]) as any
    let terminalResolvedOk = true
    if (!term.error) {
      const check = await supabase
        .from("reports")
        .select("id")
        .in("status", ["resolved", "dismissed"]) 
        .is("resolved_at", null)
        .limit(1)
      terminalResolvedOk = !check.data || check.data.length === 0
    }

    // 4) admin insert policy (only when admin session exists)
    let adminInsertOk: boolean | null = null
    let adminInsertError: string | null = null
    if (isAdmin) {
      const dummy = {
        title: "HEALTHCHECK",
        description: "healthcheck",
        reporter_id: null,
        reported_content_type: "other",
        reported_content_id: generateUuid(),
        reason: "healthcheck",
        priority: "low" as const,
        status: "pending" as const,
      }
      const { data: ins, error: insErr } = await supabase.from("reports").insert([dummy]).select("id").single()
      if (insErr) {
        adminInsertOk = false
        adminInsertError = insErr.message
      } else {
        adminInsertOk = true
        await supabase.from("reports").delete().eq("id", ins.id)
      }
    }

    return NextResponse.json({
      success: true,
      checks: {
        publicViewSelect: viewOk,
        pageSectionsSelect: pageSectionsOk,
        terminalResolvedHasTimestamp: terminalResolvedOk,
        adminInsertOk,
        adminInsertError,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Unknown error" }, { status: 500 })
  }
}


