'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  onClose: (id: string) => void
}

const toastVariants = {
  success: {
    icon: CheckCircle,
    className: 'border-green-400/30 bg-green-500/10',
    iconColor: 'text-green-400'
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-400/30 bg-red-500/10',
    iconColor: 'text-red-400'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-400/30 bg-yellow-500/10',
    iconColor: 'text-yellow-400'
  },
  info: {
    icon: Info,
    className: 'border-blue-400/30 bg-blue-500/10',
    iconColor: 'text-blue-400'
  }
}

export function SimpleToast({ id, type, title, description, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const variant = toastVariants[type]
  const IconComponent = variant.icon

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, id, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full',
        'transform transition-all duration-300 ease-in-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div
        className={cn(
          'relative p-4 rounded-xl border backdrop-blur-xl',
          'bg-black/50 shadow-2xl',
          variant.className
        )}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/70 hover:text-white" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-3 pr-6">
          <IconComponent className={cn('w-5 h-5 flex-shrink-0 mt-0.5', variant.iconColor)} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
            {description && (
              <p className="text-sm text-white/80 leading-relaxed">{description}</p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-white/40 transition-all duration-300 ease-linear"
            style={{
              width: isVisible ? '100%' : '0%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Toast Container
export function SimpleToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast
    }
    setToasts(prev => [...prev, newToast])
  }, [removeToast])

  // Expose addToast globally
  useEffect(() => {
    ;(window as any).showToast = addToast
    return () => {
      delete (window as any).showToast
    }
  }, [addToast])

  return (
    <>
      {toasts.map(toast => (
        <SimpleToast key={toast.id} {...toast} />
      ))}
    </>
  )
}

// Toast Functions
export const toast = {
  success: (title: string, description?: string, duration?: number) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
      ;(window as any).showToast({ type: 'success', title, description, duration })
    }
  },
  error: (title: string, description?: string, duration?: number) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
      ;(window as any).showToast({ type: 'error', title, description, duration })
    }
  },
  warning: (title: string, description?: string, duration?: number) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
      ;(window as any).showToast({ type: 'warning', title, description, duration })
    }
  },
  info: (title: string, description?: string, duration?: number) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
      ;(window as any).showToast({ type: 'info', title, description, duration })
    }
  }
}
