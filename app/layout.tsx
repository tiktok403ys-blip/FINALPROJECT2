import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { CookieConsent } from "@/components/cookie-consent"
import { WebVitals } from "@/components/web-vitals"
import { Toaster } from "@/components/ui/toast"
import { AnalyticsProvider } from "@/components/analytics-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { PWAInstaller } from "@/components/pwa-installer"
import { GoogleAnalytics } from "@/components/google-analytics"
import { headers } from "next/headers"
import type { Viewport } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GuruSingapore - Best Online Casinos",
  description:
    "Discover the best online casinos with verified reviews, ratings, and exclusive bonuses. Mobile-first design with offline support.",
  keywords: "casino, online casino, bonuses, reviews, gambling, Singapore, mobile, PWA, offline",
  authors: [{ name: "GuruSingapore" }],
  creator: "GuruSingapore",
  publisher: "GuruSingapore",
  manifest: "/manifest.json",
  robots: "index, follow",
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'GuruSingapore',
    'msapplication-TileColor': '#00ff88',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#00ff88',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN}`,
    title: "GuruSingapore - Ultimate Casino Guide",
    description:
      "Discover the best online casinos, exclusive bonuses, and expert reviews. Your trusted guide to the world of online gaming.",
    siteName: "GuruSingapore",
  },
  twitter: {
    card: "summary_large_image",
    title: "GuruSingapore - Ultimate Casino Guide",
    description:
      "Discover the best online casinos, exclusive bonuses, and expert reviews. Your trusted guide to the world of online gaming.",
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const host = (await headers()).get("host") || ""
  const isAdminSubdomain = host === process.env.ADMIN_SUBDOMAIN
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AnalyticsProvider>
              <AuthProvider>
                <div className="min-h-screen bg-black text-white">
                  {!isAdminSubdomain && <Navbar />}
                  <main>{children}</main>
                  {!isAdminSubdomain && <CookieConsent />}
                  {!isAdminSubdomain && <PWAInstaller />}
                  <WebVitals />
                  <PerformanceMonitor enableRealTime={false} />
                </div>
                <Toaster />
              </AuthProvider>
            </AnalyticsProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
