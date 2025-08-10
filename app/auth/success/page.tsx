"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AuthSuccessPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    }

    getUser()
  }, [supabase.auth, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-black/50 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Welcome to GuruSingapore!</CardTitle>
            <CardDescription className="text-gray-400">Your account has been successfully verified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {user && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-gray-300 mb-2">Signed in as:</p>
                <p className="text-white font-semibold">{user.email}</p>
                {user.user_metadata?.full_name && (
                  <p className="text-gray-400 text-sm">{user.user_metadata.full_name}</p>
                )}
              </div>
            )}

            <p className="text-gray-300">You will be redirected to the homepage in a few seconds...</p>

            <div className="space-y-2">
              <Button asChild className="w-full bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-semibold">
                <Link href="/">Go to Homepage</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Link href="/casinos">Explore Casinos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
