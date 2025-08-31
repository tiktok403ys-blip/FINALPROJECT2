import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { AdminAuth } from '@/lib/auth/admin-auth'

function resolveCookieDomain(): string | undefined {
  const explicit = process.env.SITE_COOKIE_DOMAIN || process.env.NEXT_PUBLIC_SITE_COOKIE_DOMAIN
  if (explicit && explicit.trim().length > 0) return explicit.trim()
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_DOMAIN
  }
  return undefined
}

// Removed getSessionToken function as AdminAuth handles authentication directly

// GET - Validate current session
export async function GET(request: NextRequest) {
  try {
    const adminAuth = AdminAuth.getInstance()
    const { user, profile } = await adminAuth.getCurrentUser()
    
    if (!user || !profile) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        permissions: profile.permissions
      }
    })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Logout (invalidate session)
export async function DELETE(request: NextRequest) {
  try {
    // Sign out through admin auth
    const adminAuth = AdminAuth.getInstance()
    const { error } = await adminAuth.signOut()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      )
    }

    // Create response and clear cookies
    const response = NextResponse.json({ success: true })
    const domain = resolveCookieDomain()
    response.cookies.set('admin_pin_verified', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
      domain,
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
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