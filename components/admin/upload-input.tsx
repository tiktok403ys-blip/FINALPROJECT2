"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"

interface UploadInputProps {
  bucket?: string
  folder?: string
  onUploaded: (publicUrl: string) => void
  label?: string
  allowedMime?: string[]
  maxSizeMB?: number
  onError?: (message: string) => void
}

export function UploadInput({
  bucket = "assets",
  folder = "uploads",
  onUploaded,
  label = "Upload",
  allowedMime = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  maxSizeMB = 2,
  onError,
}: UploadInputProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (allowedMime.length > 0 && !allowedMime.includes(file.type)) {
      const msg = `Invalid file type: ${file.type}. Allowed: ${allowedMime.join(", ")}`
      onError ? onError(msg) : alert(msg)
      e.currentTarget.value = ""
      return
    }
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      const msg = `File is too large. Max ${maxSizeMB}MB`
      onError ? onError(msg) : alert(msg)
      e.currentTarget.value = ""
      return
    }
    setUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: "3600", upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
      onUploaded(data.publicUrl)
    } catch (err) {
      console.error("Upload failed", err)
      onError ? onError("Upload failed. Please try again.") : alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      // reset value to allow same file re-select
      e.currentTarget.value = ""
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} accept={allowedMime.join(',')} />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        variant="outline"
        className="border-[#00ff88] text-[#00ff88] bg-transparent"
      >
        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {uploading ? "Uploading..." : label}
      </Button>
    </div>
  )
}


