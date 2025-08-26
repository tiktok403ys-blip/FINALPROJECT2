import { createBrowserClient } from "@supabase/ssr"
import { logger } from '@/lib/logger'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

function resolveCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined
  // Prefer explicit ENV for consistency between server and client
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_COOKIE_DOMAIN || process.env.SITE_COOKIE_DOMAIN) as
    | string
    | undefined
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim()

  const host = window.location.hostname
  // Use apex domain in production to share cookies across subdomains
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN
  if (!siteDomain) {
    logger.warn('NEXT_PUBLIC_SITE_DOMAIN not set, using host-only cookies')
    return undefined
  }
  if (host.endsWith(siteDomain)) return siteDomain
  // For localhost or unknown hosts, fall back to host-only cookies
  return undefined
}

export function createClient() {
  if (!supabaseClient) {
    const defaultDomain = resolveCookieDomain()
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            if (typeof document !== "undefined") {
              const value = `; ${document.cookie}`
              const parts = value.split(`; ${name}=`)
              if (parts.length === 2) {
                return parts.pop()?.split(";").shift()
              }
            }
            return undefined
          },
          set(name: string, value: string, options: any) {
            if (typeof document !== "undefined") {
              const merged: any = {
                path: "/",
                domain: defaultDomain,
                secure: typeof window !== "undefined" ? window.location.protocol === "https:" : false,
                sameSite: "lax",
                ...options,
              }

              let cookieString = `${name}=${value}`

              if (merged.maxAge) {
                cookieString += `; max-age=${merged.maxAge}`
              }
              if (merged.expires) {
                cookieString += `; expires=${merged.expires.toUTCString()}`
              }
              if (merged.path) {
                cookieString += `; path=${merged.path}`
              }
              if (merged.domain) {
                cookieString += `; domain=${merged.domain}`
              }
              if (merged.secure) {
                cookieString += "; secure"
              }
              if (merged.httpOnly) {
                cookieString += "; httponly"
              }
              if (merged.sameSite) {
                cookieString += `; samesite=${merged.sameSite}`
              }

              document.cookie = cookieString
            }
          },
          remove(name: string, options: any) {
            if (typeof document !== "undefined") {
              const merged: any = { path: "/", domain: defaultDomain, ...options }
              let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`

              if (merged.path) {
                cookieString += `; path=${merged.path}`
              }
              if (merged.domain) {
                cookieString += `; domain=${merged.domain}`
              }

              document.cookie = cookieString
            }
          },
        },
      },
    )
  }
  return supabaseClient
}
