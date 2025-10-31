import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 500): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const errorMessage = error instanceof Error ? error.message : String(error)

      console.log(`[v0] Retry attempt ${attempt + 1}/${maxRetries}, error:`, errorMessage)

      // Don't retry on authentication errors or invalid tokens
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("Invalid Refresh Token") ||
        errorMessage.includes("refresh_token_not_found")
      ) {
        console.log("[v0] Auth token invalid, not retrying")
        throw error
      }

      // Don't retry on fetch errors - they're likely environmental
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch")) {
        console.log("[v0] Fetch error detected, not retrying")
        throw error
      }

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt)
        console.log(`[v0] Waiting ${delay}ms before retry`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Creates a Supabase client for server-side operations.
 * Important: Don't put this client in a global variable.
 * Always create a new client within each function when using it.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }

  console.log("[v0] Creating Supabase server client with URL:", supabaseUrl)

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

export async function createServerClient() {
  return createClient()
}

export async function getAuthUser() {
  try {
    const supabase = await createClient()

    return await retryWithBackoff(
      async () => {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.error("[v0] Auth error:", error.message)
          // Log but don't throw for token refresh errors - let middleware handle redirect
          if (error.message.includes("Invalid Refresh Token") || error.message.includes("refresh_token_not_found")) {
            console.log("[v0] Auth token expired or invalid")
            return { user: null }
          }
          throw error
        }

        return data
      },
      1, // Reduced to 1 retry for faster failure on fetch errors
      300,
    )
  } catch (error) {
    console.error("[v0] Failed to get auth user:", error instanceof Error ? error.message : "Unknown error")
    return { user: null }
  }
}
