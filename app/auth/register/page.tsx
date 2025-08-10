"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, User, Chrome, Star, Shield, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Footer from "@/components/footer"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleEmailRegister = async (e: React.FormEvent) => {
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
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
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
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <main className="flex-1 flex">
        {/* Left Side - Visual Content */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url(/casino-interior.png)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <h1 className="text-4xl font-bold mb-6">Join Singapore's Premier Casino Community</h1>
            <p className="text-xl text-gray-300 mb-8">
              Get access to expert reviews, exclusive bonuses, and trusted recommendations from our community of casino
              enthusiasts.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#00ff88]" />
                </div>
                <div>
                  <h3 className="font-semibold">Expert Reviews</h3>
                  <p className="text-sm text-gray-400">Professional casino evaluations</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#00ff88]" />
                </div>
                <div>
                  <h3 className="font-semibold">Safe & Secure</h3>
                  <p className="text-sm text-gray-400">Licensed and regulated casinos</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#00ff88]" />
                </div>
                <div>
                  <h3 className="font-semibold">Exclusive Bonuses</h3>
                  <p className="text-sm text-gray-400">Special offers for members</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#00ff88]" />
                </div>
                <div>
                  <h3 className="font-semibold">Community</h3>
                  <p className="text-sm text-gray-400">Connect with fellow players</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-center">
              <div>
                <div className="text-2xl font-bold text-[#00ff88]">50+</div>
                <div className="text-sm text-gray-400">Casinos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#00ff88]">10K+</div>
                <div className="text-sm text-gray-400">Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#00ff88]">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
              <CardDescription className="text-gray-400">Join GuruSingapore today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-500/10 border-green-500/20">
                  <AlertDescription className="text-green-400">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-gray-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-2 text-gray-400">Or continue with</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleRegister}
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                disabled={loading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Continue with Google
              </Button>

              <div className="text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-[#00ff88] hover:underline">
                  Sign in
                </Link>
              </div>

              <div className="text-xs text-gray-500 text-center">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-[#00ff88] hover:underline">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#00ff88] hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
