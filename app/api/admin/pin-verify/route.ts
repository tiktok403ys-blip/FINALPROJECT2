import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth } from '@/lib/auth/admin-middleware'
import { SignJWT } from 'jose'

const PIN_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')
const PIN_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour in milliseconds

// Rate limiting for PIN verification attempts
const pinAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      )
    }

    // Validate admin authentication first
    const authResult = await validateAdminAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult // Return the error response directly
    }

    const userId = authResult.user.id
    const now = Date.now()

    // Check rate limiting
    const userAttempts = pinAttempts.get(userId)
    if (userAttempts) {
      if (userAttempts.count >= MAX_ATTEMPTS) {
        const timeSinceLastAttempt = now - userAttempts.lastAttempt
        if (timeSinceLastAttempt < LOCKOUT_DURATION) {
          const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000)
          return NextResponse.json(
            { error: `Too many failed attempts. Try again in ${remainingTime} minutes.` },
            { status: 429 }
          )
        } else {
          // Reset attempts after lockout period
          pinAttempts.delete(userId)
        }
      }
    }

    // Call the verify_admin_pin function
    // Prefer (user_id UUID, pin_text TEXT) signature; fallback to legacy (input_pin TEXT)
    let isValid: boolean | null = null
    let rpcError: any = null
    try {
      const res = await authResult.supabase.rpc('verify_admin_pin', {
        user_id: authResult.user.id,
        pin_text: pin,
      })
      if (res.error) rpcError = res.error
      else if (typeof res.data === 'boolean') isValid = res.data
      else if (Array.isArray(res.data) && res.data.length > 0 && typeof res.data[0]?.is_valid === 'boolean') {
        isValid = res.data[0].is_valid
      }
    } catch (e: any) {
      rpcError = e
    }

    if (isValid === null) {
      // Fallback to legacy signature
      try {
        const res2 = await authResult.supabase.rpc('verify_admin_pin', { input_pin: pin })
        if (res2.error) rpcError = res2.error
        else if (typeof res2.data === 'boolean') isValid = res2.data
        else if (Array.isArray(res2.data) && res2.data.length > 0 && typeof res2.data[0]?.is_valid === 'boolean') {
          isValid = res2.data[0].is_valid
        }
      } catch (e2: any) {
        rpcError = e2
      }
    }

    if (rpcError) {
      console.error('PIN verification error:', rpcError)
      return NextResponse.json(
        { error: 'PIN verification failed' },
        { status: 500 }
      )
    }

    if (!isValid) {
      // Increment failed attempts
      const currentAttempts = pinAttempts.get(userId) || { count: 0, lastAttempt: 0 }
      pinAttempts.set(userId, {
        count: currentAttempts.count + 1,
        lastAttempt: now
      })

      const remainingAttempts = MAX_ATTEMPTS - (currentAttempts.count + 1)
      const errorMessage = remainingAttempts > 0 
        ? `Invalid PIN. ${remainingAttempts} attempts remaining.`
        : 'Invalid PIN. Account temporarily locked.'

      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    // Clear failed attempts on successful verification
    pinAttempts.delete(userId)

    // Create secure JWT token for PIN verification
    const expirationSeconds = Math.floor(PIN_TOKEN_EXPIRY / 1000)
    const pinToken = await new SignJWT({ verified: true, email: authResult.user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(authResult.user.id)
      .setIssuedAt()
      .setExpirationTime(`${expirationSeconds}s`)
      .sign(PIN_SECRET)

    // Set secure cookie
    const response = NextResponse.json(
      { success: true, message: 'PIN verified successfully' },
      { status: 200 }
    )

    response.cookies.set('admin-pin-verified', pinToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    })

    return response

  } catch (error) {
    console.error('PIN verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to verify PIN token from cookie (moved to admin-middleware.ts)
// This function is now available in lib/auth/admin-middleware.ts as validatePinVerification