'use client'

import { useEffect } from 'react'
import { useNonce } from '@/src/hooks/use-nonce'

/**
 * Component to inject CSP nonce into document head
 * This ensures that the nonce is available for dynamic content
 */
export function CSPNonce() {
  const nonce = useNonce()

  useEffect(() => {
    if (nonce && typeof document !== 'undefined') {
      // Check if meta tag already exists
      let metaTag = document.querySelector('meta[name="csp-nonce"]')
      
      if (!metaTag) {
        // Create new meta tag
        metaTag = document.createElement('meta')
        metaTag.setAttribute('name', 'csp-nonce')
        document.head.appendChild(metaTag)
      }
      
      // Set the nonce value
      metaTag.setAttribute('content', nonce)
    }
  }, [nonce])

  return null // This component doesn't render anything visible
}

/**
 * Higher-order component to wrap components that need CSP nonce
 */
export function withCSPNonce<T extends object>(Component: React.ComponentType<T>) {
  return function CSPNonceWrapper(props: T) {
    return (
      <>
        <CSPNonce />
        <Component {...props} />
      </>
    )
  }
}