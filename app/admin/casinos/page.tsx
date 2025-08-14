"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { useAdminSecurity } from "@/components/admin-security-provider"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/admin/pagination"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Star, MapPin, Edit, Trash2, Plus, Search, Grid, List, Eye, Calendar } from "lucide-react"
import Link from "next/link"
import type { Casino } from "@/lib/types"

export default function AdminCasinosPage() {
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [sortBy, setSortBy] = useState<"name" | "rating" | "created_at">("created_at")
  const [page, setPage] = useState(1)
  const pageSize = 12
  const supabase = createClient()
  const { logAdminAction } = useAdminSecurity()

  useEffect(() => {
    fetchCasinos()
  }, [sortBy, page])

  useEffect(() => {
    const channel = supabase
      .channel("casinos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "casinos" }, () => {
        fetchCasinos()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchCasinos = async () => {
    setLoading(true)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data } = await supabase
      .from("casinos")
      .select("*")
      .order(sortBy, { ascending: sortBy === "name" })
      .range(from, to)

    if (data) {
      setCasinos(data)
    }
    setLoading(false)
  }

  const deleteCasino = async (casino: Casino) => {
    if (confirm("Are you sure you want to delete this casino?")) {
      const { error } = await supabase.from("casinos").delete().eq("id", casino.id)
      if (!error) {
        await logAdminAction("delete", "casinos", casino.id, {})
        const path = parseAssetsPath(casino.logo_url as any)
        if (path) {
          await supabase.storage.from("assets").remove([path])
        }
        fetchCasinos()
      }
    }
  }

  function parseAssetsPath(url?: string | null): string | null {
    if (!url) return null
    const marker = "/storage/v1/object/public/assets/"
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.substring(idx + marker.length)
  }

  const filteredCasinos = casinos.filter(
    (casino) =>
      casino.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      casino.location?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-black">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-[#00ff88]/5" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-[#00ff88] bg-clip-text text-transparent mb-3">
                Casino Management
              </h1>
              <p className="text-gray-400 text-lg">Add, edit, and manage casino listings with advanced controls</p>
            </div>
            <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 h-12 px-6 text-base font-semibold">
              <Link href="/admin/casinos/new">
                <Plus className="w-5 h-5 mr-2" />
                Add New Casino
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Enhanced Controls */}
        <GlassCard className="p-6 mb-8 bg-gradient-to-r from-white/5 to-white/10 border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search casinos by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 h-11"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="created_at" className="bg-black">
                  Latest First
                </option>
                <option value="name" className="bg-black">
                  Name A-Z
                </option>
                <option value="rating" className="bg-black">
                  Rating
                </option>
              </select>

              {/* View Mode */}
              <div className="flex items-center space-x-1 p-1 bg-white/5 rounded-lg border border-white/10">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-[#00ff88] text-black" : "text-gray-400 hover:text-white"}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-[#00ff88] text-black" : "text-gray-400 hover:text-white"}
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-gray-400">Total: </span>
                <span className="text-white font-semibold">{casinos.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Showing: </span>
                <span className="text-[#00ff88] font-semibold">{filteredCasinos.length}</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Casinos Display */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading casinos...</p>
          </div>
        ) : filteredCasinos.length > 0 ? (
          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredCasinos.map((casino) => (
              <GlassCard
                key={casino.id}
                className="p-6 hover:scale-[1.01] transition-all duration-300 group border-white/10 hover:border-[#00ff88]/30"
              >
                {viewMode === "list" ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Logo/Avatar */}
                      <div className="w-16 h-16 bg-gradient-to-br from-[#00ff88]/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-[#00ff88]/20">
                        {casino.logo_url ? (
                          <img
                            src={casino.logo_url || "/placeholder.svg"}
                            alt={casino.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <Star className="w-8 h-8 text-[#00ff88]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-white group-hover:text-[#00ff88] transition-colors">
                            {casino.name}
                          </h3>
                          <Badge variant="outline" className="border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/10">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-6 mb-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-[#00ff88] fill-current" />
                            <span className="text-white font-medium">{casino.rating}</span>
                          </div>
                          {casino.location && (
                            <div className="flex items-center text-gray-400">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{casino.location}</span>
                            </div>
                          )}
                          <div className="flex items-center text-gray-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(casino.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">{casino.description}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
                        asChild
                      >
                        <Link href={`/casinos/${casino.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10 hover:bg-[#00ff88]/20"
                        asChild
                      >
                        <Link href={`/admin/casinos/edit/${casino.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 bg-red-500/10 hover:bg-red-500/20"
                        onClick={() => deleteCasino(casino)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Grid View
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#00ff88]/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-[#00ff88]/20 mx-auto mb-4">
                      {casino.logo_url ? (
                        <img
                          src={casino.logo_url || "/placeholder.svg"}
                          alt={casino.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <Star className="w-10 h-10 text-[#00ff88]" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00ff88] transition-colors">
                      {casino.name}
                    </h3>
                    <div className="flex items-center justify-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-[#00ff88] fill-current" />
                        <span className="text-white text-sm">{casino.rating}</span>
                      </div>
                      {casino.location && (
                        <div className="flex items-center text-gray-400 text-sm">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{casino.location}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{casino.description}</p>
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10 hover:bg-[#00ff88]/20"
                        asChild
                      >
                        <Link href={`/admin/casinos/edit/${casino.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 bg-red-500/10 hover:bg-red-500/20"
                        onClick={() => deleteCasino(casino)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-600/20 to-gray-800/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Star className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{searchTerm ? "No casinos found" : "No casinos yet"}</h3>
            <p className="text-gray-400 text-lg mb-8">
              {searchTerm ? "Try adjusting your search terms." : "Add your first casino to get started!"}
            </p>
            {!searchTerm && (
              <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                <Link href="/admin/casinos/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Casino
                </Link>
              </Button>
            )}
          </div>
        )}
        <PaginationControls page={page} setPage={setPage} disablePrev={page === 1} disableNext={filteredCasinos.length < pageSize} />
      </div>
    </div>
  )
}
