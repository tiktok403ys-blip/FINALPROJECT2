"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { MessageSquare, Plus, User, Calendar, Search } from "lucide-react"
import Link from "next/link"
import type { ForumPost } from "@/lib/types"

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [user, setUser] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
    getUser()
  }, [])

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("forum_posts")
      .select(`
        *,
        forum_comments(count)
      `)
      .order("created_at", { ascending: false })

    if (data) {
      setPosts(data)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const { error } = await supabase.from("forum_posts").insert({
      title,
      content,
      category,
      author_id: user.id,
    })

    if (!error) {
      setTitle("")
      setContent("")
      setCategory("")
      setShowCreateForm(false)
      fetchPosts()
    }
    setLoading(false)
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const categories = ["General", "Strategy", "Bonuses", "Reviews", "Support"]

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Community Forum</h1>
          <p className="text-gray-400 text-lg">Connect with fellow players and share your experiences</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Add forum statistics section before search */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-[#00ff88]">{posts.length}</div>
              <div className="text-gray-400 text-sm">Total Posts</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-[#00ff88]">
                {posts.reduce((acc, post) => acc + (post.forum_comments?.[0]?.count || 0), 0)}
              </div>
              <div className="text-gray-400 text-sm">Total Replies</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-[#00ff88]">{categories.length}</div>
              <div className="text-gray-400 text-sm">Categories</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-[#00ff88]">24/7</div>
              <div className="text-gray-400 text-sm">Active</div>
            </GlassCard>
          </div>

          {/* Add popular categories section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Popular Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="bg-[#00ff88]/20 text-[#00ff88] px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-[#00ff88]/30 transition-colors"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Search and Create Post */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
            </div>
            {user && (
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            )}
          </div>

          {/* Create Post Form */}
          {showCreateForm && user && (
            <GlassCard className="p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Create New Post</h3>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Post title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    required
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-black">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <Textarea
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400 min-h-[120px]"
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                    {loading ? "Posting..." : "Post"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="border-white/10 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </GlassCard>
          )}

          {/* Login Prompt */}
          {!user && (
            <GlassCard className="p-6 mb-8 text-center">
              <MessageSquare className="w-12 h-12 text-[#00ff88] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Join the Discussion</h3>
              <p className="text-gray-400 mb-4">Sign in to create posts and join conversations</p>
              <div className="flex gap-2 justify-center">
                <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button variant="outline" asChild className="border-[#00ff88] text-[#00ff88] bg-transparent">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </div>
            </GlassCard>
          )}

          {/* Posts List */}
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <GlassCard key={post.id} className="p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.category && (
                        <span className="bg-[#00ff88]/20 text-[#00ff88] px-2 py-1 rounded text-xs font-medium">
                          {post.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      <Link href={`/forum/${post.id}`} className="hover:text-[#00ff88] transition-colors">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-gray-400 line-clamp-2">{post.content}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      <span>Anonymous</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span>{post.forum_comments?.[0]?.count || 0} replies</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchTerm
                  ? "No posts found matching your search."
                  : "No posts yet. Be the first to start a discussion!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
