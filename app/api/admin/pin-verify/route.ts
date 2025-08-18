import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdminAuth } from '@/lib/auth/admin-middleware'
import { createHash, randomBytes } from 'crypto'

const PIN_SECRET = process.env.JWT_SECRET || 'your-secret-key'
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

    // Call the verify_admin_pin function with user ID
    const { data, error } = await authResult.supabase.rpc('verify_admin_pin', {
      input_pin: pin
    })

    if (error) {
      console.error('PIN verification error:', error)
      return NextResponse.json(
        { error: 'PIN verification failed' },
        { status: 500 }
      )
    }

    if (!data) {
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

    // Create secure token for PIN verification
    const tokenData = {
      userId: authResult.user.id,
      email: authResult.user.email,
      pinVerified: true,
      exp: Date.now() + PIN_TOKEN_EXPIRY
    }
    
    const tokenString = JSON.stringify(tokenData)
    const signature = createHash('sha256')
      .update(tokenString + PIN_SECRET)
      .digest('hex')
    
    const pinToken = Buffer.from(tokenString + '.' + signature).toString('base64')

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