import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BatchRegistrationWizard } from "@/components/batch-registration-wizard"

export default async function NewBatchPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  if (!userData?.organization_id) {
    redirect("/dashboard")
  }

  return (
    <div className="flex-1 bg-background">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">New Harvest Batch</h1>
          <p className="text-sm text-muted-foreground mt-1">Register a new harvest batch for traceability</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <BatchRegistrationWizard
            onComplete={(batchId) => {
              window.location.href = `/dashboard/traceability/${batchId}`
            }}
            onCancel={() => {
              window.location.href = "/dashboard/traceability"
            }}
          />
        </div>
      </div>
    </div>
  )
}
