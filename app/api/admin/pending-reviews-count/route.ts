import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth } from '@/lib/auth/admin-middleware'

export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAdminAuth(request, ['read_reviews']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;
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


