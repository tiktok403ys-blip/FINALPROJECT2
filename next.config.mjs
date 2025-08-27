import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  // Webpack optimization untuk mengatasi peringatan serialisasi string besar
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Nonaktifkan cache filesystem untuk menghindari peringatan serialisasi
    config.cache = false;
    
    // Code splitting optimization yang lebih agresif
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 100000, // Batasi ukuran chunk maksimal ke 100KB
        cacheGroups: {
          // Framework chunks (React, Next.js)
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 40,
            maxSize: 80000, // 80KB limit
          },
          // Vendor chunks untuk library besar
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            maxSize: 60000, // 60KB limit untuk menghindari string besar
            minChunks: 1,
          },
          // Radix UI components dalam chunk terpisah
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            chunks: 'all',
            priority: 30,
            maxSize: 50000, // 50KB limit
          },
          // Sentry dalam chunk terpisah
          sentry: {
            test: /[\\/]node_modules[\\/]@sentry[\\/]/,
            name: 'sentry',
            chunks: 'all',
            priority: 25,
            maxSize: 40000, // 40KB limit
          },
          // Supabase dalam chunk terpisah
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 20,
            maxSize: 50000, // 50KB limit
          },
          // Common chunks untuk kode yang sering digunakan
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            maxSize: 30000, // 30KB limit
          },
        },
      },
    };

    // Plugin untuk optimasi bundle
    if (!dev) {
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({
          maxChunks: 100, // Izinkan lebih banyak chunks kecil
        })
      );
    }

    return config;
  },
  // Experimental features untuk optimasi
  experimental: {
    // Nonaktifkan optimizeCss karena menyebabkan error critters
    // optimizeCss: true,
  },
}

export default nextConfig
