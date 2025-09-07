import { NextResponse } from 'next/server'

// PIN removed entirely: return 410
export async function POST() {
  return NextResponse.json({ error: 'Admin PIN has been removed' }, { status: 410 })
}