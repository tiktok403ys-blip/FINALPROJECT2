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


