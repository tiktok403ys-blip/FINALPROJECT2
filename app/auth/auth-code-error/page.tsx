import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-black/50 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Authentication Error</CardTitle>
            <CardDescription className="text-gray-400">There was a problem confirming your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-300">
              The confirmation link may have expired or been used already. Please try signing up again or contact
              support if the problem persists.
            </p>

            <div className="space-y-2">
              <Button asChild className="w-full bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-semibold">
                <Link href="/auth/register">Try Again</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Link href="/auth/login">Sign In Instead</Link>
              </Button>

              <Button asChild variant="ghost" className="w-full text-gray-400 hover:text-white">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
