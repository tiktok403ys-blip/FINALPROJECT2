import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { AdminAuth } from '@/lib/auth/admin-auth'
import { z } from 'zod'

// Request validation schema
const pinVerificationSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'PIN must be exactly 6 digits'),
  sessionToken: z.string().min(1, 'Session token is required')
})

// Rate limiting for PIN attempts
const pinAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_PIN_ATTEMPTS = 3
const PIN_LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes

function checkPinRateLimit(sessionToken: string): boolean {
  const now = Date.now()
  const attempts = pinAttempts.get(sessionToken)
  
  if (!attempts) {
    pinAttempts.set(sessionToken, { count: 1, lastAttempt: now })
    return true
  }
  
  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > PIN_LOCKOUT_DURATION) {
    pinAttempts.set(sessionToken, { count: 1, lastAttempt: now })
    return true
  }
  
  // Check if locked out
  if (attempts.count >= MAX_PIN_ATTEMPTS) {
    return false
  }
  
  // Increment attempts
  attempts.count++
  attempts.lastAttempt = now
  return true
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

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
    // Get client information
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = pinVerificationSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }
    
    const { pin, sessionToken } = validationResult.data
    
    // Check PIN rate limiting
    if (!checkPinRateLimit(sessionToken)) {
      logger.warn(`PIN verification rate limit exceeded for session: ${sessionToken.substring(0, 10)}...`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many PIN attempts. Please try again later.',
          retryAfter: PIN_LOCKOUT_DURATION / 1000
        },
        { status: 429 }
      )
    }
    
    // Check if admin is authenticated
    const adminAuth = AdminAuth.getInstance()
    const { user, profile } = await adminAuth.getCurrentUser()
    
    if (!user || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated'
        },
        { status: 401 }
      )
    }
    
    // Verify PIN against database
    const supabase = await createClient()
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('pin')
      .eq('user_id', user.id)
      .single()
    
    if (adminError || !adminData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admin user not found'
        },
        { status: 404 }
      )
    }
    
    const isPinValid = adminData.pin === pin
    
    if (!isPinValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid PIN'
        },
        { status: 401 }
      )
    }
    
    // Clear PIN rate limiting on successful verification
    pinAttempts.delete(sessionToken)
    
    // Generate PIN verification token (short-lived)
    const pinToken = `pin_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const pinExpiresAt = Date.now() + (15 * 60 * 1000) // 15 minutes
    
    // Set PIN verification cookie
    const response = NextResponse.json({
      success: true,
      pinToken,
      expiresAt: pinExpiresAt,
      message: 'PIN verified successfully'
    })

    const domain = resolveCookieDomain()
    response.cookies.set('admin_pin_verified', pinToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
      domain,
    })
    
    logger.info(`PIN verification successful for admin ${profile.email} from IP ${ip}`)
    
    return response
    
  } catch (error) {
    logger.error('PIN verification API error:', error as Error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}