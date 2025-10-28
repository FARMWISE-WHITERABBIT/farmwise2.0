import { redirect, notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { OrganizationEditForm } from "@/components/organization-edit-form"

export default async function EditOrganizationPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Check if user is super_admin
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userProfile?.role !== "super_admin") {
    redirect("/dashboard/organizations")
  }

  // Fetch organization details
  const { data: organization, error } = await supabase.from("organizations").select("*").eq("id", params.id).single()

  if (error || !organization) {
    notFound()
  }

  return (
    <div className="flex-1 bg-background">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-poppins font-semibold text-foreground">Edit Organization</h1>
          <p className="text-sm text-muted-foreground font-inter mt-1">Update organization details and settings</p>
        </div>

        <OrganizationEditForm organization={organization} />
      </div>
    </div>
  )
}
