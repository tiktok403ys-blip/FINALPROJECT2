import { NextResponse } from 'next/server'

// PIN removed entirely: return 410 for any method
export async function POST() {
  return NextResponse.json({ error: 'Admin PIN has been removed' }, { status: 410 })
}

export async function GET() {
  return NextResponse.json({ error: 'Admin PIN has been removed' }, { status: 410 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Admin PIN has been removed' }, { status: 410 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Admin PIN has been removed' }, { status: 410 })
}