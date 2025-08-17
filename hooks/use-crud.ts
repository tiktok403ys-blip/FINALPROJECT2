'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase as createSupabaseClient } from '@/lib/supabase'
import { AdminAuth } from '@/lib/auth/admin-auth'
import { toast } from 'sonner'

export interface CrudConfig {
  table: string
  columns?: string
  orderBy?: { column: string; ascending?: boolean }
  filters?: Record<string, any>
  pageSize?: number
  realtime?: boolean
}

export interface CrudItem {
  id: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface CrudState<T extends CrudItem> {
  items: T[]
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  totalPages: number
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  selectedItems: string[]
}

export interface CrudActions<T extends CrudItem> {
  // Data operations
  fetchItems: () => Promise<void>
  createItem: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T | null>
  updateItem: (id: string, data: Partial<T>) => Promise<T | null>
  deleteItem: (id: string) => Promise<boolean>
  deleteItems: (ids: string[]) => Promise<boolean>
  
  // Pagination
  setPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  
  // Search and filter
  setSearchTerm: (term: string) => void
  setSortBy: (column: string) => void
  setSortOrder: (order: 'asc' | 'desc') => void
  setFilters: (filters: Record<string, any>) => void
  
  // Selection
  selectItem: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  
  // Utility
  refresh: () => Promise<void>
  reset: () => void
}

export function useCrud<T extends CrudItem>(
  config: CrudConfig
): [CrudState<T>, CrudActions<T>] {
  const adminAuth = AdminAuth.getInstance()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await adminAuth.getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])
  
  const [state, setState] = useState<CrudState<T>>({
    items: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
    searchTerm: '',
    sortBy: config.orderBy?.column || 'created_at',
    sortOrder: config.orderBy?.ascending ? 'asc' : 'desc',
    selectedItems: []
  })
  
  const [filters, setFiltersState] = useState<Record<string, any>>(config.filters || {})
  const pageSize = config.pageSize || 10

  // Build query with filters, search, and pagination
  const buildQuery = useCallback(() => {
    const supabase = createSupabaseClient()
    let query = supabase
      .from(config.table)
      .select(config.columns || '*', { count: 'exact' })
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (typeof value === 'string' && value.includes('%')) {
          query = query.ilike(key, value)
        } else {
          query = query.eq(key, value)
        }
      }
    })
    
    // Apply search
    if (state.searchTerm) {
      // This is a simple implementation - you might want to customize this per table
      query = query.or(`name.ilike.%${state.searchTerm}%,title.ilike.%${state.searchTerm}%,description.ilike.%${state.searchTerm}%`)
    }
    
    // Apply sorting
    query = query.order(state.sortBy, { ascending: state.sortOrder === 'asc' })
    
    // Apply pagination
    const from = (state.currentPage - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    return query
  }, [config, filters, state.searchTerm, state.sortBy, state.sortOrder, state.currentPage, pageSize])

  // Fetch items
  const fetchItems = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const query = buildQuery()
      const { data, error, count } = await query
      
      if (error) throw error
      
      const totalPages = Math.ceil((count || 0) / pageSize)
      
      setState(prev => ({
        ...prev,
        items: data || [],
        totalCount: count || 0,
        totalPages,
        loading: false
      }))
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }))
      toast.error(`Failed to fetch ${config.table}: ${error.message}`)
    }
  }, [buildQuery, config.table, pageSize])

  // Create item
  const createItem = useCallback(async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> => {
    try {
      const supabase = createSupabaseClient()
      const { data: newItem, error } = await supabase
        .from(config.table)
        .insert([data])
        .select()
        .single()
      
      if (error) throw error
      
      // Log activity
      if (user) {
        const supabaseForRpc = createSupabaseClient()
        await supabaseForRpc.rpc('log_admin_activity', {
          p_admin_id: user.id,
          p_action: 'CREATE',
          p_table_name: config.table,
          p_record_id: newItem.id,
          p_details: { created_data: data }
        })
      }
      
      toast.success(`${config.table.slice(0, -1)} created successfully`)
      await fetchItems() // Refresh the list
      return newItem as T
    } catch (error: any) {
      toast.error(`Failed to create ${config.table.slice(0, -1)}: ${error.message}`)
      return null
    }
  }, [config.table, user, fetchItems])

  // Update item
  const updateItem = useCallback(async (id: string, data: Partial<T>): Promise<T | null> => {
    try {
      const supabase = createSupabaseClient()
      const { data: updatedItem, error } = await supabase
        .from(config.table)
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      // Log activity
      if (user) {
        const supabaseForRpc = createSupabaseClient()
        await supabaseForRpc.rpc('log_admin_activity', {
          p_admin_id: user.id,
          p_action: 'UPDATE',
          p_table_name: config.table,
          p_record_id: id,
          p_details: { updated_data: data }
        })
      }
      
      toast.success(`${config.table.slice(0, -1)} updated successfully`)
      await fetchItems() // Refresh the list
      return updatedItem as T
    } catch (error: any) {
      toast.error(`Failed to update ${config.table.slice(0, -1)}: ${error.message}`)
      return null
    }
  }, [config.table, user, fetchItems])

  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from(config.table)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Log activity
      if (user) {
        const supabaseForRpc = createSupabaseClient()
        await supabaseForRpc.rpc('log_admin_activity', {
          p_admin_id: user.id,
          p_action: 'DELETE',
          p_table_name: config.table,
          p_record_id: id,
          p_details: {}
        })
      }
      
      toast.success(`${config.table.slice(0, -1)} deleted successfully`)
      await fetchItems() // Refresh the list
      return true
    } catch (error: any) {
      toast.error(`Failed to delete ${config.table.slice(0, -1)}: ${error.message}`)
      return false
    }
  }, [config.table, user, fetchItems])

  // Delete multiple items
  const deleteItems = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from(config.table)
        .delete()
        .in('id', ids)
      
      if (error) throw error
      
      // Log activity for each deleted item
      if (user) {
        const supabaseForRpc = createSupabaseClient()
        for (const id of ids) {
          await supabaseForRpc.rpc('log_admin_activity', {
            p_admin_id: user.id,
            p_action: 'DELETE',
            p_table_name: config.table,
            p_record_id: id,
            p_details: { bulk_delete: true }
          })
        }
      }
      
      toast.success(`${ids.length} ${config.table} deleted successfully`)
      setState(prev => ({ ...prev, selectedItems: [] }))
      await fetchItems() // Refresh the list
      return true
    } catch (error: any) {
      toast.error(`Failed to delete ${config.table}: ${error.message}`)
      return false
    }
  }, [config.table, user, fetchItems])

  // Pagination actions
  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }))
  }, [])

  const nextPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: Math.min(prev.currentPage + 1, prev.totalPages)
    }))
  }, [])

  const prevPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(prev.currentPage - 1, 1)
    }))
  }, [])

  // Search and filter actions
  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term, currentPage: 1 }))
  }, [])

  const setSortBy = useCallback((column: string) => {
    setState(prev => ({ ...prev, sortBy: column, currentPage: 1 }))
  }, [])

  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortOrder: order, currentPage: 1 }))
  }, [])

  const setFilters = useCallback((newFilters: Record<string, any>) => {
    setFiltersState(newFilters)
    setState(prev => ({ ...prev, currentPage: 1 }))
  }, [])

  // Selection actions
  const selectItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(id)
        ? prev.selectedItems.filter(item => item !== id)
        : [...prev.selectedItems, id]
    }))
  }, [])

  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.length === prev.items.length
        ? []
        : prev.items.map(item => item.id)
    }))
  }, [])

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedItems: [] }))
  }, [])

  // Utility actions
  const refresh = useCallback(async () => {
    await fetchItems()
  }, [fetchItems])

  const reset = useCallback(() => {
    setState({
      items: [],
      loading: false,
      error: null,
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      searchTerm: '',
      sortBy: config.orderBy?.column || 'created_at',
      sortOrder: config.orderBy?.ascending ? 'asc' : 'desc',
      selectedItems: []
    })
    setFiltersState(config.filters || {})
  }, [config])

  // Setup realtime subscription
  useEffect(() => {
    if (config.realtime) {
      const supabase = createSupabaseClient()
      const subscription = supabase
        .channel(`${config.table}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: config.table
          },
          () => {
            fetchItems() // Refresh on any change
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [config.table, config.realtime, fetchItems])

  // Fetch items when dependencies change
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const actions: CrudActions<T> = {
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    deleteItems,
    setPage,
    nextPage,
    prevPage,
    setSearchTerm,
    setSortBy,
    setSortOrder,
    setFilters,
    selectItem,
    selectAll,
    clearSelection,
    refresh,
    reset
  }

  return [state, actions]
}

// Export utility types
export type UseCrudReturn<T extends CrudItem> = [CrudState<T>, CrudActions<T>]