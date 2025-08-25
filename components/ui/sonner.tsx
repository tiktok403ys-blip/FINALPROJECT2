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
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:backdrop-filter group-[.toaster]:backdrop-blur-xl group-[.toaster]:saturate-180 group-[.toaster]:bg-black/50 group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-white/20 group-[.toaster]:rounded-xl group-[.toaster]:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] group-[.toaster]:transition-all group-[.toaster]:duration-300",
          title: "group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:text-sm",
          description: "group-[.toast]:text-gray-300 group-[.toast]:text-xs group-[.toast]:mt-1",
          actionButton: "group-[.toast]:bg-[#00ff88] group-[.toast]:text-black group-[.toast]:hover:bg-[#00ff88]/90 group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-xs group-[.toast]:transition-all group-[.toast]:duration-200 group-[.toast]:shadow-lg group-[.toast]:hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]",
          cancelButton: "group-[.toast]:bg-gray-700/80 group-[.toast]:text-gray-300 group-[.toast]:hover:bg-gray-600/90 group-[.toast]:backdrop-blur-sm group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-xs group-[.toast]:transition-all group-[.toast]:duration-200",
          closeButton: "group-[.toast]:text-gray-400 group-[.toast]:hover:text-white group-[.toast]:transition-all group-[.toast]:duration-200 group-[.toast]:backdrop-blur-sm",
          success: "group-[.toast]:border-green-500/30 group-[.toast]:shadow-[0_0_20px_rgba(34,197,94,0.1)]",
          error: "group-[.toast]:border-red-500/30 group-[.toast]:shadow-[0_0_20px_rgba(239,68,68,0.1)]",
          warning: "group-[.toast]:border-yellow-500/30 group-[.toast]:shadow-[0_0_20px_rgba(234,179,8,0.1)]",
          info: "group-[.toast]:border-blue-500/30 group-[.toast]:shadow-[0_0_20px_rgba(59,130,246,0.1)]",
        },

      }}
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
      className: `border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)] ${options?.className || ''}`.trim()
    })
  },

  error: (message: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return sonnerToast.error(message, {
      description,
      ...options,
      className: `border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] ${options?.className || ''}`.trim()
    })
  },

  warning: (message: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return sonnerToast.warning(message, {
      description,
      ...options,
      className: `border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)] ${options?.className || ''}`.trim()
    })
  },

  info: (message: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return sonnerToast.info(message, {
      description,
      ...options,
      className: `border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] ${options?.className || ''}`.trim()
    })
  },

  promise: (promise: Promise<any>, options: ToastPromiseOptions & { className?: string }) => {
    return sonnerToast.promise(promise, {
      ...options,
      className: `border-white/20 ${options.className || ''}`.trim()
    })
  }
}

// Legacy toast functions for backward compatibility
export const legacyToast = sonnerToast

export { Toaster }