import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { enhancedAdminAuth } from '@/lib/auth/admin-auth-enhanced'

function getSessionToken(request: NextRequest): string | null {
  // Try to get session token from cookie first
  const cookieToken = request.cookies.get('admin_session')?.value
  if (cookieToken) {
    return cookieToken
  }
  
  // Fallback to Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}

// GET - Validate current session
export async function GET(request: NextRequest) {
  try {
    const sessionToken = getSessionToken(request)
    
    if (!sessionToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No session token provided'
        },
        { status: 401 }
      )
    }
    
    // Validate session
    const adminProfile = await enhancedAdminAuth.validateSession(sessionToken)
    
    if (!adminProfile) {
      // Clear invalid session cookie
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired session'
        },
        { status: 401 }
      )
      
      response.cookies.delete('admin_session')
      response.cookies.delete('admin_pin_verified')
      
      return response
    }
    
    // Return valid session info
    return NextResponse.json({
      success: true,
      user: {
        id: adminProfile.id,
        email: adminProfile.email,
        role: adminProfile.role,
        permissions: adminProfile.permissions,
        lastLogin: adminProfile.last_login,
        isActive: adminProfile.is_active
      },
      sessionValid: true
    })
    
  } catch (error) {
    logger.error('Session validation API error:', error as Error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Logout (invalidate session)
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = getSessionToken(request)
    
    if (sessionToken) {
      // Sign out through enhanced auth (logs the logout event)
      await enhancedAdminAuth.signOut(sessionToken)
    }
    
    // Clear all admin-related cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    response.cookies.delete('admin_session')
    response.cookies.delete('admin_pin_verified')
    
    logger.info('Admin logout completed')
    
    return response
    
  } catch (error) {
    logger.error('Admin logout API error:', error as Error)
    
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