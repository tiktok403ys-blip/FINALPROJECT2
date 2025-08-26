import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { enhancedAdminAuth } from '@/lib/auth/admin-auth-enhanced'
import { z } from 'zod'

// Request validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false)
})

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Check if locked out
  if (attempts.count >= MAX_ATTEMPTS) {
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

export async function POST(request: NextRequest) {
  try {
    // Get client information
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Check rate limiting
    if (!checkRateLimit(ip)) {
      logger.warn(`Admin login rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: LOCKOUT_DURATION / 1000
        },
        { status: 429 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = loginSchema.safeParse(body)
    
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
    
    const { email, password, rememberMe } = validationResult.data
    
    // Authenticate using enhanced admin auth
    const authResult = await enhancedAdminAuth.signIn(
      { email, password, rememberMe },
      ip,
      userAgent
    )
    
    if (!authResult) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials or account locked'
        },
        { status: 401 }
      )
    }
    
    // Clear rate limiting on successful login
    loginAttempts.delete(ip)
    
    // Set secure HTTP-only cookie for session
    const response = NextResponse.json({
      success: true,
      sessionToken: authResult.sessionToken,
      expiresAt: authResult.expiresAt,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        role: authResult.user.role,
        permissions: authResult.user.permissions,
        lastLogin: authResult.user.last_login
      }
    })
    
    // Set secure session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60, // 30 days or 8 hours
      path: '/admin'
    }
    
    response.cookies.set('admin_session', authResult.sessionToken, cookieOptions)
    
    logger.info(`Admin login successful for ${email} from IP ${ip}`)
    
    return response
    
  } catch (error) {
    logger.error('Admin login API error:', error as Error)
    
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