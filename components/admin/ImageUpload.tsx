'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  bucket: string
  folder?: string
  accept?: string
  maxSize?: number // in MB
  className?: string
  placeholder?: string
  placeholderBgColor?: string
  label?: string
}

export default function ImageUpload({
  value,
  onChange,
  bucket,
  folder = '',
  accept = 'image/*',
  maxSize = 5,
  className = '',
  placeholder = 'Upload gambar',
  placeholderBgColor = '#1f2937',
  label
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const uploadFile = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${maxSize}MB`)
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      onChange(publicUrl)
      toast.success('Gambar berhasil diupload')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Gagal mengupload gambar')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const removeImage = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {value ? (
        <div className="relative group">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <Image
              src={value}
              alt="Uploaded image"
              width={400}
              height={192}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <button
                onClick={removeImage}
                className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors duration-200"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${dragActive 
              ? 'border-blue-400 bg-blue-500/10' 
              : 'hover:bg-white/10'
            }
            backdrop-blur-sm cursor-pointer
          `}
          style={{
            borderColor: dragActive ? '#60a5fa' : placeholderBgColor + '60',
            backgroundColor: dragActive ? '#3b82f620' : placeholderBgColor + '10'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          <div className="flex flex-col items-center space-y-4">
            {uploading ? (
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            ) : (
              <div 
                className="p-4 rounded-full"
                style={{ backgroundColor: placeholderBgColor + '40' }}
              >
                <Upload className="w-8 h-8 text-white/70" />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-white/90 font-medium">
                {uploading ? 'Mengupload...' : (label || placeholder)}
              </p>
              <p className="text-white/60 text-sm">
                Drag & drop atau klik untuk memilih file
              </p>
              <p className="text-white/40 text-xs">
                Maksimal {maxSize}MB • Format: JPG, PNG, GIF
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}