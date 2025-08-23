"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

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
          toast: "group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-gray-700 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-sm",
          title: "group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:text-sm",
          description: "group-[.toast]:text-gray-300 group-[.toast]:text-xs group-[.toast]:mt-1",
          actionButton: "group-[.toast]:bg-[#00ff88] group-[.toast]:text-black group-[.toast]:hover:bg-[#00ff88]/90 group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-xs group-[.toast]:transition-colors",
          cancelButton: "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300 group-[.toast]:hover:bg-gray-600 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-xs group-[.toast]:transition-colors",
          closeButton: "group-[.toast]:text-gray-400 group-[.toast]:hover:text-white group-[.toast]:transition-colors",
        },
        style: {
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95))',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }
      }}
      {...props}
    />
  )
}

export { Toaster }