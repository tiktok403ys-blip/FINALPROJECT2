"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Star, MapPin, Edit, Trash2, Plus, Search } from "lucide-react"
import Link from "next/link"
import type { Casino } from "@/lib/types"

export default function AdminCasinosPage() {
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCasinos()
  }, [])

  const fetchCasinos = async () => {
    setLoading(true)
    const { data } = await supabase.from("casinos").select("*").order("created_at", { ascending: false })

    if (data) {
      setCasinos(data)
    }
    setLoading(false)
  }

  const deleteCasino = async (id: string) => {
    if (confirm("Are you sure you want to delete this casino?")) {
      const { error } = await supabase.from("casinos").delete().eq("id", id)

      if (!error) {
        fetchCasinos()
      }
    }
  }

  const filteredCasinos = casinos.filter(
    (casino) =>
      casino.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      casino.location?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manage Casinos</h1>
          <p className="text-gray-400">Add, edit, and manage casino listings</p>
        </div>
        <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
          <Link href="/admin/casinos/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Casino
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search casinos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Casinos List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading casinos...</p>
          </div>
        ) : filteredCasinos.length > 0 ? (
          filteredCasinos.map((casino) => (
            <GlassCard key={casino.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-[#00ff88]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{casino.name}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-[#00ff88] fill-current mr-1" />
                        <span className="text-white">{casino.rating}</span>
                      </div>
                      {casino.location && (
                        <div className="flex items-center text-gray-400">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{casino.location}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 mt-2">{casino.description}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#00ff88] text-[#00ff88] bg-transparent"
                    asChild
                  >
                    <Link href={`/admin/casinos/edit/${casino.id}`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 bg-transparent hover:bg-red-500/10"
                    onClick={() => deleteCasino(casino.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchTerm ? "No casinos found matching your search." : "No casinos yet. Add your first casino!"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
