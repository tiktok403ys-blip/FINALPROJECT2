"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHero } from "@/components/page-hero"
import { LoadingSpinner } from "@/components/loading-spinner"
import { UserIcon, Mail, Calendar, Save } from "lucide-react"

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  updated_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          router.push("/auth/login")
          return
        }

        setUser(session.user)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError
        }

        if (profileData) {
          setProfile(profileData)
        } else {
          // Create profile if it doesn't exist
          const newProfile = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "",
            username: null,
            website: null,
          }

          const { data: createdProfile, error: createError } = await supabase
            .from("profiles")
            .insert([newProfile])
            .select()
            .single()

          if (createError) throw createError
          setProfile(createdProfile)
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [supabase, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !user) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          username: profile.username,
          website: profile.website,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Profile, value: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      [field]: value,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">Please log in to view your profile.</p>
          <Button onClick={() => router.push("/auth/login")} className="bg-[#00ff88] hover:bg-[#00ff88]/90 text-black">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <PageHero
        title="Profile Settings"
        description="Manage your account information and preferences"
        backgroundImage="/casino-interior.png"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                Update your profile information and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSave} className="space-y-4">
                {/* Email (read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="bg-white/5 border-white/20 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Full Name</label>
                  <Input
                    type="text"
                    value={profile.full_name || ""}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#00ff88] focus:ring-[#00ff88]"
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Username</label>
                  <Input
                    type="text"
                    value={profile.username || ""}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    placeholder="Choose a username"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#00ff88] focus:ring-[#00ff88]"
                  />
                  <p className="text-xs text-gray-500">Must be at least 3 characters long</p>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Website</label>
                  <Input
                    type="url"
                    value={profile.website || ""}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://your-website.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#00ff88] focus:ring-[#00ff88]"
                  />
                </div>

                {/* Account Created */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </label>
                  <Input
                    type="text"
                    value={new Date(user.created_at).toLocaleDateString()}
                    disabled
                    className="bg-white/5 border-white/20 text-gray-400 cursor-not-allowed"
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md p-3">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-md p-3">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-semibold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
