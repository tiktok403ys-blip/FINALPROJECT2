import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PageSection {
  id: string
  page_name: string
  section_type: string
  heading: string
  content: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UsePageSectionOptions {
  pageName?: string
  sectionType?: string
  enabled?: boolean
}

export function usePageSection(options: UsePageSectionOptions = {}) {
  const { pageName, sectionType, enabled = true } = options
  const [data, setData] = useState<PageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper untuk mengambil Authorization header (Option B)
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    const headers: Record<string, string> = {}
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    return headers
  }

  const fetchPageSections = async () => {
    if (!enabled) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Read directly from Supabase (public read). Avoid admin API to prevent 404 in public.
      const supabase = createClient()
      let query = supabase
        .from('page_sections')
        .select('id,page_name,section_type:section_name,heading:title,content,display_order,is_active,created_at,updated_at')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (pageName) query = query.eq('page_name', pageName)
      if (sectionType) query = query.eq('section_name', sectionType)
      const { data: sections, error } = await query
      if (error) throw error
      setData(sections || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPageSections()
  }, [pageName, sectionType, enabled])

  const refetch = () => {
    fetchPageSections()
  }

  return {
    data,
    loading,
    error,
    refetch
  }
}

// Hook untuk mendapatkan single page section berdasarkan page name dan section type
export function usePageSectionSingle(pageName: string, sectionType: string = 'hero', enabled: boolean = true) {
  const { data, loading, error, refetch } = usePageSection({
    pageName,
    sectionType,
    enabled: !!pageName && enabled
  })

  const section = data.length > 0 ? data[0] : null

  return {
    section,
    loading,
    error,
    refetch
  }
}

// Hook untuk real-time updates menggunakan Supabase subscriptions
export function usePageSectionRealtime(options: UsePageSectionOptions = {}) {
  const { pageName, sectionType, enabled = true } = options
  const [data, setData] = useState<PageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!enabled) return

    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let query = supabase
          .from('page_sections')
          .select('id,page_name,section_type:section_name,heading:title,content,display_order,is_active,created_at,updated_at')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
        
        if (pageName) {
          query = query.eq('page_name', pageName)
        }
        
        if (sectionType) {
          query = query.eq('section_name', sectionType)
        }
        
        const { data: sections, error } = await query
        
        if (error) {
          throw error
        }
        
        setData(sections || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Setup real-time subscription
    const channel = supabase
      .channel('page_sections_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_sections',
          filter: pageName ? `page_name=eq.${pageName}` : undefined
        },
        () => {
          // Refetch data when changes occur
          fetchInitialData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pageName, sectionType, enabled, supabase])

  const refetch = async () => {
    if (!enabled) return
    
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('page_sections')
        .select('id,page_name,section_type:section_name,heading:title,content,display_order,is_active,created_at,updated_at')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (pageName) {
        query = query.eq('page_name', pageName)
      }
      
      if (sectionType) {
        query = query.eq('section_name', sectionType)
      }
      
      const { data: sections, error } = await query
      
      if (error) {
        throw error
      }
      
      setData(sections || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    refetch
  }
}