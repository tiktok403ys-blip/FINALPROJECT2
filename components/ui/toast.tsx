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
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-3 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:p-6 md:max-w-[440px] lg:max-w-[480px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-4 overflow-hidden rounded-2xl border p-5 pr-12 backdrop-blur-2xl transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:p-[1px] before:-z-10",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90 text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border-slate-400/20 before:from-slate-400/30 before:via-slate-500/20 before:to-slate-400/30",
        success: "bg-gradient-to-br from-emerald-950/90 via-green-900/85 to-emerald-950/90 text-white shadow-[0_25px_50px_-12px_rgba(16,185,129,0.4)] border-emerald-400/30 before:from-emerald-400/40 before:via-green-500/30 before:to-emerald-400/40",
        error: "bg-gradient-to-br from-red-950/90 via-red-900/85 to-red-950/90 text-white shadow-[0_25px_50px_-12px_rgba(239,68,68,0.4)] border-red-400/30 before:from-red-400/40 before:via-red-500/30 before:to-red-400/40",
        warning: "bg-gradient-to-br from-amber-950/90 via-yellow-900/85 to-amber-950/90 text-white shadow-[0_25px_50px_-12px_rgba(245,158,11,0.4)] border-amber-400/30 before:from-amber-400/40 before:via-yellow-500/30 before:to-amber-400/40",
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
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 text-sm font-medium text-white transition-all duration-300 hover:bg-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:pointer-events-none disabled:opacity-50",
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
      "absolute right-3 top-3 rounded-full p-1.5 text-white/60 opacity-0 transition-all duration-300 hover:text-white hover:bg-white/10 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/30 group-hover:opacity-100 backdrop-blur-sm",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-bold tracking-tight leading-tight text-white", className)}
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
    className={cn("text-sm text-white/80 leading-relaxed mt-1", className)}
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
      return <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
    default:
      return <Info className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
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
            <div className="flex-1 grid gap-1">
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
