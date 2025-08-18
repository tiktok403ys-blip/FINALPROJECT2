"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { UserIcon, Mail, Calendar, Save, AlertCircle } from "lucide-react"

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  role: string | null
  created_at: string
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

        // Use profile_rpc_v5 to get unified profile data from admin_users as single source of truth
        const { data: profileData, error: profileError } = await supabase
          .rpc('profile_rpc_v5', { user_id_input: session.user.id })

        if (profileError) {
          console.error("Profile error:", profileError)
          setError("Failed to load profile from database. Using account data.")
          // Use fallback profile from user metadata
          setProfile({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "",
            website: null,
            role: "user", // Read-only, will be overridden by RPC data
            created_at: session.user.created_at,
            updated_at: new Date().toISOString(),
          })
        } else if (profileData && profileData.length > 0) {
          setProfile(profileData[0])
        } else {
          // Profile should be auto-created by handle_new_user trigger
          setError("Profile not found. Please contact support.")
          setProfile({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "",
            website: null,
            role: "user",
            created_at: session.user.created_at,
            updated_at: new Date().toISOString(),
          })
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
      // Only update allowed fields (exclude role for security)
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        website: profile.website,
        // role is excluded - managed only through admin_users table
        updated_at: new Date().toISOString(),
      })

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
    <div className="min-h-screen bg-black pt-24">
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
              {error && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

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

                {/* Role */}
                {profile.role && profile.role !== "user" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Role</label>
                    <Input
                      type="text"
                      value={profile.role}
                      disabled
                      className="bg-white/5 border-white/20 text-gray-400 cursor-not-allowed"
                    />
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
