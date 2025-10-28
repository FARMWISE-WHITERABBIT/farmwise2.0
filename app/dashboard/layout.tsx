import type React from "react"
import { DashboardLayoutClient } from "@/components/dashboard-layout-client"
import { getAuthUser } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getAuthUser()

  if (!user) {
    redirect("/auth/login")
  }

  let userData = {
    displayName: user.email?.split("@")[0] || "User",
    initials: user.email?.[0]?.toUpperCase() || "U",
    roleDisplay: "User",
    avatarUrl: undefined as string | undefined,
    role: "user" as string,
  }

  let unreadCount = 0
  let hasDataError = false

  try {
    const supabase = await createClient()

    // Fetch user profile with timeout
    const profilePromise = supabase
      .from("users")
      .select("first_name, last_name, role, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => data)
      .catch(() => null)

    // Fetch notifications with timeout
    const notificationsPromise = supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .then(({ count }) => count || 0)
      .catch(() => 0)

    // Wait for both with timeout
    const [userProfile, count] = await Promise.race([
      Promise.all([profilePromise, notificationsPromise]),
      new Promise<[null, number]>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
    ]).catch(() => {
      hasDataError = true
      return [null, 0] as [null, number]
    })

    if (userProfile) {
      userData = {
        displayName: `${userProfile.first_name} ${userProfile.last_name}`,
        initials: `${userProfile.first_name?.[0] || ""}${userProfile.last_name?.[0] || ""}`,
        roleDisplay: userProfile.role
          ? userProfile.role
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          : "User",
        avatarUrl: userProfile.avatar_url,
        role: userProfile.role || "user",
      }
    }

    unreadCount = count
  } catch (error) {
    console.error("[v0] Error fetching dashboard data:", error)
    hasDataError = true
  }

  return (
    <>
      {hasDataError && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Issue</AlertTitle>
            <AlertDescription>
              Some features may be limited due to connectivity issues. Your data is safe.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <DashboardLayoutClient userData={userData} unreadCount={unreadCount}>
        {children}
      </DashboardLayoutClient>
    </>
  )
}
