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
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-3 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:p-4",
      // Mobile-first responsive widths
      "max-w-[calc(100vw-1.5rem)] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[380px]",
      // Safe area handling for mobile devices
      "top-[max(1rem,env(safe-area-inset-top))]",
      "right-[max(0.75rem,env(safe-area-inset-right))]",
      "bottom-[max(0.75rem,env(safe-area-inset-bottom))]",
      "left-[max(0.75rem,env(safe-area-inset-left))]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-2 sm:space-x-3 overflow-hidden rounded-xl border p-3 pr-9 backdrop-filter backdrop-blur-xl saturate-180 transition-all duration-300 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-black/50 via-slate-900/45 to-black/50 text-white border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.15)]",
        success: "bg-gradient-to-br from-black/50 via-green-900/45 to-emerald-900/45 text-white border-green-400/30 shadow-[0_25px_50px_-12px_rgba(34,197,94,0.3),0_0_0_1px_rgba(34,197,94,0.1),inset_0_1px_0_rgba(34,197,94,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(34,197,94,0.4),0_0_0_1px_rgba(34,197,94,0.15),inset_0_1px_0_rgba(34,197,94,0.25)]",
        error: "bg-gradient-to-br from-black/50 via-red-900/45 to-red-900/45 text-white border-red-400/30 shadow-[0_25px_50px_-12px_rgba(239,68,68,0.3),0_0_0_1px_rgba(239,68,68,0.1),inset_0_1px_0_rgba(239,68,68,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(239,68,68,0.4),0_0_0_1px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(239,68,68,0.25)]",
        warning: "bg-gradient-to-br from-black/50 via-amber-900/45 to-yellow-900/45 text-white border-amber-400/30 shadow-[0_25px_50px_-12px_rgba(245,158,11,0.3),0_0_0_1px_rgba(245,158,11,0.1),inset_0_1px_0_rgba(245,158,11,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(245,158,11,0.4),0_0_0_1px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(245,158,11,0.25)]",
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
      "inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-black/30 backdrop-filter backdrop-blur-md saturate-180 px-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-white/15 hover:scale-105 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:pointer-events-none disabled:opacity-50 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.4)]",
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
      "absolute right-2 top-2 rounded-full p-1 text-white/60 opacity-0 transition-all duration-200 hover:text-white hover:bg-white/15 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-white/40 group-hover:opacity-100 backdrop-filter backdrop-blur-md saturate-180 border border-white/10",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
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
      return <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5 drop-shadow-[0_2px_4px_rgba(34,197,94,0.3)]" />
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5 drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5 drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]" />
    default:
      return <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5 drop-shadow-[0_2px_4px_rgba(148,163,184,0.3)]" />
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
