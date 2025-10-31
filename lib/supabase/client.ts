import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createBrowserClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }

  console.log("[v0] Creating Supabase browser client with URL:", supabaseUrl)

  const customFetch: typeof fetch = async (input, init) => {
    try {
      console.log("[v0] Fetch request:", typeof input === "string" ? input : input.url)
      const response = await fetch(input, init)
      console.log("[v0] Fetch response status:", response.status)
      return response
    } catch (error) {
      console.error("[v0] Fetch error:", error instanceof Error ? error.message : "Unknown error")
      // Re-throw the error so Supabase can handle it
      throw error
    }
  }

  client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: customFetch,
    },
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
