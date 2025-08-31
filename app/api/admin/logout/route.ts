import { NextRequest, NextResponse } from 'next/server';

function resolveCookieDomain(): string | undefined {
  const explicit = process.env.SITE_COOKIE_DOMAIN || process.env.NEXT_PUBLIC_SITE_COOKIE_DOMAIN
  if (explicit && explicit.trim().length > 0) return explicit.trim()
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_DOMAIN
  }
  return undefined
}

/**
 * POST /api/admin/logout
 * Clears the admin PIN verification cookie
 */
export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    const domain = resolveCookieDomain()
    // Clear the admin PIN verification cookie
    response.cookies.set('admin_pin_verified', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // This will delete the cookie
      path: '/',
      domain,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}