import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createBrowserClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }

  client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        if (typeof document === "undefined") return undefined
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(";").shift()
      },
      set(name: string, value: string, options: any) {
        if (typeof document === "undefined") return
        document.cookie = `${name}=${value}; path=${options.path || "/"}; max-age=${options.maxAge || 31536000}`
      },
      remove(name: string, options: any) {
        if (typeof document === "undefined") return
        document.cookie = `${name}=; path=${options.path || "/"}; max-age=0`
      },
    },
  })

  return client
}

export function createClient() {
  return createBrowserClient()
}
