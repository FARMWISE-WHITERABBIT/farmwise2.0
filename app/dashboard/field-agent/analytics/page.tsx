import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ActivityAnalyticsDashboard } from "@/components/activity-analytics-dashboard"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <Suspense fallback={<div>Loading analytics...</div>}>
        <ActivityAnalyticsDashboard userId={user.id} />
      </Suspense>
    </div>
  )
}
