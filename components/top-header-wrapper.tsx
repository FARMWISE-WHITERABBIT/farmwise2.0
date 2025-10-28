"use client"

import { createServerClient } from "@/lib/supabase/server"
import { TopHeader } from "./top-header"
import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export async function TopHeaderWrapper({ onMenuClick }: { onMenuClick?: () => void }) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error in TopHeaderWrapper:", authError)
      return (
        <header className="fixed top-0 right-0 left-0 lg:left-[200px] h-[80px] bg-white dark:bg-gray-900 border-b border-[rgba(0,0,0,0.12)] dark:border-gray-800 z-40 px-4 md:px-8">
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-sm">Authentication Error</CardTitle>
                </div>
                <CardDescription className="text-xs">Unable to verify your session</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" onClick={() => (window.location.href = "/auth/login")} className="w-full">
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </header>
      )
    }

    // Fetch user profile with role
    const { data: userProfile } = await supabase
      .from("users")
      .select("first_name, last_name, role, avatar_url")
      .eq("id", user.id)
      .single()

    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    const displayName = userProfile
      ? `${userProfile.first_name} ${userProfile.last_name}`
      : user.email?.split("@")[0] || "User"

    const initials = userProfile
      ? `${userProfile.first_name?.[0] || ""}${userProfile.last_name?.[0] || ""}`
      : user.email?.[0]?.toUpperCase() || "U"

    const roleDisplay = userProfile?.role
      ? userProfile.role
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "User"

    return (
      <TopHeader
        onMenuClick={onMenuClick}
        user={{
          displayName,
          initials,
          roleDisplay,
          avatarUrl: userProfile?.avatar_url,
        }}
        unreadCount={unreadCount || 0}
      />
    )
  } catch (error) {
    console.error("[v0] Error in TopHeaderWrapper:", error)
    return (
      <header className="fixed top-0 right-0 left-0 lg:left-[200px] h-[80px] bg-white dark:bg-gray-900 border-b border-[rgba(0,0,0,0.12)] dark:border-gray-800 z-40 px-4 md:px-8">
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-sm">Connection Error</CardTitle>
              </div>
              <CardDescription className="text-xs">Unable to connect to the server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <Button size="sm" onClick={() => window.location.reload()} className="w-full">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </header>
    )
  }
}
