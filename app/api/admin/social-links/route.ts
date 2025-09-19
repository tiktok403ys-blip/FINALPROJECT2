import { NextResponse } from 'next/server'
import { validateAdminAuth } from '@/lib/auth/admin-middleware'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Upsert payload of social links
  const auth = await validateAdminAuth((request as unknown) as any)
  // validateAdminAuth may return NextResponse on error
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json().catch(() => ({}))
    const { payload } = body as { payload: Array<{ id?: string; name: string; icon: string; url: string; sort_order?: number; is_active?: boolean }> }
    if (!Array.isArray(payload)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = await createClient()

    const clean = payload
      .filter(r => r && (r.icon || '').trim() && (r.name || '').trim() && (r.url || '').trim())
      .map(r => ({
        id: r.id,
        name: r.name?.trim(),
        icon: r.icon?.trim().toLowerCase(),
        url: r.url?.trim(),
        sort_order: r.sort_order ?? 0,
        is_active: r.is_active ?? true,
      }))

    if (clean.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    const { error } = await supabase
      .from('social_links')
      .upsert(clean, { onConflict: 'icon' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, updated: clean.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await validateAdminAuth((request as unknown) as any)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('social_links').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


