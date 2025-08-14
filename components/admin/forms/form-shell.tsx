"use client"

import { ReactNode } from "react"
import { GlassCard } from "@/components/glass-card"

interface FormShellProps {
  title: string
  description?: string
  headerExtra?: ReactNode
  children: ReactNode
}

export function FormShell({ title, description, headerExtra, children }: FormShellProps) {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            {description && <p className="text-gray-400">{description}</p>}
          </div>
          {headerExtra}
        </div>
        <GlassCard className="p-8">{children}</GlassCard>
      </div>
    </div>
  )
}


