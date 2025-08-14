"use client"

import { useState, useEffect, useMemo } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Newspaper, Edit, Trash2, Plus, Search, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import type { News } from "@/lib/types"
import { useAdminSecurity } from "@/components/admin-security-provider"

export default function AdminNewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const supabase = createClient()
  const { logAdminAction } = useAdminSecurity()

  useEffect(() => {
    fetchNews()
  }, [page, pageSize])

  useEffect(() => {
    const channel = supabase
      .channel("news-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "news" }, () => {
        fetchNews()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNews = async () => {
    setLoading(true)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data } = await supabase
      .from("news")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (data) {
      setNews(data)
    }
    setLoading(false)
  }

  const togglePublished = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("news").update({ published: !currentStatus }).eq("id", id)
    if (!error) {
      await logAdminAction("toggle_published", "news", id, { published: !currentStatus })
      fetchNews()
    }
  }

  const parseAssetsPath = (url?: string | null): string | null => {
    if (!url) return null
    const marker = "/storage/v1/object/public/assets/"
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.substring(idx + marker.length)
  }

  const deleteNews = async (id: string) => {
    if (confirm("Are you sure you want to delete this news article?")) {
      const { data: prev } = await supabase.from("news").select("image_url").eq("id", id).single()
      const { error } = await supabase.from("news").delete().eq("id", id)

      if (!error) {
        const oldPath = parseAssetsPath(prev?.image_url)
        if (oldPath) {
          await supabase.storage.from("assets").remove([oldPath])
        }
        await logAdminAction("delete", "news", id, {})
        fetchNews()
      }
    }
  }

  const filteredNews = useMemo(
    () =>
      news.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.category?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [news, searchTerm],
  )

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manage News</h1>
          <p className="text-gray-400">Create and manage news articles</p>
        </div>
        <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
          <Link href="/admin/news/new">
            <Plus className="w-4 h-4 mr-2" />
            Add News
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* News List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading news...</p>
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((article) => (
            <GlassCard key={article.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {article.category && (
                      <span className="bg-[#00ff88]/20 text-[#00ff88] px-2 py-1 rounded text-xs font-medium">
                        {article.category}
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        article.published ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {article.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{article.title}</h3>
                  <p className="text-gray-400 mb-3">{article.excerpt}</p>
                  <p className="text-gray-500 text-sm">Created: {new Date(article.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${
                      article.published
                        ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                        : "border-green-500 text-green-500 hover:bg-green-500/10"
                    } bg-transparent`}
                    onClick={() => togglePublished(article.id, article.published)}
                  >
                    {article.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#00ff88] text-[#00ff88] bg-transparent"
                    asChild
                  >
                    <Link href={`/admin/news/edit/${article.id}`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 bg-transparent hover:bg-red-500/10"
                    onClick={() => deleteNews(article.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="text-center py-16">
            <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchTerm ? "No news found matching your search." : "No news articles yet. Create your first article!"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredNews.length > 0 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-gray-400 text-sm">Page {page}</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-transparent text-white border-white/20"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              className="bg-transparent text-white border-white/20"
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
