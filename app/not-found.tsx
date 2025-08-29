import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Shield, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-white/90 mb-4">Page Not Found</h2>
        </div>

        {/* Message */}
        <p className="text-white/70 text-lg mb-8 leading-relaxed">
          The page you're looking for doesn't exist or you don't have permission to access it.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
          >
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </Button>

          <Button
            variant="outline"
            asChild
            className="w-full border-white/20 text-white hover:bg-white/10 py-3 px-6 rounded-xl transition-all duration-200"
            onClick={() => window.history.back()}
          >
            <div className="flex items-center justify-center gap-2 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </div>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/50 text-sm">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
