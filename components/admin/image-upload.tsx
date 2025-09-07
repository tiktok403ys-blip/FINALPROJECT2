"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (bucketPath: string) => void
  bucket: string
  className?: string
  label?: string
  cacheControlSeconds?: number
}

export function ImageUpload({ value, onChange, bucket, className, label, cacheControlSeconds = 31536000 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: String(cacheControlSeconds), upsert: false })

      if (uploadError) {
        throw uploadError
      }

      const bucketPath = `${bucket}/${filePath}`
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      onChange(bucketPath)
      toast.success('Image Uploaded', 'Image has been successfully uploaded to storage')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Upload Failed', 'Unable to upload image. Please check file format and size.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    onChange('')
  }

  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium text-white mb-2 block">
          {label}
        </Label>
      )}
      
      {value ? (
        <div className="relative">
          <Image
            src={value}
            alt="Uploaded image"
            width={128}
            height={128}
            className="w-32 h-32 object-cover rounded-lg border border-white/20"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-white/20 rounded-lg">
            <ImageIcon className="h-8 w-8 text-white/40" />
          </div>
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={uploadImage}
              disabled={uploading}
              className="hidden"
              id={`image-upload-${bucket}`}
            />
            <Label htmlFor={`image-upload-${bucket}`}>
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </span>
              </Button>
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}