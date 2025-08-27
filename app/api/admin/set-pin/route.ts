import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
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

    // Create admin session token
    const adminToken = await new SignJWT({ 
      verified: true, 
      type: 'admin',
      timestamp: Date.now()
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // Set cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Admin PIN set successfully' 
    })

    response.cookies.set('admin-pin-verified', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
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
