"use client"

import React, { useState, useEffect, useContext } from 'react'
import { useMobileFirst } from '@/hooks/use-mobile-first'

interface QueryProviderProps {
  children: React.ReactNode
}

// Simple context for mobile-first state management
const MobileFirstContext = React.createContext<{
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isOnline: boolean;
  connectionType: string;
}>({
  isMobile: false,
  isTablet: false,
  isDesktop: false,
  isOnline: true,
  connectionType: 'unknown'
});

export function QueryProvider({ children }: QueryProviderProps) {
  const { isMobile, isTablet, isDesktop } = useMobileFirst()
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState('unknown')

  // Network status monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine)

      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setConnectionType(connection.effectiveType || 'unknown')
      }
    }

    updateNetworkStatus()

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', updateNetworkStatus)
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)

      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [])

  const contextValue = {
    isMobile,
    isTablet,
    isDesktop,
    isOnline,
    connectionType
  }

  return (
    <MobileFirstContext.Provider value={contextValue}>
      {children}
    </MobileFirstContext.Provider>
  )
}

// Hook for casino queries
export function useCasinoQueries() {
  // Simple implementation without React Query for now
  return {
    // Placeholder for future query hooks
  }
}

// Hook for network status using context
export function useNetworkStatus() {
  const context = useContext(MobileFirstContext)

  if (!context) {
    throw new Error('useNetworkStatus must be used within a QueryProvider')
  }

  return {
    isOnline: context.isOnline,
    connectionType: context.connectionType,
    isMobile: context.isMobile,
    isTablet: context.isTablet,
    isDesktop: context.isDesktop,
    isLoading: false,
    // Computed values
    isSlowConnection: context.connectionType === 'slow-2g' || context.connectionType === '2g',
    saveData: false, // Not implemented yet
    shouldReduceQuality: context.isMobile && (context.connectionType === 'slow-2g' || context.connectionType === '2g')
  }
}

// Hook to access mobile-first context
export function useMobileFirstContext() {
  const context = useContext(MobileFirstContext)

  if (!context) {
    throw new Error('useMobileFirstContext must be used within a QueryProvider')
  }

  return context
}

