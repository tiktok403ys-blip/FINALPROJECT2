import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function GET(request: NextRequest) {
  try {
    // Generate a simple CSRF token
    const token = crypto.randomUUID()
    const expires = Date.now() + (60 * 60 * 1000) // 1 hour
    
    // Create JWT token
    const jwt = await new SignJWT({ 
      token, 
      type: 'csrf',
      expires 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(JWT_SECRET)

    return NextResponse.json({ 
      success: true, 
      token: jwt,
      expires 
    })

  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
