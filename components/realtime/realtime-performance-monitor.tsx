// Realtime Performance Monitor Component
// Monitors and displays realtime connection performance metrics

'use client'

import React, { useEffect, useState } from 'react'
import { useRealtimeCasinoContext } from '@/components/providers/realtime-casino-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Wifi,
  WifiOff,
  Clock,
  Database,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react'

interface PerformanceMetrics {
  connectionUptime: number
  messagesReceived: number
  averageLatency: number
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
  lastUpdateAge: number
  cacheHitRate: number
}

interface RealtimePerformanceMonitorProps {
  showDetailedMetrics?: boolean
  showConnectionHistory?: boolean
  onPerformanceIssue?: (issue: string) => void
  refreshInterval?: number
}

export function RealtimePerformanceMonitor({
  showDetailedMetrics = false,
  showConnectionHistory = false,
  onPerformanceIssue,
  refreshInterval = 5000
}: RealtimePerformanceMonitorProps) {
  const {
    isConnected,
    isConnecting,
    error,
    lastUpdate,
    totalCasinos,
    cacheTimestamp,
    connectionUptime,
    messagesReceived,
    invalidateCache
  } = useRealtimeCasinoContext()

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    connectionUptime: 0,
    messagesReceived: 0,
    averageLatency: 0,
    connectionQuality: 'good',
    lastUpdateAge: 0,
    cacheHitRate: 100
  })

  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: number
    status: 'connected' | 'disconnected' | 'error'
    latency?: number
  }>>([])

  // Calculate performance metrics
  useEffect(() => {
    const now = Date.now()
    const lastUpdateAge = lastUpdate > 0 ? now - lastUpdate : 0
    const averageLatency = messagesReceived > 0 ? lastUpdateAge / messagesReceived : 0

    // Determine connection quality based on multiple factors
    let connectionQuality: PerformanceMetrics['connectionQuality'] = 'excellent'

    if (!isConnected) {
      connectionQuality = 'poor'
    } else if (lastUpdateAge > 30000) { // 30 seconds
      connectionQuality = 'poor'
    } else if (lastUpdateAge > 10000) { // 10 seconds
      connectionQuality = 'fair'
    } else if (lastUpdateAge > 5000) { // 5 seconds
      connectionQuality = 'good'
    } else {
      connectionQuality = 'excellent'
    }

    // Calculate cache hit rate (simplified)
    const cacheAge = cacheTimestamp ? (now - cacheTimestamp) / 1000 : 0
    const cacheHitRate = cacheAge < 300 ? 95 : cacheAge < 600 ? 85 : 75 // seconds

    setMetrics({
      connectionUptime,
      messagesReceived,
      averageLatency,
      connectionQuality,
      lastUpdateAge,
      cacheHitRate
    })

    // Track connection history
    if (showConnectionHistory) {
      setConnectionHistory(prev => {
        const newEntry = {
          timestamp: now,
          status: isConnected ? 'connected' as const : error ? 'error' as const : 'disconnected' as const,
          latency: averageLatency
        }

        // Keep only last 50 entries
        return [...prev.slice(-49), newEntry]
      })
    }
  }, [isConnected, lastUpdate, messagesReceived, connectionUptime, cacheTimestamp, error, showConnectionHistory])

  // Alert on performance issues
  useEffect(() => {
    if (metrics.connectionQuality === 'poor' && onPerformanceIssue) {
      onPerformanceIssue('Poor connection quality detected')
    }

    if (metrics.lastUpdateAge > 60000 && onPerformanceIssue) { // 1 minute
      onPerformanceIssue('Realtime updates delayed')
    }
  }, [metrics.connectionQuality, metrics.lastUpdateAge, onPerformanceIssue])

  // Auto-refresh metrics
  useEffect(() => {
    const interval = setInterval(() => {
      // Force metrics recalculation
      const now = Date.now()
      setMetrics(prev => ({
        ...prev,
        lastUpdateAge: lastUpdate > 0 ? now - lastUpdate : prev.lastUpdateAge,
        connectionUptime: connectionUptime + refreshInterval
      }))
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [lastUpdate, connectionUptime, refreshInterval])

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400 bg-green-400/10'
      case 'good': return 'text-blue-400 bg-blue-400/10'
      case 'fair': return 'text-yellow-400 bg-yellow-400/10'
      case 'poor': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
  }

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Realtime Performance
            <Badge className={`${getQualityColor(metrics.connectionQuality)} border-0`}>
              {metrics.connectionQuality}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  isConnected ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              <div className="text-xs text-gray-400">Status</div>
            </div>

            <div className="text-center">
              <div className="text-white font-mono text-sm mb-1">
                {formatUptime(metrics.connectionUptime)}
              </div>
              <div className="text-xs text-gray-400">Uptime</div>
            </div>

            <div className="text-center">
              <div className="text-white font-mono text-sm mb-1">
                {metrics.messagesReceived}
              </div>
              <div className="text-xs text-gray-400">Updates</div>
            </div>

            <div className="text-center">
              <div className="text-white font-mono text-sm mb-1">
                {formatTime(metrics.averageLatency)}
              </div>
              <div className="text-xs text-gray-400">Avg Latency</div>
            </div>
          </div>

          {showDetailedMetrics && (
            <>
              <div className="border-t border-gray-700 mt-4 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Last Update</div>
                    <div className="text-white">
                      {metrics.lastUpdateAge > 0 ? formatTime(metrics.lastUpdateAge) : 'Never'}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 mb-1">Cache Hit Rate</div>
                    <div className="text-white">{metrics.cacheHitRate.toFixed(1)}%</div>
                  </div>

                  <div>
                    <div className="text-gray-400 mb-1">Total Casinos</div>
                    <div className="text-white">{totalCasinos}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={invalidateCache}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Cache
                </Button>

                {metrics.connectionQuality === 'poor' && (
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Performance Issue
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Connection History */}
      {showConnectionHistory && connectionHistory.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Connection History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {connectionHistory.slice(-20).map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {entry.status === 'connected' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : entry.status === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={
                      entry.status === 'connected' ? 'text-green-400' :
                      entry.status === 'error' ? 'text-red-400' : 'text-gray-400'
                    }>
                      {entry.status}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Alerts */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Connection Error</span>
            </div>
            <p className="text-red-300 mt-1 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RealtimePerformanceMonitor
