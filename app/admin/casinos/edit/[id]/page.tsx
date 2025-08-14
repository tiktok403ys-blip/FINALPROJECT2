"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { FormShell } from "@/components/admin/forms/form-shell"
import { TextField, TextAreaField } from "@/components/admin/forms/fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UploadInput } from "@/components/admin/upload-input"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save, Upload } from "lucide-react"
import Link from "next/link"

interface EditCasinoPageProps {
  params: Promise<{ id: string }>
}

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  description: z.string().optional().default(""),
  rating: z
    .string()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 5), {
      message: "Rating must be between 0 and 5",
    }),
  location: z.string().optional().default(""),
  bonus_info: z.string().optional().default(""),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  logo_url: z.string().optional().default(""),
})

type FormValues = z.infer<typeof schema>

export default function EditCasinoPage({ params }: EditCasinoPageProps) {
  const [casinoId, setCasinoId] = useState<string>("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [prevLogoPath, setPrevLogoPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCasinoId(resolvedParams.id)
      fetchCasino(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchCasino = async (id: string) => {
    const { data, error } = await supabase.from("casinos").select("*").eq("id", id).single()

      if (error) {
      setError("Casino not found")
      return
    }

    if (data) {
      reset({
        name: data.name || "",
        description: data.description || "",
        rating: data.rating?.toString() || "",
        location: data.location || "",
        bonus_info: data.bonus_info || "",
        website_url: data.website_url || "",
        logo_url: data.logo_url || "",
      })
      setPrevLogoPath(parseAssetsPath(data.logo_url || ""))
    }
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase
        .from("casinos")
        .update({ ...values, rating: values.rating ? Number(values.rating) : null })
        .eq("id", casinoId)

      if (error) {
        setError(error.message)
      } else {
        // Housekeeping: remove old logo if replaced
        const newPath = parseAssetsPath(values.logo_url || "")
        if (prevLogoPath && newPath !== prevLogoPath) {
          await supabase.storage.from("assets").remove([prevLogoPath])
        }
        router.push("/admin/casinos")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const generateLogoUrl = () => {
    const currentName = (watch("name") || "").toString()
    const name = currentName.replace(/\s+/g, "+")
    const colors = [
      { bg: "1a1a2e", color: "16213e" },
      { bg: "0f3460", color: "16537e" },
      { bg: "533483", color: "7209b7" },
      { bg: "f39801", color: "f39c12" },
      { bg: "00ff88", color: "000000" },
      { bg: "2c3e50", color: "ecf0f1" },
      { bg: "8e44ad", color: "ffffff" },
      { bg: "e74c3c", color: "ffffff" },
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const logoUrl = `/placeholder.svg?height=80&width=200&text=${name}&bg=${randomColor.bg}&color=${randomColor.color}`
    setValue("logo_url", logoUrl)
  }

  function parseAssetsPath(url: string): string | null {
    const marker = "/storage/v1/object/public/assets/"
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.substring(idx + marker.length)
  }

  return (
    <FormShell
      title="Edit Casino"
      description="Update casino information and logo"
      headerExtra={
        <Button variant="ghost" asChild className="text-white">
          <Link href="/admin/casinos">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Casinos
          </Link>
        </Button>
      }
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Logo Preview and URL */}
            <div className="space-y-4">
              <label className="text-white text-sm font-medium">Casino Logo</label>

              {/* Logo URL Input */}
            <div className="flex gap-2 items-center">
              <Input {...register("logo_url")} className="bg-white/5 border-white/10 text-white placeholder-gray-400" placeholder="Logo URL or leave empty to auto-generate" />
              <UploadInput folder="casinos/logos" onUploaded={(url) => setValue("logo_url", url)} label="Upload Logo" />
              <Button type="button" variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" onClick={generateLogoUrl}>
                <Upload className="w-4 h-4 mr-2" /> Generate
              </Button>
            </div>
              <p className="text-gray-400 text-xs">
                Upload your logo to Supabase Storage or use the generate button for a placeholder logo
              </p>
            </div>

          <div className="grid md:grid-cols-2 gap-4">
            <TextField label="Casino Name *" {...register("name")} error={errors.name?.message} placeholder="Enter casino name" />
            <TextField
              label="Rating (0-5)"
              {...register("rating")}
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="4.5"
              error={errors.rating?.message}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <TextField label="Location" {...register("location")} placeholder="Malta, Curacao, etc." />
            <TextField label="Website URL" {...register("website_url")} type="url" placeholder="https://casino.com" error={errors.website_url?.message} />
          </div>

          <TextAreaField label="Description" {...register("description")} className="min-h-[100px]" placeholder="Describe the casino..." />
          <TextAreaField label="Bonus Information" {...register("bonus_info")} className="min-h-[80px]" placeholder="Welcome bonus details..." />

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                {loading ? (
                  "Updating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Casino
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
                <Link href="/admin/casinos">Cancel</Link>
              </Button>
            </div>
      </form>
    </FormShell>
  )
}
