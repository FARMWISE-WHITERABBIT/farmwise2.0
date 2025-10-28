export async function checkSupabaseConnection(): Promise<{
  isHealthy: boolean
  error?: string
  latency?: number
}> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: "HEAD",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    const latency = Date.now() - startTime

    return {
      isHealthy: response.ok,
      latency,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      isHealthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
