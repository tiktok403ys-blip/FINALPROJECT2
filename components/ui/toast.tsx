"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-3 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:p-4 max-w-[280px] sm:max-w-[320px] md:max-w-[340px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-2 sm:space-x-3 overflow-hidden rounded-lg sm:rounded-xl border p-2.5 sm:p-3 pr-7 sm:pr-9 backdrop-blur-2xl transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-2xl data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full before:absolute before:inset-0 before:rounded-lg sm:before:rounded-xl before:bg-gradient-to-r before:p-[0.5px] sm:before:p-[1px] before:-z-10 after:absolute after:inset-[0.5px] sm:after:inset-[1px] after:rounded-lg sm:after:rounded-xl after:bg-gradient-to-br after:opacity-40 after:-z-10",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90 text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] sm:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] border-slate-400/25 before:from-slate-400/30 before:via-slate-500/20 before:to-slate-400/30 after:from-slate-800/60 after:via-slate-700/40 after:to-slate-800/60",
        success: "bg-gradient-to-br from-blue-950/90 via-blue-900/85 to-indigo-950/90 text-white shadow-[0_4px_20px_-4px_rgba(59,130,246,0.25)] sm:shadow-[0_8px_32px_-8px_rgba(59,130,246,0.3)] border-blue-400/30 before:from-blue-400/35 before:via-indigo-500/25 before:to-blue-400/35 after:from-blue-900/60 after:via-indigo-800/40 after:to-blue-900/60",
        error: "bg-gradient-to-br from-red-950/90 via-red-900/85 to-red-950/90 text-white shadow-[0_4px_20px_-4px_rgba(239,68,68,0.25)] sm:shadow-[0_8px_32px_-8px_rgba(239,68,68,0.3)] border-red-400/30 before:from-red-400/35 before:via-red-500/25 before:to-red-400/35 after:from-red-900/60 after:via-red-800/40 after:to-red-900/60",
        warning: "bg-gradient-to-br from-amber-950/90 via-yellow-900/85 to-amber-950/90 text-white shadow-[0_4px_20px_-4px_rgba(245,158,11,0.25)] sm:shadow-[0_8px_32px_-8px_rgba(245,158,11,0.3)] border-amber-400/30 before:from-amber-400/35 before:via-yellow-500/25 before:to-amber-400/35 after:from-amber-900/60 after:via-yellow-800/40 after:to-amber-900/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-6 sm:h-7 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/15 backdrop-blur-sm px-2 sm:px-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-white/25 hover:scale-105 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-1.5 sm:right-2 top-1.5 sm:top-2 rounded-full p-0.5 sm:p-1 text-white/60 opacity-0 transition-all duration-200 hover:text-white hover:bg-white/15 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-white/40 group-hover:opacity-100 backdrop-blur-sm",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-xs sm:text-sm font-semibold tracking-tight leading-tight text-white", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-xs text-white/75 leading-snug mt-0.5", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>



import { useToast } from "@/hooks/use-toast"

const getToastIcon = (variant?: string) => {
  switch (variant) {
    case "success":
      return <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0 mt-0.5" />
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400 flex-shrink-0 mt-0.5" />
    case "warning":
      return <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 flex-shrink-0 mt-0.5" />
    default:
      return <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0 mt-0.5" />
  }
}

const Toaster = () => {
  const { toasts } = useToast()

  return (
    <ToastPrimitives.Provider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            {getToastIcon(variant)}
            <div className="flex-1 grid gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastPrimitives.Provider>
  )
}

export {
  type ToastProps,
  type ToastActionElement,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  Toaster,
}
