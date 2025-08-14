"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { PaginationControls } from "@/components/admin/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Edit, Trash2, Plus, Search, Eye, EyeOff, ExternalLink } from "lucide-react"
import Image from "next/image"

interface Partner {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description: string | null
  partner_type: string
  display_order: number
  is_active: boolean
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Partner | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 12
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    website_url: "",
    description: "",
    partner_type: "partner",
    display_order: 0,
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchPartners()
  }, [page])

  useEffect(() => {
    const channel = supabase
      .channel("partners-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "partners" }, () => {
        fetchPartners()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPartners = async () => {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data } = await supabase
      .from("partners")
      .select("*")
      .order("display_order", { ascending: true })
      .range(from, to)

    if (data) {
      setPartners(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingItem) {
        const { error } = await supabase.from("partners").update(formData).eq("id", editingItem.id)
        if (!error) {
          setEditingItem(null)
        }
      } else {
        const { error } = await supabase.from("partners").insert(formData)
        if (!error) {
          setShowCreateForm(false)
        }
      }

      setFormData({
        name: "",
        logo_url: "",
        website_url: "",
        description: "",
        partner_type: "partner",
        display_order: 0,
      })
      fetchPartners()
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("partners").update({ is_active: !currentStatus }).eq("id", id)

    if (!error) {
      fetchPartners()
    }
  }

  const deletePartner = async (partner: Partner) => {
    if (confirm("Are you sure you want to delete this partner?")) {
      const { error } = await supabase.from("partners").delete().eq("id", partner.id)
      if (!error) {
        const marker = "/storage/v1/object/public/assets/"
        const idx = (partner.logo_url || '').indexOf(marker)
        if (idx !== -1) {
          const path = (partner.logo_url || '').substring(idx + marker.length)
          await supabase.storage.from("assets").remove([path])
        }
        fetchPartners()
      }
    }
  }

  const startEdit = (partner: Partner) => {
    setEditingItem(partner)
    setFormData({
      name: partner.name,
      logo_url: partner.logo_url || "",
      website_url: partner.website_url || "",
      description: partner.description || "",
      partner_type: partner.partner_type,
      display_order: partner.display_order,
    })
    setShowCreateForm(true)
  }

  const filteredPartners = partners.filter((partner) => partner.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const partnerTypes = ["partner", "sponsor", "affiliate"]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manage Partners</h1>
          <p className="text-gray-400">Edit gaming providers and partner logos</p>
        </div>
        <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
          <a href="/admin/partners/new"><Plus className="w-4 h-4 mr-2" /> Add Partner</a>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Create/Edit moved to dedicated pages */}

      {/* Partners Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => (
          <GlassCard key={partner.id} className="p-6">
            <div className="text-center mb-4">
              <div className="w-24 h-12 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-3">
                {partner.logo_url ? (
                  <Image
                    src={partner.logo_url || "/placeholder.svg"}
                    alt={partner.name}
                    width={96}
                    height={48}
                    className="max-w-full max-h-full object-contain opacity-70"
                  />
                ) : (
                  <span className="text-white/70 text-xs font-medium">{partner.name}</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{partner.name}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    partner.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {partner.is_active ? "Active" : "Inactive"}
                </span>
                <span className="bg-[#00ff88]/20 text-[#00ff88] px-2 py-1 rounded text-xs">{partner.partner_type}</span>
              </div>
              {partner.description && <p className="text-gray-400 text-sm mb-3">{partner.description}</p>}
            </div>

            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={`${
                  partner.is_active
                    ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                    : "border-green-500 text-green-500 hover:bg-green-500/10"
                } bg-transparent`}
                onClick={() => toggleActive(partner.id, partner.is_active)}
              >
                {partner.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              {partner.website_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-500 bg-transparent hover:bg-blue-500/10"
                  asChild
                >
                  <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-[#00ff88] text-[#00ff88] bg-transparent"
                onClick={() => startEdit(partner)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 bg-transparent hover:bg-red-500/10"
                onClick={() => deletePartner(partner)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            {searchTerm ? "No partners found matching your search." : "No partners yet. Add your first partner!"}
          </p>
        </div>
      )}
      <PaginationControls page={page} setPage={setPage} disablePrev={page === 1} disableNext={filteredPartners.length < pageSize} />
    </div>
  )
}
