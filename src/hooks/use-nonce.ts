import { useEffect, useState } from 'react'

/**
 * Hook to get CSP nonce from response headers
 * This nonce should be used for inline scripts and styles to comply with CSP
 */
export function useNonce(): string | null {
  const [nonce, setNonce] = useState<string | null>(null)

  useEffect(() => {
    // Try to get nonce from meta tag (set by server)
    const metaNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')
    if (metaNonce) {
      setNonce(metaNonce)
      return
    }

    // Fallback: try to extract from current script tag
    const scripts = document.querySelectorAll('script[nonce]')
    if (scripts.length > 0) {
      const scriptNonce = scripts[0].getAttribute('nonce')
      if (scriptNonce) {
        setNonce(scriptNonce)
      }
    }
  }, [])

  return nonce
}

/**
 * Get nonce for inline styles
 * Should be used when creating dynamic styles that need CSP compliance
 */
export function getNonceForStyles(): string | undefined {
  if (typeof document === 'undefined') return undefined
  
  const metaNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')
  if (metaNonce) return metaNonce
  
  const scripts = document.querySelectorAll('script[nonce]')
  if (scripts.length > 0) {
    return scripts[0].getAttribute('nonce') || undefined
  }
  
  return undefined
}