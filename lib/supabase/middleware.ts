import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase credentials aren't available in middleware, skip auth check
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Supabase credentials not available in middleware")
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth check timeout")), 3000))

    // Race between auth check and timeout
    const {
      data: { user },
    } = (await Promise.race([supabase.auth.getUser(), timeoutPromise])) as any

    const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
    const isSignUpSuccessPage = request.nextUrl.pathname === "/auth/sign-up-success"
    const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard")

    // Allow unauthenticated users to see sign-up-success page
    // but redirect authenticated users to dashboard
    if (isSignUpSuccessPage) {
      if (user) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // Redirect authenticated users away from other auth pages
    if (user && isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // Redirect unauthenticated users away from dashboard
    if (!user && isDashboardPage) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error("[v0] Middleware auth check failed:", error instanceof Error ? error.message : "Unknown error")

    // If we're on a dashboard page and auth failed, redirect to login
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("error", "auth_failed")
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
