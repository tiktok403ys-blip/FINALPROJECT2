import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { count, error } = await supabase
      .from("player_reviews")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ count: count ?? 0 }), {
      status: 200,
      headers: { "content-type": "application/json", "Cache-Control": "no-store" },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}

// Removed duplicate implementation below to avoid "Identifier ... already been declared"


