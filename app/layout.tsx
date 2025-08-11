import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { NavbarFixed } from "@/components/navbar-fixed"
import { CookieConsent } from "@/components/cookie-consent"

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
    url: "https://gurusingapore.com",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen bg-black text-white">
              <NavbarFixed />
              <main>{children}</main>
              <CookieConsent />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
