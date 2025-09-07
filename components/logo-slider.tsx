"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

interface Partner {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description: string | null
}

export function LogoSlider() {
  const [partners, setPartners] = useState<Partner[]>([])
  const supabase = createClient()

  const fetchPartners = useCallback(async () => {
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (data) {
      setPartners(data)
    }
  }, [supabase])

  useEffect(() => {
    fetchPartners()
  }, [fetchPartners])

  if (!partners.length) return null

  return (
    <div className="py-12 overflow-hidden">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Trusted Partners</h3>
        <p className="text-gray-400">Working with industry-leading game providers</p>
      </div>

      <div className="relative">
        <div className="flex animate-scroll space-x-8">
          {/* First set of logos */}
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="flex-shrink-0 w-32 h-16 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors group cursor-pointer"
              title={partner.description || partner.name}
            >
              {partner.logo_url ? (
                <Image
                  src={partner.logo_url || "/placeholder.svg"}
                  alt={partner.name}
                  width={120}
                  height={60}
                  sizes="(max-width: 640px) 96px, 120px"
                  priority={false}
                  className="max-w-full max-h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">
                  {partner.name}
                </span>
              )}
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {partners.map((partner) => (
            <div
              key={`${partner.id}-duplicate`}
              className="flex-shrink-0 w-32 h-16 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors group cursor-pointer"
              title={partner.description || partner.name}
            >
              {partner.logo_url ? (
                <Image
                  src={partner.logo_url || "/placeholder.svg"}
                  alt={partner.name}
                  width={120}
                  height={60}
                  sizes="(max-width: 640px) 96px, 120px"
                  priority={false}
                  className="max-w-full max-h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">
                  {partner.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
