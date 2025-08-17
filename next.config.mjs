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
      'cdn.jsdelivr.net', // CDN for external assets
      'fonts.googleapis.com', // Google Fonts
      'fonts.gstatic.com' // Google Fonts static
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL 
          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname 
          : 'oypqykrfinmrvvsjfyqd.supabase.co', // fallback
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
