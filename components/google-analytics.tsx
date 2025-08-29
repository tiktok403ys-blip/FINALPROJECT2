"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export function GoogleAnalytics() {
  const router = useRouter()
  const measurementId = process.env.NEXT_PUBLIC_GA_ID

  useEffect(() => {
    // Only initialize if we have a valid measurement ID
    if (!measurementId || measurementId === 'GA_MEASUREMENT_ID') {
      return
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || []

    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }

    window.gtag = gtag

    // Load Google Analytics script dynamically
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    script.async = true
    script.onload = () => {
      gtag('js', new Date())
      gtag('config', measurementId, {
        anonymize_ip: true,
        allow_ad_features: false,
        send_page_view: true
      })
      console.log('Google Analytics loaded successfully')
    }
    script.onerror = () => {
      console.warn('Failed to load Google Analytics')
    }

    document.head.appendChild(script)

    // Cleanup function
    return () => {
      const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [measurementId])

  // This component doesn't render anything visible
  return null
}
