// Component to display realtime connection status
// Provides visual feedback to users about realtime connection status

'use client'

import React from 'react'
import { useRealtimeCasinoStatus } from '@/components/providers/realtime-casino-provider'
import { Wifi, WifiOff, RotateCcw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealtimeConnectionStatusProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function RealtimeConnectionStatus({ 
  className, 
  showText = true, 
  size = 'md' 
}: RealtimeConnectionStatusProps) {
  const { isConnected, isConnecting, error, lastUpdate } = useRealtimeCasinoStatus()

  const getStatusIcon = () => {
    if (isConnecting) {
      return <RotateCcw className={cn('animate-spin', getSizeClass())} />
    }
    
    if (error) {
      return <AlertCircle className={getSizeClass()} />
    }
    
    if (isConnected) {
      return <Wifi className={getSizeClass()} />
    }
    
    return <WifiOff className={getSizeClass()} />
  }

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3'
      case 'md': return 'h-4 w-4'
      case 'lg': return 'h-5 w-5'
      default: return 'h-4 w-4'
    }
  }

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-500'
    if (error) return 'text-red-500'
    if (isConnected) return 'text-green-500'
    return 'text-gray-400'
  }

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...'
    if (error) return 'Connection error'
    if (isConnected) return 'Connected'
    return 'Disconnected'
  }

  const getLastUpdateText = () => {
    if (!lastUpdate || !isConnected) return ''
    
    const now = Date.now()
    const diff = now - lastUpdate
    
    if (diff < 60000) { // < 1 minute
      return 'Just now'
    } else if (diff < 3600000) { // < 1 hour
      const minutes = Math.floor(diff / 60000)
      return `${minutes} min ago`
    } else {
      const hours = Math.floor(diff / 3600000)
      return `${hours} hr ago`
    }
  }

  return (
    <div className={cn(
      'flex items-center gap-2',
      className
    )}>
      <div className={cn('flex items-center', getStatusColor())}>
        {getStatusIcon()}
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'text-sm font-medium',
            getStatusColor()
          )}>
            {getStatusText()}
          </span>
          
          {lastUpdate > 0 && isConnected && (
            <span className="text-xs text-gray-500">
              Update: {getLastUpdateText()}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Mini component for header or toolbar
export function RealtimeConnectionIndicator({ className }: { className?: string }) {
  return (
    <RealtimeConnectionStatus 
      className={className}
      showText={false}
      size="sm"
    />
  )
}

// Component with tooltip for detailed information
export function RealtimeConnectionTooltip({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting, error, lastUpdate } = useRealtimeCasinoStatus()
  
  const getTooltipContent = () => {
    if (isConnecting) {
      return 'Connecting to realtime server...'
    }
    
    if (error) {
      return `Connection error: ${error}`
    }
    
    if (isConnected) {
      const lastUpdateText = lastUpdate > 0 
        ? new Date(lastUpdate).toLocaleTimeString('en-US')
        : 'No updates yet'
      return `Connected to realtime. Last update: ${lastUpdateText}`
    }
    
    return 'Not connected to realtime server'
  }

  return (
    <div title={getTooltipContent()}>
      {children}
    </div>
  )
}