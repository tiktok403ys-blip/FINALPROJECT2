"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/glass-card"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Mail, Lock, Star, Shield, Users, TrendingUp } from "lucide-react"
import { Footer } from "@/components/footer"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess("Registration successful! Please check your email to verify your account.")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 flex">
        {/* Left Side - Visual Content */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="/placeholder.jpg?height=1080&width=720&query=luxury casino interior with golden lights and poker tables"
              alt="Casino Interior"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 flex flex-col justify-center px-12 py-24">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold text-white mb-6">Join Singapore's Premier Casino Community</h2>
              <p className="text-xl text-gray-200 mb-8">
                Get exclusive access to the best casino reviews, bonuses, and insider tips from our expert community.
              </p>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-[#00ff88]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Expert Reviews</h3>
                    <p className="text-gray-300 text-sm">Detailed casino reviews from industry professionals</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#00ff88]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Safe & Secure</h3>
                    <p className="text-gray-300 text-sm">Only licensed and regulated casinos</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#00ff88]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Exclusive Bonuses</h3>
                    <p className="text-gray-300 text-sm">Access to member-only promotions and deals</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#00ff88]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Community</h3>
                    <p className="text-gray-300 text-sm">Connect with fellow casino enthusiasts</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#00ff88]">50+</div>
                  <div className="text-sm text-gray-300">Casinos Reviewed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#00ff88]">10K+</div>
                  <div className="text-sm text-gray-300">Active Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#00ff88]">24/7</div>
                  <div className="text-sm text-gray-300">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
              <p className="text-gray-400">Join our exclusive casino community</p>
            </div>

            <GlassCard className="p-8">
              <form onSubmit={handleRegister} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-[#00ff88]/50"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-[#00ff88]/50"
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Must be at least 6 characters long</p>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-[#00ff88]/50"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#00ff88] text-black hover:bg-[#00ff88]/80 font-semibold py-3 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-black text-gray-400">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4 border-white/10 text-white hover:bg-white/5 bg-transparent transition-all duration-200"
                  onClick={handleGoogleRegister}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C16.81 2.09 14.56 1 12 1 7.7 1 3.99 3.47 2.18 7.07l2.85 2.22c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-[#00ff88] hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-[#00ff88] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#00ff88] hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
