import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { AdminAuth } from '@/lib/auth/admin-auth'

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
    response.cookies.delete('admin_pin_verified')

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