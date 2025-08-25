// Komponen untuk menampilkan status koneksi realtime
// Memberikan feedback visual kepada user tentang status realtime connection

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
    if (isConnecting) return 'Menghubungkan...'
    if (error) return 'Koneksi bermasalah'
    if (isConnected) return 'Terhubung'
    return 'Tidak terhubung'
  }

  const getLastUpdateText = () => {
    if (!lastUpdate || !isConnected) return ''
    
    const now = Date.now()
    const diff = now - lastUpdate
    
    if (diff < 60000) { // < 1 menit
      return 'Baru saja'
    } else if (diff < 3600000) { // < 1 jam
      const minutes = Math.floor(diff / 60000)
      return `${minutes} menit lalu`
    } else {
      const hours = Math.floor(diff / 3600000)
      return `${hours} jam lalu`
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

// Komponen mini untuk header atau toolbar
export function RealtimeConnectionIndicator({ className }: { className?: string }) {
  return (
    <RealtimeConnectionStatus 
      className={className}
      showText={false}
      size="sm"
    />
  )
}

// Komponen dengan tooltip untuk informasi detail
export function RealtimeConnectionTooltip({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting, error, lastUpdate } = useRealtimeCasinoStatus()
  
  const getTooltipContent = () => {
    if (isConnecting) {
      return 'Sedang menghubungkan ke server realtime...'
    }
    
    if (error) {
      return `Koneksi bermasalah: ${error}`
    }
    
    if (isConnected) {
      const lastUpdateText = lastUpdate > 0 
        ? new Date(lastUpdate).toLocaleTimeString('id-ID')
        : 'Belum ada update'
      return `Terhubung ke realtime. Update terakhir: ${lastUpdateText}`
    }
    
    return 'Tidak terhubung ke server realtime'
  }

  return (
    <div title={getTooltipContent()}>
      {children}
    </div>
  )
}