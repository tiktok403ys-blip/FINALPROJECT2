import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { createClient } from '@supabase/supabase-js'
import { hash, compare } from 'bcryptjs'

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

    // Get user ID from auth context (you might need to implement this based on your auth system)
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
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Hash the PIN before storing
    const saltRounds = 12
    const hashedPin = await hash(pin, saltRounds)

    // Store PIN in database using RPC function
    const { data: pinResult, error: pinError } = await supabase.rpc('set_admin_pin', {
      user_uuid: userId,
      pin_hash: hashedPin
    })

    if (pinError || !pinResult) {
      console.error('Failed to store PIN in database:', pinError)
      return NextResponse.json(
        { success: false, error: 'Failed to store PIN in database' },
        { status: 500 }
      )
    }

    // Create admin session token
    const adminToken = await new SignJWT({ 
      verified: true, 
      type: 'admin',
      userId: userId,
      timestamp: Date.now()
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d') // Extended to 7 days for better UX
      .sign(JWT_SECRET)

    // Set cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Admin PIN set successfully and stored permanently' 
    })

    response.cookies.set('admin-pin-verified', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
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
