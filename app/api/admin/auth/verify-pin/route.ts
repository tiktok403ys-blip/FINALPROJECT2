import { NextResponse } from 'next/server'

// Deprecated insecure endpoint: always return 410 Gone
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/admin/pin-verify.' },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/admin/pin-verify.' },
    { status: 410 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/admin/pin-verify.' },
    { status: 410 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/admin/pin-verify.' },
    { status: 410 }
  )
}