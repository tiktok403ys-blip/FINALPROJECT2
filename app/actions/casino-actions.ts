// Server Actions for casino-related operations
// Optimized for React Server Components and form handling

'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/analytics'

// Simple sanitization function to replace security import
function sanitizeHtml(input: string): string {
  if (!input) return ''
  return input.replace(/[<>]/g, '')
}

// Types for server actions
interface CasinoReviewData {
  casinoId: string
  rating: number
  title: string
  content: string
  pros: string[]
  cons: string[]
  userId?: string
}

interface SearchFilters {
  query?: string
  filter?: 'all' | 'high-rated' | 'new' | 'live'
  sortBy?: 'rating' | 'newest' | 'name'
  page?: number
  limit?: number
}

// Casino Review Actions
export async function submitCasinoReview(formData: FormData) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Extract and sanitize form data
    const casinoId = sanitizeHtml(formData.get('casinoId') as string)
    const rating = parseInt(formData.get('rating') as string)
    const title = sanitizeHtml(formData.get('title') as string)
    const content = sanitizeHtml(formData.get('content') as string)
    const prosRaw = formData.get('pros') as string
    const consRaw = formData.get('cons') as string

    // Parse pros and cons
    const pros = prosRaw ? JSON.parse(prosRaw).filter((p: string) => p.trim()) : []
    const cons = consRaw ? JSON.parse(consRaw).filter((c: string) => c.trim()) : []

    // Validate input
    if (!casinoId || !title || !content || rating < 1 || rating > 10) {
      return { success: false, error: 'Invalid form data' }
    }

    // Check if user already reviewed this casino
    const { data: existingReview } = await supabase
      .from('player_reviews')
      .select('id')
      .eq('casino_id', casinoId)
      .eq('user_id', user.id)
      .single()

    if (existingReview) {
      return { success: false, error: 'You have already reviewed this casino' }
    }

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from('player_reviews')
      .insert({
        casino_id: casinoId,
        user_id: user.id,
        rating,
        title,
        content,
        pros,
        cons,
        status: 'pending', // Requires moderation
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Error submitting review:', reviewError)
      return { success: false, error: 'Failed to submit review' }
    }

    // Track analytics
    trackEvent({
      action: 'casino_review_submitted',
      category: 'User Engagement',
      label: casinoId,
      value: rating,
      customParameters: {
        casino_id: casinoId,
        review_id: review.id,
        rating: rating,
        has_pros: pros.length > 0,
        has_cons: cons.length > 0
      }
    })

    // Revalidate relevant paths
    revalidatePath(`/casinos/${casinoId}`)
    revalidatePath('/casinos')
    revalidateTag('casino-reviews')

    return {
      success: true,
      review: review,
      message: 'Review submitted successfully and is pending approval'
    }

  } catch (error) {
    console.error('Server action error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateCasinoReview(reviewId: string, formData: FormData) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if review belongs to user
    const { data: existingReview, error: checkError } = await supabase
      .from('player_reviews')
      .select('id, casino_id')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingReview) {
      return { success: false, error: 'Review not found or access denied' }
    }

    // Extract and sanitize form data
    const rating = parseInt(formData.get('rating') as string)
    const title = sanitizeHtml(formData.get('title') as string)
    const content = sanitizeHtml(formData.get('content') as string)
    const prosRaw = formData.get('pros') as string
    const consRaw = formData.get('cons') as string

    const pros = prosRaw ? JSON.parse(prosRaw).filter((p: string) => p.trim()) : []
    const cons = consRaw ? JSON.parse(prosRaw).filter((c: string) => c.trim()) : []

    // Validate input
    if (!title || !content || rating < 1 || rating > 10) {
      return { success: false, error: 'Invalid form data' }
    }

    // Update review
    const { data: review, error: updateError } = await supabase
      .from('player_reviews')
      .update({
        rating,
        title,
        content,
        pros,
        cons,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating review:', updateError)
      return { success: false, error: 'Failed to update review' }
    }

    // Track analytics
    trackEvent({
      action: 'casino_review_updated',
      category: 'User Engagement',
      label: existingReview.casino_id,
      value: rating,
      customParameters: {
        review_id: reviewId,
        casino_id: existingReview.casino_id,
        rating: rating
      }
    })

    // Revalidate paths
    revalidatePath(`/casinos/${existingReview.casino_id}`)
    revalidatePath('/casinos')
    revalidateTag('casino-reviews')

    return {
      success: true,
      review: review,
      message: 'Review updated successfully'
    }

  } catch (error) {
    console.error('Server action error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Casino Search & Filter Actions
export async function searchCasinos(searchParams: SearchFilters) {
  try {
    const supabase = await createClient()

    let query = supabase.from("casinos").select("*", { count: 'exact' })

    // Apply search query
    if (searchParams.query) {
      const sanitizedQuery = sanitizeHtml(searchParams.query)
      query = query.or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,bonus_info.ilike.%${sanitizedQuery}%`)
    }

    // Apply filters
    if (searchParams.filter === 'high-rated') {
      query = query.gte('rating', 7)
    } else if (searchParams.filter === 'new') {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      query = query.gte('created_at', threeMonthsAgo.toISOString())
    } else if (searchParams.filter === 'live') {
      query = query.or('description.ilike.%live%,bonus_info.ilike.%live%,name.ilike.%live%')
    }

    // Apply sorting
    if (searchParams.sortBy === 'rating') {
      query = query.order('rating', { ascending: false })
    } else if (searchParams.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (searchParams.sortBy === 'name') {
      query = query.order('name', { ascending: true })
    } else {
      // Default sorting
      query = query.order('display_order', { ascending: true, nullsFirst: false })
      query = query.order('rating', { ascending: false })
    }

    // Apply pagination
    const page = searchParams.page || 1
    const limit = searchParams.limit || 20
    const offset = (page - 1) * limit

    query = query.range(offset, offset + limit - 1)

    const { data: casinos, error, count } = await query

    if (error) {
      console.error('Search error:', error)
      return { success: false, error: error.message, casinos: [], total: 0 }
    }

    // Track search analytics
    trackEvent({
      action: 'casino_search',
      category: 'Search',
      label: searchParams.query || 'no-query',
      customParameters: {
        search_query: searchParams.query,
        filter_applied: searchParams.filter || 'none',
        sort_by: searchParams.sortBy || 'default',
        results_count: casinos?.length || 0,
        page: page,
        has_results: (casinos?.length || 0) > 0
      }
    })

    return {
      success: true,
      casinos: casinos || [],
      total: count || 0,
      page: page,
      totalPages: Math.ceil((count || 0) / limit),
      searchParams
    }

  } catch (error) {
    console.error('Search server action error:', error)
    return { success: false, error: 'Search failed', casinos: [], total: 0 }
  }
}

// Casino Favorite Actions
export async function toggleCasinoFavorite(casinoId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('casino_id', casinoId)
      .eq('user_id', user.id)
      .single()

    let isFavorited: boolean

    if (existingFavorite) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existingFavorite.id)

      if (deleteError) throw deleteError
      isFavorited = false
    } else {
      // Add favorite
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({
          casino_id: casinoId,
          user_id: user.id,
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError
      isFavorited = true
    }

    // Track analytics
    trackEvent({
      action: isFavorited ? 'casino_favorited' : 'casino_unfavorited',
      category: 'User Engagement',
      label: casinoId,
      customParameters: {
        casino_id: casinoId,
        is_favorited: isFavorited
      }
    })

    return {
      success: true,
      isFavorited,
      message: isFavorited ? 'Added to favorites' : 'Removed from favorites'
    }

  } catch (error) {
    console.error('Favorite toggle error:', error)
    return { success: false, error: 'Failed to update favorite' }
  }
}

export async function getUserFavorites() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required', favorites: [] }
    }

    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select('casino_id, casinos(name, logo_url, rating)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get favorites error:', error)
      return { success: false, error: error.message, favorites: [] }
    }

    return {
      success: true,
      favorites: favorites || []
    }

  } catch (error) {
    console.error('Get favorites server action error:', error)
    return { success: false, error: 'Failed to get favorites', favorites: [] }
  }
}

// Admin Actions (for super admins)
export async function updateCasinoStatus(casinoId: string, status: 'active' | 'inactive') {
  try {
    const supabase = await createClient()

    // Check if user is super admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return { success: false, error: 'Admin access required' }
    }

    // Update casino status
    const { data: casino, error } = await supabase
      .from('casinos')
      .update({
        is_active: status === 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', casinoId)
      .select()
      .single()

    if (error) {
      console.error('Update casino status error:', error)
      return { success: false, error: 'Failed to update casino status' }
    }

    // Revalidate paths
    revalidatePath(`/casinos/${casinoId}`)
    revalidatePath('/casinos')
    revalidatePath('/admin/casinos')

    // Track admin action
    trackEvent({
      action: 'admin_casino_status_update',
      category: 'Admin',
      label: casinoId,
      customParameters: {
        casino_id: casinoId,
        new_status: status,
        admin_user: user.id
      }
    })

    return {
      success: true,
      casino,
      message: `Casino status updated to ${status}`
    }

  } catch (error) {
    console.error('Admin action error:', error)
    return { success: false, error: 'Admin action failed' }
  }
}
