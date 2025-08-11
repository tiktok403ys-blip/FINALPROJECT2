import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!supabaseClient) {
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
              let cookieString = `${name}=${value}`

              if (options?.maxAge) {
                cookieString += `; max-age=${options.maxAge}`
              }
              if (options?.expires) {
                cookieString += `; expires=${options.expires.toUTCString()}`
              }
              if (options?.path) {
                cookieString += `; path=${options.path}`
              }
              if (options?.domain) {
                cookieString += `; domain=${options.domain}`
              }
              if (options?.secure) {
                cookieString += "; secure"
              }
              if (options?.httpOnly) {
                cookieString += "; httponly"
              }
              if (options?.sameSite) {
                cookieString += `; samesite=${options.sameSite}`
              }

              document.cookie = cookieString
            }
          },
          remove(name: string, options: any) {
            if (typeof document !== "undefined") {
              let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`

              if (options?.path) {
                cookieString += `; path=${options.path}`
              }
              if (options?.domain) {
                cookieString += `; domain=${options.domain}`
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
