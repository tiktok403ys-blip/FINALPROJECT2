// Simple hook-based store for casino state management
// Mobile-first optimized without external dependencies

import { useState, useCallback, useEffect } from 'react'
import type { Casino } from '@/lib/types'

// Types for store state
interface CasinoFilters {
  query: string
  filter: 'all' | 'high-rated' | 'new' | 'live'
  sortBy: 'rating' | 'newest' | 'name' | 'relevance'
  page: number
  limit: number
}

interface UserPreferences {
  theme: 'dark' | 'light' | 'auto'
  language: string
  currency: string
  notifications: boolean
  soundEnabled: boolean
}

interface UIState {
  mobileMenuOpen: boolean
  searchModalOpen: boolean
  filterModalOpen: boolean
  loadingStates: Record<string, boolean>
  errorStates: Record<string, string | null>
}

interface CasinoState {
  // Data state
  casinos: Casino[]
  featuredCasinos: Casino[]
  favorites: string[]
  searchResults: Casino[]
  selectedCasino: Casino | null

  // UI state
  ui: UIState

  // Filter state
  filters: CasinoFilters

  // User state
  userPreferences: UserPreferences

  // Performance state
  lastUpdated: Record<string, number>
  cacheValidity: Record<string, boolean>
}

// Actions interface
interface CasinoActions {
  // Data actions
  setCasinos: (casinos: Casino[]) => void
  setFeaturedCasinos: (casinos: Casino[]) => void
  setSearchResults: (results: Casino[]) => void
  setSelectedCasino: (casino: Casino | null) => void

  // Favorite actions
  addFavorite: (casinoId: string) => void
  removeFavorite: (casinoId: string) => void
  toggleFavorite: (casinoId: string) => void
  isFavorite: (casinoId: string) => boolean

  // Filter actions
  setFilters: (filters: Partial<CasinoFilters>) => void
  resetFilters: () => void
  applySearch: (query: string) => void

  // UI actions
  setMobileMenuOpen: (open: boolean) => void
  setSearchModalOpen: (open: boolean) => void
  setFilterModalOpen: (open: boolean) => void

  // Loading states
  setLoading: (key: string, loading: boolean) => void
  setError: (key: string, error: string | null) => void

  // User preferences
  setUserPreferences: (preferences: Partial<UserPreferences>) => void
  setTheme: (theme: UserPreferences['theme']) => void

  // Cache management
  updateCacheValidity: (key: string, valid: boolean) => void
  isCacheValid: (key: string, maxAge?: number) => boolean

  // Utility actions
  reset: () => void
  hydrate: (state: Partial<CasinoState>) => void
}

// Combined state and actions
type CasinoStore = CasinoState & CasinoActions

// Default state
const defaultState: CasinoState = {
  // Data
  casinos: [],
  featuredCasinos: [],
  favorites: [],
  searchResults: [],
  selectedCasino: null,

  // UI
  ui: {
    mobileMenuOpen: false,
    searchModalOpen: false,
    filterModalOpen: false,
    loadingStates: {},
    errorStates: {}
  },

  // Filters
  filters: {
    query: '',
    filter: 'all',
    sortBy: 'rating',
    page: 1,
    limit: 20
  },

  // User preferences
  userPreferences: {
    theme: 'dark',
    language: 'en',
    currency: 'USD',
    notifications: true,
    soundEnabled: false
  },

  // Performance
  lastUpdated: {},
  cacheValidity: {}
}

// Simple store implementation using hooks
let globalState: CasinoState = defaultState;
const listeners: Set<() => void> = new Set();

// Load persisted data on initialization
if (typeof localStorage !== 'undefined') {
  try {
    const persistedData = localStorage.getItem('casino-store');
    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      globalState = {
        ...globalState,
        favorites: parsed.favorites || [],
        userPreferences: { ...globalState.userPreferences, ...parsed.userPreferences },
        filters: { ...globalState.filters, ...parsed.filters }
      };
    }
  } catch (error) {
    console.error('Failed to load persisted casino data:', error);
  }
}

// Actions implementation
const actions: CasinoActions = {
  // Data actions
  setCasinos: (casinos) => {
    globalState = {
      ...globalState,
      casinos,
      lastUpdated: { ...globalState.lastUpdated, casinos: Date.now() },
      cacheValidity: { ...globalState.cacheValidity, casinos: true }
    };
    notifyListeners();
    persistData();
  },

  setFeaturedCasinos: (casinos) => {
    globalState = {
      ...globalState,
      featuredCasinos: casinos,
      lastUpdated: { ...globalState.lastUpdated, featuredCasinos: Date.now() },
      cacheValidity: { ...globalState.cacheValidity, featuredCasinos: true }
    };
    notifyListeners();
    persistData();
  },

  setSearchResults: (results) => {
    globalState = {
      ...globalState,
      searchResults: results,
      lastUpdated: { ...globalState.lastUpdated, searchResults: Date.now() },
      cacheValidity: { ...globalState.cacheValidity, searchResults: true }
    };
    notifyListeners();
    persistData();
  },

  setSelectedCasino: (casino) => {
    globalState = { ...globalState, selectedCasino: casino };
    notifyListeners();
  },

  // Favorite actions
  addFavorite: (casinoId) => {
    if (!globalState.favorites.includes(casinoId)) {
      globalState = {
        ...globalState,
        favorites: [...globalState.favorites, casinoId],
        lastUpdated: { ...globalState.lastUpdated, favorites: Date.now() }
      };
      notifyListeners();
      persistData();
    }
  },

  removeFavorite: (casinoId) => {
    globalState = {
      ...globalState,
      favorites: globalState.favorites.filter(id => id !== casinoId),
      lastUpdated: { ...globalState.lastUpdated, favorites: Date.now() }
    };
    notifyListeners();
    persistData();
  },

  toggleFavorite: (casinoId) => {
    const isFavorite = globalState.favorites.includes(casinoId);
    globalState = {
      ...globalState,
      favorites: isFavorite
        ? globalState.favorites.filter(id => id !== casinoId)
        : [...globalState.favorites, casinoId],
      lastUpdated: { ...globalState.lastUpdated, favorites: Date.now() }
    };
    notifyListeners();
    persistData();
  },

  isFavorite: (casinoId) => {
    return globalState.favorites.includes(casinoId);
  },

  // Filter actions
  setFilters: (newFilters) => {
    globalState = {
      ...globalState,
      filters: { ...globalState.filters, ...newFilters },
      lastUpdated: { ...globalState.lastUpdated, filters: Date.now() }
    };
    notifyListeners();
    persistData();
  },

  resetFilters: () => {
    globalState = {
      ...globalState,
      filters: defaultState.filters,
      searchResults: [],
      lastUpdated: { ...globalState.lastUpdated, filters: Date.now() }
    };
    notifyListeners();
    persistData();
  },

  applySearch: (query) => {
    globalState = {
      ...globalState,
      filters: { ...globalState.filters, query, page: 1 },
      lastUpdated: { ...globalState.lastUpdated, search: Date.now() }
    };
    notifyListeners();
    persistData();
  },

  // UI actions
  setMobileMenuOpen: (open) => {
    globalState = {
      ...globalState,
      ui: { ...globalState.ui, mobileMenuOpen: open }
    };
    notifyListeners();
  },

  setSearchModalOpen: (open) => {
    globalState = {
      ...globalState,
      ui: { ...globalState.ui, searchModalOpen: open }
    };
    notifyListeners();
  },

  setFilterModalOpen: (open) => {
    globalState = {
      ...globalState,
      ui: { ...globalState.ui, filterModalOpen: open }
    };
    notifyListeners();
  },

  // Loading states
  setLoading: (key, loading) => {
    globalState = {
      ...globalState,
      ui: {
        ...globalState.ui,
        loadingStates: { ...globalState.ui.loadingStates, [key]: loading }
      }
    };
    notifyListeners();
  },

  setError: (key, error) => {
    globalState = {
      ...globalState,
      ui: {
        ...globalState.ui,
        errorStates: { ...globalState.ui.errorStates, [key]: error }
      }
    };
    notifyListeners();
  },

  // User preferences
  setUserPreferences: (preferences) => {
    globalState = {
      ...globalState,
      userPreferences: { ...globalState.userPreferences, ...preferences },
      lastUpdated: { ...globalState.lastUpdated, preferences: Date.now() }
    };
    notifyListeners();
    persistData();
  },

  setTheme: (theme) => {
    globalState = {
      ...globalState,
      userPreferences: { ...globalState.userPreferences, theme },
      lastUpdated: { ...globalState.lastUpdated, preferences: Date.now() }
    };
    notifyListeners();
    persistData();

    // Apply theme immediately
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  // Cache management
  updateCacheValidity: (key, valid) => {
    globalState = {
      ...globalState,
      cacheValidity: { ...globalState.cacheValidity, [key]: valid }
    };
    notifyListeners();
  },

  isCacheValid: (key, maxAge = 5 * 60 * 1000) => {
    const lastUpdated = globalState.lastUpdated[key];
    if (!lastUpdated) return false;

    const age = Date.now() - lastUpdated;
    return age < maxAge && globalState.cacheValidity[key] !== false;
  },

  // Utility actions
  reset: () => {
    globalState = defaultState;
    notifyListeners();
    persistData();
  },

  hydrate: (partialState) => {
    globalState = { ...globalState, ...partialState };
    notifyListeners();
    persistData();
  }
};

// Helper functions
function notifyListeners() {
  listeners.forEach(listener => listener());
}

function persistData() {
  if (typeof localStorage !== 'undefined') {
    try {
      const dataToPersist = {
        favorites: globalState.favorites,
        userPreferences: globalState.userPreferences,
        filters: globalState.filters
      };
      localStorage.setItem('casino-store', JSON.stringify(dataToPersist));
    } catch (error) {
      console.error('Failed to persist casino data:', error);
    }
  }
}

// Hook to use the casino store
export function useCasinoStore() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    state: globalState,
    actions
  };
}

// Selectors for optimized re-renders
export function useCasinoSelectors() {
  const { state, actions } = useCasinoStore();

  // Computed values
  const favoriteCasinos = state.casinos.filter(casino => state.favorites.includes(casino.id));

  const filteredCasinos = state.casinos.filter(casino => {
    // Apply filters
    if (state.filters.filter === 'high-rated' && (casino.rating || 0) < 7) return false;
    if (state.filters.filter === 'new') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      if (new Date(casino.created_at) < threeMonthsAgo) return false;
    }
    if (state.filters.query && !casino.name.toLowerCase().includes(state.filters.query.toLowerCase())) {
      return false;
    }
    return true;
  });

  return {
    casinos: state.casinos,
    favorites: state.favorites,
    filters: state.filters,
    userPreferences: state.userPreferences,
    ui: state.ui,
    favoriteCasinos,
    filteredCasinos
  };
}

// Hooks for specific casino operations
export function useCasinoFavorites() {
  const { state, actions } = useCasinoStore();

  return {
    favorites: state.favorites,
    addFavorite: actions.addFavorite,
    removeFavorite: actions.removeFavorite,
    toggleFavorite: actions.toggleFavorite,
    isFavorite: actions.isFavorite
  };
}

export function useCasinoFilters() {
  const { state, actions } = useCasinoStore();

  return {
    filters: state.filters,
    setFilters: actions.setFilters,
    resetFilters: actions.resetFilters,
    applySearch: actions.applySearch
  };
}

export function useCasinoUI() {
  const { state, actions } = useCasinoStore();

  return {
    ui: state.ui,
    setMobileMenuOpen: actions.setMobileMenuOpen,
    setSearchModalOpen: actions.setSearchModalOpen,
    setFilterModalOpen: actions.setFilterModalOpen,
    setLoading: actions.setLoading,
    setError: actions.setError
  };
}

export function useCasinoCache() {
  const { state, actions } = useCasinoStore();

  return {
    updateCacheValidity: actions.updateCacheValidity,
    isCacheValid: actions.isCacheValid,
    lastUpdated: state.lastUpdated
  };
}

// Performance monitoring for store
export function useStorePerformance() {
  const [metrics, setMetrics] = useState({
    renders: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    setMetrics(prev => {
      const renderTime = performance.now() - startTime;
      const newRenders = prev.renders + 1;
      const newAverage = ((prev.averageRenderTime * prev.renders) + renderTime) / newRenders;

      return {
        renders: newRenders,
        lastRenderTime: renderTime,
        averageRenderTime: newAverage
      };
    });
  }, []);

  return metrics;
}

// Export types for external use
export type { CasinoState, CasinoActions, CasinoFilters, UserPreferences, UIState }
