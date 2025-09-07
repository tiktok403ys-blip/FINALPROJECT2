import { NextResponse } from 'next/server'

// PIN status route removed
export async function GET() {
  return NextResponse.json({ error: 'Admin PIN has been removed' }, { status: 410 })
}