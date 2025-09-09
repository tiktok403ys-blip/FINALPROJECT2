import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await requireAdmin()
    const { id } = await context.params

    const { error } = await supabase
      .from("reports_list_public")
      .delete()
      .eq("id", id)

    if (error) throw error

    try {
      revalidatePath("/reports/list")
      revalidatePath("/admin/reports/list")
    } catch {}

    return NextResponse.json({ success: true })
  } catch (e: any) {
    const msg = e?.message || "Unknown error"
    const status = msg === "Unauthorized" ? 401 : msg === "Insufficient permissions" ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}


