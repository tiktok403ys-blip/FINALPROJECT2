/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/ssr'],
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: [
      'localhost', 
      'via.placeholder.com', 
      'images.unsplash.com', 
      'picsum.photos',
      'oypqykrfinmrvvsjfyqd.supabase.co', // Supabase storage domain
      'cdn.jsdelivr.net', // CDN for external assets
      'fonts.googleapis.com', // Google Fonts
      'fonts.gstatic.com' // Google Fonts static
    ],
  },
}

export default nextConfig
