import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { QuickLogInterface } from "@/components/quick-log-interface"

export default async function QuickLogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quick Log Activity</h1>
          <p className="text-gray-600 mt-1">Select an activity type to quickly log farm activities</p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <QuickLogInterface userId={user.id} />
        </Suspense>
      </div>
    </div>
  )
}
