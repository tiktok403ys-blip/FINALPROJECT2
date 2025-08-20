'use client'

import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="max-w-md text-center">
        <div className="text-6xl font-extrabold text-white">404</div>
        <p className="mt-4 text-gray-400">Halaman tidak ditemukan atau tidak tersedia.</p>
        <p className="mt-1 text-gray-500 text-sm">Jika Anda mencoba mengakses halaman admin, gunakan subdomain admin yang benar.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white hover:bg-white/20">Kembali ke Beranda</Link>
          <Link href="/bonuses" className="px-4 py-2 rounded-md bg-[#00ff88] text-black hover:bg-[#00ff88]/80">Lihat Bonus</Link>
        </div>
      </div>
    </div>
  )
}


