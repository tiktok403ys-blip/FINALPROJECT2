"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface FieldProps extends React.ComponentProps<typeof Input> {
  label: string
  error?: string
}

export function TextField({ label, error, className, ...props }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-white text-sm font-medium">{label}</label>
      <Input className={`bg-white/5 border-white/10 text-white ${className || ""}`} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TextAreaFieldProps extends React.ComponentProps<typeof Textarea> {
  label: string
  error?: string
}

export function TextAreaField({ label, error, className, ...props }: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-white text-sm font-medium">{label}</label>
      <Textarea className={`bg-white/5 border-white/10 text-white ${className || ""}`} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}


