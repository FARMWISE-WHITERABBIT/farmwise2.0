import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SyncInterface } from "@/components/sync-interface"

export default async function SyncPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <Suspense fallback={<div>Loading...</div>}>
        <SyncInterface userId={user.id} />
      </Suspense>
    </div>
  )
}
