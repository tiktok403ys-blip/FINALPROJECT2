import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimitMiddleware, rateLimiters, applyRateLimitHeaders } from '@/lib/security/simple-rate-limiter'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function resolveCookieDomain(): string | undefined {
  const explicit = process.env.SITE_COOKIE_DOMAIN || process.env.NEXT_PUBLIC_SITE_COOKIE_DOMAIN
  if (explicit && explicit.trim().length > 0) return explicit.trim()
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_DOMAIN
  }
  return undefined
}

export async function POST(request: NextRequest) {
  try {
    // Apply strict auth rate limiting (IP-based)
    const rl = rateLimitMiddleware(request, rateLimiters.auth)
    if (!rl.allowed) {
      return rl.response as NextResponse
    }
    const body = await request.json()
    const { pin, confirmPin } = body

    // Basic validation
    if (!pin || !confirmPin) {
      return NextResponse.json(
        { success: false, error: 'PIN and confirm PIN are required' },
        { status: 400 }
      )
    }

    if (pin !== confirmPin) {
      return NextResponse.json(
        { success: false, error: 'PINs do not match' },
        { status: 400 }
      )
    }

    if (pin.length < 4 || pin.length > 20) {
      return NextResponse.json(
        { success: false, error: 'PIN must be 4-20 characters' },
        { status: 400 }
      )
    }

    // Check for sequential numbers
    if (/1234|4321|5678|8765|9876|6789/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'Avoid sequential numbers' },
        { status: 400 }
      )
    }

    // Check for repeated digits
    if(/(\d)\1{3,}/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'Avoid repeated digits' },
        { status: 400 }
      )
    }

    // First, try to get user from server-side Supabase session (cookies)
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    let userId: string | null = user?.id ?? null

    // Fallback: if no session user, try Bearer token with Supabase getUser
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

    // Store PIN in database using RPC function (hashing happens in DB)
    const { data: rpcData, error: rpcError } = await supabaseServer.rpc('set_admin_pin', {
      new_pin: pin
    })

    if (rpcError || rpcData !== true) {
      console.error('Failed to store PIN via RPC set_admin_pin:', rpcError)
      return NextResponse.json(
        { success: false, error: 'Failed to store PIN in database' },
        { status: 500 }
      )
    }

    // Do NOT auto-verify PIN with long-lived cookie; require separate pin-verify step
    const response = NextResponse.json({
      success: true,
      message: 'Admin PIN set successfully. Please verify your PIN to continue.'
    })

    // Apply rate limit headers
    return applyRateLimitHeaders(response, rl)

  } catch (error) {
    console.error('Admin PIN setting error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set admin PIN' },
      { status: 500 }
    )
  }
}
