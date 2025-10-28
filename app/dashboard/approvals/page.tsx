import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ApprovalsInterface } from "@/components/approvals-interface"

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: currentUser } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!currentUser || !["admin", "manager", "super_admin"].includes(currentUser.role)) {
    redirect("/dashboard")
  }

  // Get pending organization approvals (super admin only)
  let pendingOrgs = []
  if (currentUser.role === "super_admin") {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("requires_approval", true)
      .eq("is_approved", false)
      .order("created_at", { ascending: false })

    pendingOrgs = data || []
  }

  // Get pending user approvals
  let pendingUsersQuery = supabase
    .from("users")
    .select("*, organizations(org_name)")
    .eq("requires_approval", true)
    .eq("is_approved", false)
    .order("created_at", { ascending: false })

  if (currentUser.role !== "super_admin") {
    pendingUsersQuery = pendingUsersQuery.eq("organization_id", currentUser.organization_id)
  }

  const { data: pendingUsers } = await pendingUsersQuery

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-xl font-poppins font-semibold text-[#000000]">Pending Approvals</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">Review and approve pending registrations</p>
        </div>

        <ApprovalsInterface
          currentUser={currentUser}
          pendingOrganizations={pendingOrgs}
          pendingUsers={pendingUsers || []}
        />
      </div>
    </div>
  )
}
