import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Admin PIN has been removed' }, { status: 410 })
}
