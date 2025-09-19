import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function resolveCookieDomainFromEnv(): string | undefined {
  const explicit = process.env.SITE_COOKIE_DOMAIN || process.env.NEXT_PUBLIC_SITE_COOKIE_DOMAIN
  if (explicit && explicit.trim().length > 0) return explicit.trim()
  
  // In production, NEXT_PUBLIC_SITE_DOMAIN must be set - no hardcode fallback
  if (process.env.NODE_ENV === "production") {
    if (!process.env.NEXT_PUBLIC_SITE_DOMAIN) {
      throw new Error("NEXT_PUBLIC_SITE_DOMAIN environment variable is required in production")
    }
    return process.env.NEXT_PUBLIC_SITE_DOMAIN
  }
  
  return undefined
}

export async function createClient() {
  const cookieStore = await cookies()
  const domain = resolveCookieDomainFromEnv()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({
              name,
              value,
              domain,
              path: "/",
              sameSite: "lax",
              secure: true,
              ...options,
            })
          } catch (error) {
            // Ignore when called from Server Components; middleware refresh should handle sessions
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", domain, path: "/", ...options })
          } catch (error) {
            // Ignore when called from Server Components; middleware refresh should handle sessions
          }
        },
      },
    },
  )
}
