import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
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
    if (/(\d)\1{3,}/.test(pin)) {
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

    // Create admin session token for PIN verification window (optional UX)
    const adminToken = await new SignJWT({
      verified: true,
      type: 'admin',
      userId: userId,
      timestamp: Date.now()
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Set cookie with consistent name (underscore)
    const response = NextResponse.json({
      success: true,
      message: 'Admin PIN set successfully and stored permanently'
    })

    response.cookies.set('admin_pin_verified', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Admin PIN setting error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set admin PIN' },
      { status: 500 }
    )
  }
}
