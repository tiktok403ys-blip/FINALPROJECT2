import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Bonus, Casino } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Get bonuses with pagination
    const { data: bonuses, error, count } = await supabase
      .from('bonuses')
      .select(`
        *,
        casinos (
          name,
          logo_url,
          rating
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching bonuses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bonuses' },
        { status: 500 }
      )
    }

    // Derive whether each bonus' casino has a published editorial review
    const casinoIds = (bonuses || [])
      .map((b: Bonus) => b.casino_id)
      .filter((id: string | null): id is string => typeof id === 'string')

    let bonusesWithFlag = bonuses || []
    if (casinoIds.length > 0) {
      const { data: reviews } = await supabase
        .from('casino_reviews')
        .select('casino_id')
        .in('casino_id', casinoIds)
        .eq('is_published', true)

      const hasReviewSet = new Set((reviews || []).map((r: { casino_id: string }) => r.casino_id))
      bonusesWithFlag = (bonuses || []).map((b: Bonus) => ({ 
        ...b, 
        has_review: hasReviewSet.has(b.casino_id || '') 
      }))
    }

    const totalPages = Math.ceil((count || 0) / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      bonuses: bonusesWithFlag,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}