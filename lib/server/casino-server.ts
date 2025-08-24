// Server-side casino data fetching and processing
// Optimized for React Server Components

import { createClient } from '@/lib/supabase/server'
import type { Casino } from '@/lib/types'

export async function getCasinosServer(filter?: string, searchParams?: URLSearchParams) {
  const supabase = await createClient()

  // Sanitize filter to known values
  const allowedFilters = new Set(['all', 'high-rated', 'new', 'live'])
  const rawFilter = filter || 'all'
  const sanitizedFilter = allowedFilters.has(rawFilter) ? rawFilter as 'all' | 'high-rated' | 'new' | 'live' : 'all'

  let query = supabase.from("casinos").select("*")

  // Apply filters based on query param
  if (sanitizedFilter === 'high-rated') {
    query = query.gte('rating', 7)
  } else if (sanitizedFilter === 'new') {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    query = query.gte('created_at', threeMonthsAgo.toISOString())
  } else if (sanitizedFilter === 'live') {
    query = query.or('description.ilike.%live%,bonus_info.ilike.%live%,name.ilike.%live%')
  }

  // Optimized ordering strategy
  query = query.order('display_order', { ascending: true, nullsFirst: false })

  if (sanitizedFilter === 'new') {
    query = query.order('created_at', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('rating', { ascending: false, nullsFirst: false })
  }

  query = query.order('created_at', { ascending: false, nullsFirst: false })

  // Add pagination for better performance
  const page = parseInt(searchParams?.get('page') || '1')
  const limit = parseInt(searchParams?.get('limit') || '20')
  const offset = (page - 1) * limit

  query = query.range(offset, offset + limit - 1)

  const { data: casinos, error, count } = await query

  if (error) {
    console.error('Server error fetching casinos:', error)
    return { casinos: [], total: 0, error: error.message }
  }

  return {
    casinos: casinos || [],
    total: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit),
    filter: sanitizedFilter
  }
}

export async function getCasinoByIdServer(id: string) {
  const supabase = await createClient()

  const { data: casino, error } = await supabase
    .from("casinos")
    .select("*")
    .eq('id', id)
    .single()

  if (error) {
    console.error('Server error fetching casino:', error)
    return { casino: null, error: error.message }
  }

  return { casino, error: null }
}

export async function getFeaturedCasinosServer(limit = 6) {
  const supabase = await createClient()

  const { data: casinos, error } = await supabase
    .from("casinos")
    .select("*")
    .eq("is_featured_home", true)
    .order("home_rank", { ascending: true, nullsFirst: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Server error fetching featured casinos:', error)
    return { casinos: [], error: error.message }
  }

  return { casinos: casinos || [], error: null }
}

export async function getCasinoStatsServer() {
  const supabase = await createClient()

  // Get total count
  const { count: totalCasinos } = await supabase
    .from("casinos")
    .select("*", { count: 'exact', head: true })

  // Get high-rated casinos count
  const { count: highRatedCasinos } = await supabase
    .from("casinos")
    .select("*", { count: 'exact', head: true })
    .gte('rating', 7)

  // Get new casinos count (last 3 months)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const { count: newCasinos } = await supabase
    .from("casinos")
    .select("*", { count: 'exact', head: true })
    .gte('created_at', threeMonthsAgo.toISOString())

  return {
    totalCasinos: totalCasinos || 0,
    highRatedCasinos: highRatedCasinos || 0,
    newCasinos: newCasinos || 0,
    averageRating: 0 // Will be calculated if needed
  }
}
