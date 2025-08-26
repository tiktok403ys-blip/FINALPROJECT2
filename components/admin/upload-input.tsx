"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, CheckCircle2 } from "lucide-react"
import { logger } from "@/lib/logger"

interface UploadInputProps {
  bucket?: string
  folder?: string
  onUploaded: (publicUrl: string) => void
  label?: string
  allowedMime?: string[]
  maxSizeMB?: number
  onError?: (message: string) => void
  showPreview?: boolean
}

export function UploadInput({
  bucket = "assets",
  folder = "uploads",
  onUploaded,
  label = "Upload",
  allowedMime = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  maxSizeMB = 2,
  onError,
  showPreview = true,
}: UploadInputProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploadedInfo, setUploadedInfo] = useState<{ name: string; size: number; url: string } | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget
    const file = inputEl.files?.[0]
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
      setUploadedInfo({ name: file.name, size: file.size, url: data.publicUrl })
    } catch (err) {
      logger.error("Upload failed", err as Error)
      onError ? onError("Upload failed. Please try again.") : alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      // reset value to allow same file re-select
      if (inputEl) inputEl.value = ""
    }
  }

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
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
      <span className="text-xs text-gray-400">Max {maxSizeMB}MB · {allowedMime.map((m) => m.split("/")[1].toUpperCase()).join("/")}</span>
      {uploadedInfo && (
        <span className="flex items-center gap-1 text-xs text-[#00ff88]">
          <CheckCircle2 className="w-4 h-4" />
          Done ({(uploadedInfo.size / 1024).toFixed(0)} KB)
          {showPreview && (
            <a href={uploadedInfo.url} target="_blank" rel="noreferrer" className="ml-2 underline text-gray-300">View</a>
          )}
        </span>
      )}
    </div>
  )
}


