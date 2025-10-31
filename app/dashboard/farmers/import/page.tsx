import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { FarmerImportForm } from "@/components/farmer-import-form"

export default async function FarmerImportPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!userData || !["admin", "super_admin", "extension_agent"].includes(userData.role)) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Import Farmers</h1>
          <p className="text-muted-foreground mt-2">Bulk upload farmer data using CSV or Excel files</p>
        </div>

        <FarmerImportForm userId={user.id} organizationId={userData.organization_id} />
      </div>
    </div>
  )
}
