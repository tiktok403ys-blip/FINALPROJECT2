"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

interface ToastOptions {
  description?: string
  className?: string
}

interface ToastPromiseOptions {
  loading: string
  success: string
  error: string
}

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      duration={3000}
      closeButton
      richColors

      {...props}
    />
  )
}

// Enhanced Toast Functions with Glass Card Theme
// Provides consistent, type-safe toast notifications with glass card styling
import { toast as sonnerToast } from "sonner"

export const toast = {
  success: (message: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return sonnerToast.success(message, {
      description,
      ...options,
      style: {
        backdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: 'white',
        ...options?.className && { className: options.className }
      } as any
    })
  },

  error: (message: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return sonnerToast.error(message, {
      description,
      ...options,
      style: {
        backdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: 'white',
        ...options?.className && { className: options.className }
      } as any
    })
  },

  warning: (message: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return sonnerToast.warning(message, {
      description,
      ...options,
      style: {
        backdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(234, 179, 8, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: 'white',
        ...options?.className && { className: options.className }
      } as any
    })
  },

  info: (message: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return sonnerToast.info(message, {
      description,
      ...options,
      style: {
        backdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: 'white',
        ...options?.className && { className: options.className }
      } as any
    })
  },

  promise: (promise: Promise<any>, options: ToastPromiseOptions & { className?: string }) => {
    return sonnerToast.promise(promise, {
      ...options,
      style: {
        backdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: 'white'
      },
      className: options.className
    } as any)
  }
}

// Legacy toast functions for backward compatibility
export const legacyToast = sonnerToast

export { Toaster }