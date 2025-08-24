"use client"

import { useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID || 'GA_MEASUREMENT_ID'

  useEffect(() => {
    // Only initialize if we have a valid measurement ID
    if (measurementId && measurementId !== 'GA_MEASUREMENT_ID') {
      window.dataLayer = window.dataLayer || []

      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }

      window.gtag = gtag
      gtag('js', new Date())
      gtag('config', measurementId, {
        anonymize_ip: true,
        allow_ad_features: false,
        send_page_view: true
      })
    }
  }, [measurementId])

  // Only load GA script if we have a valid measurement ID
  if (!measurementId || measurementId === 'GA_MEASUREMENT_ID') {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google Analytics loaded successfully')
        }}
        onError={() => {
          console.warn('Failed to load Google Analytics')
        }}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              anonymize_ip: true,
              allow_ad_features: false,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  )
}
