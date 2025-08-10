/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Admin subdomain routing
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'sg44admin.gurusingapore.com',
            },
          ],
          destination: '/admin/:path*',
        },
      ],
    }
  },
  async redirects() {
    return [
      // Block admin access from main domain
      {
        source: '/admin/:path*',
        has: [
          {
            type: 'host',
            value: 'gurusingapore.com',
          },
        ],
        destination: '/404',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        has: [
          {
            type: 'host',
            value: 'www.gurusingapore.com',
          },
        ],
        destination: '/404',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
