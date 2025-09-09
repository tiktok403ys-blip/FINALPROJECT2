import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("reports_list_public")
      .select("id, casino_name, status, created_at, updated_at, is_published")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Unknown error" }, { status: 500 })
  }
}


