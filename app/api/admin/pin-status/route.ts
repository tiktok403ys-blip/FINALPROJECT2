import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function GET(request: NextRequest) {
  try {
    // Check if admin PIN is already verified via cookie
    const adminPinCookie = request.cookies.get('admin-pin-verified')
    
    if (!adminPinCookie) {
      return NextResponse.json({ 
        hasPinSet: false,
        isVerified: false 
      })
    }

    try {
      // Verify the JWT token
      const { payload } = await jwtVerify(adminPinCookie.value, JWT_SECRET)
      
      if (payload.verified === true && payload.type === 'admin') {
        return NextResponse.json({ 
          hasPinSet: true,
          isVerified: true 
        })
      } else {
        return NextResponse.json({ 
          hasPinSet: false,
          isVerified: false 
        })
      }
    } catch (jwtError) {
      // JWT verification failed
      return NextResponse.json({ 
        hasPinSet: false,
        isVerified: false 
      })
    }

  } catch (error) {
    console.error('PIN status check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check PIN status' },
      { status: 500 }
    )
  }
}