import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserRegistrationForm } from "@/components/user-registration-form"

export const dynamic = "force-dynamic"

export default async function NewUserPage({ searchParams }: { searchParams: { organization_id?: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get current user's organization and role
  const { data: currentUser } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single()

  if (!currentUser || !["super_admin", "admin"].includes(currentUser.role)) {
    redirect("/dashboard")
  }

  // Fetch organizations (for super admins)
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, org_name")
    .eq("is_active", true)
    .order("org_name")

  const preselectedOrgId = searchParams.organization_id || currentUser?.organization_id

  return (
    <div className="flex-1 bg-background">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-xl font-poppins font-semibold text-foreground">Add New User</h1>
          <p className="text-sm text-muted-foreground font-inter mt-1">
            Create a new user account with specific role and permissions
          </p>
        </div>

        <UserRegistrationForm
          organizations={organizations || []}
          currentUserOrgId={preselectedOrgId}
          currentUserRole={currentUser?.role}
          preselectedOrgId={searchParams.organization_id}
        />
      </div>
    </div>
  )
}
