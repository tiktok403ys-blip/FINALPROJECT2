import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Prefer session via cookies
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    let userId: string | null = user?.id ?? null

    // Fallback to Bearer token using Supabase getUser
    if (!userId) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: tokenUser } = await supabase.auth.getUser(token)
        userId = tokenUser?.user?.id ?? null
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Ask DB whether admin PIN has been set using unified RPC
    const { data: hasPin, error: pinStatusError } = await supabaseServer.rpc('admin_has_pin_set')

    if (pinStatusError) {
      console.error('Error checking admin PIN status:', pinStatusError)
      return NextResponse.json(
        { success: false, error: 'Failed to check admin PIN status' },
        { status: 500 }
      )
    }

    // Read cookie to determine local verified state (optional)
    const cookieVerified = Boolean(request.cookies.get('admin_pin_verified')?.value)

    return NextResponse.json({
      success: true,
      hasPinSet: Boolean(hasPin),
      verified: cookieVerified
    })
  } catch (error) {
    console.error('Admin PIN status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin PIN status' },
      { status: 500 }
    )
  }
}