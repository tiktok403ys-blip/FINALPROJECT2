import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth } from '@/lib/auth/admin-middleware'

export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAdminAuth(request, ['read_content']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;
    const { searchParams } = new URL(request.url)
    const pageName = searchParams.get('page_name')
    const sectionType = searchParams.get('section_type')
    
    let query = supabase
      .from('page_sections')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (pageName) {
      query = query.eq('page_name', pageName)
    }
    
    if (sectionType) {
      query = query.eq('section_type', sectionType)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching page sections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch page sections' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication with create permissions
    const authResult = await validateAdminAuth(request, ['create_content']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;
    
    const body = await request.json()
    const { page_name, section_type, heading, content, display_order = 0, is_active = true } = body
    
    if (!page_name || !section_type || !heading || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('page_sections')
      .insert({
        page_name,
        section_type,
        heading,
        content,
        display_order,
        is_active
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating page section:', error)
      return NextResponse.json(
        { error: 'Failed to create page section' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate admin authentication with update permissions
    const authResult = await validateAdminAuth(request, ['update_content']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;
    
    const body = await request.json()
    const { id, page_name, section_type, heading, content, display_order, is_active } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    const updateData: any = {}
    if (page_name !== undefined) updateData.page_name = page_name
    if (section_type !== undefined) updateData.section_type = section_type
    if (heading !== undefined) updateData.heading = heading
    if (content !== undefined) updateData.content = content
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active
    
    const { data, error } = await supabase
      .from('page_sections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating page section:', error)
      return NextResponse.json(
        { error: 'Failed to update page section' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validate admin authentication with delete permissions
    const authResult = await validateAdminAuth(request, ['delete_content']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('page_sections')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting page section:', error)
      return NextResponse.json(
        { error: 'Failed to delete page section' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ message: 'Page section deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}