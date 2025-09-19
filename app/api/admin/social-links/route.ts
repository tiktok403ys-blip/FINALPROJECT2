import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Server-side auth using Supabase server client (reads cookies via next/headers)
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Ensure user is admin
    const { data: adminUser, error: adminErr } = await supabase
      .from('admin_users')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    if (adminErr || !adminUser || !(adminUser.role === 'admin' || adminUser.role === 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { payload } = body as { payload: Array<{ id?: string; name: string; icon: string; url: string; sort_order?: number; is_active?: boolean }> }
    if (!Array.isArray(payload)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

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
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: adminUser, error: adminErr } = await supabase
      .from('admin_users')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    if (adminErr || !adminUser || !(adminUser.role === 'admin' || adminUser.role === 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const { error } = await supabase.from('social_links').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


