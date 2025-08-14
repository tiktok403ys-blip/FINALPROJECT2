import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from("player_reviews")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count ?? 0 }, { headers: { "Cache-Control": "no-store" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from("player_reviews")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false)
    return NextResponse.json({ count: count || 0 })
  } catch (e) {
    return NextResponse.json({ count: 0 })
  }
}


