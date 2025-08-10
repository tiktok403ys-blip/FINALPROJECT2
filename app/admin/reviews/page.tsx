"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { FileText, Edit, Trash2, Plus, Search, Eye, EyeOff, Star } from "lucide-react"
import Link from "next/link"

interface Review {
  id: string
  casino_id: string
  title: string
  content: string
  rating: number
  author_name: string
  is_featured: boolean
  is_published: boolean
  created_at: string
  casinos: {
    name: string
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("casino_reviews")
      .select(`
        *,
        casinos (
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (data) {
      setReviews(data)
    }
    setLoading(false)
  }

  const togglePublished = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("casino_reviews").update({ is_published: !currentStatus }).eq("id", id)

    if (!error) {
      fetchReviews()
    }
  }

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("casino_reviews").update({ is_featured: !currentStatus }).eq("id", id)

    if (!error) {
      fetchReviews()
    }
  }

  const deleteReview = async (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      const { error } = await supabase.from("casino_reviews").delete().eq("id", id)

      if (!error) {
        fetchReviews()
      }
    }
  }

  const filteredReviews = reviews.filter(
    (review) =>
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.casinos?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manage Reviews</h1>
          <p className="text-gray-400">Create and manage casino reviews</p>
        </div>
        <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
          <Link href="/admin/reviews/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Review
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading reviews...</p>
          </div>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <GlassCard key={review.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#00ff88]/20 text-[#00ff88] px-2 py-1 rounded text-xs font-medium">
                      {review.casinos?.name}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        review.is_published ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {review.is_published ? "Published" : "Draft"}
                    </span>
                    {review.is_featured && (
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">Featured</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{review.title}</h3>
                  <p className="text-gray-400 mb-3 line-clamp-2">{review.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-[#00ff88] fill-current mr-1" />
                      <span>{review.rating}/5.0</span>
                    </div>
                    <span>By: {review.author_name}</span>
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${
                      review.is_published
                        ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                        : "border-green-500 text-green-500 hover:bg-green-500/10"
                    } bg-transparent`}
                    onClick={() => togglePublished(review.id, review.is_published)}
                  >
                    {review.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${
                      review.is_featured
                        ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                        : "border-gray-500 text-gray-500 hover:bg-gray-500/10"
                    } bg-transparent`}
                    onClick={() => toggleFeatured(review.id, review.is_featured)}
                  >
                    <Star className={`w-4 h-4 ${review.is_featured ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#00ff88] text-[#00ff88] bg-transparent"
                    asChild
                  >
                    <Link href={`/admin/reviews/edit/${review.id}`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 bg-transparent hover:bg-red-500/10"
                    onClick={() => deleteReview(review.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchTerm ? "No reviews found matching your search." : "No reviews yet. Create your first review!"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
