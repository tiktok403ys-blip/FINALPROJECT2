import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user ID from auth context
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const { payload } = await jwtVerify(token, JWT_SECRET)
        userId = payload.sub as string
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError)
      }
    }

    // If no user ID from JWT, try to get from cookie
    if (!userId) {
      const adminPinCookie = request.cookies.get('admin-pin-verified')
      if (adminPinCookie) {
        try {
          const { payload } = await jwtVerify(adminPinCookie.value, JWT_SECRET)
          userId = payload.sub as string
        } catch (cookieError) {
          console.error('Cookie verification failed:', cookieError)
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ 
        hasPinSet: false,
        isVerified: false,
        error: 'User not authenticated'
      })
    }

    // Check database for PIN status
    const { data: pinData, error: pinError } = await supabase
      .from('admin_pins')
      .select('id, is_active, created_at, last_used_at, failed_attempts, locked_until')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (pinError) {
      if (pinError.code === 'PGRST116') {
        // No PIN found
        return NextResponse.json({ 
          hasPinSet: false,
          isVerified: false
        })
      }
      console.error('Database error checking PIN status:', pinError)
      return NextResponse.json(
        { success: false, error: 'Failed to check PIN status' },
        { status: 500 }
      )
    }

    if (!pinData) {
      return NextResponse.json({ 
        hasPinSet: false,
        isVerified: false
      })
    }

    // Check if PIN is locked
    const isLocked = pinData.locked_until && new Date(pinData.locked_until) > new Date()

    return NextResponse.json({ 
      hasPinSet: true,
      isVerified: !isLocked,
      isLocked: isLocked,
      lockedUntil: pinData.locked_until,
      failedAttempts: pinData.failed_attempts,
      createdAt: pinData.created_at,
      lastUsedAt: pinData.last_used_at
    })

  } catch (error) {
    console.error('PIN status check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check PIN status' },
      { status: 500 }
    )
  }
}