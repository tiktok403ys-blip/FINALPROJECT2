import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { NavbarFixed } from "@/components/navbar-fixed"
import { CookieConsent } from "@/components/cookie-consent"
import { WebVitals } from "@/components/web-vitals"
import { Toaster } from "@/components/ui/sonner"
import { headers } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GuruSingapore - Ultimate Casino Guide",
  description:
    "Discover the best online casinos, exclusive bonuses, and expert reviews. Your trusted guide to the world of online gaming.",
  keywords: "casino, online casino, bonuses, reviews, gambling, Singapore",
  authors: [{ name: "GuruSingapore" }],
  creator: "GuruSingapore",
  publisher: "GuruSingapore",
  robots: "index, follow",
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen bg-black text-white">
              {!isAdminSubdomain && <NavbarFixed />}
              <main>{children}</main>
              {!isAdminSubdomain && <CookieConsent />}
              <WebVitals />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
