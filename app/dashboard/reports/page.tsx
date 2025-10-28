import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReportGenerator } from "@/components/report-generator"

export const metadata = {
  title: "Reports - FarmWise",
  description: "Generate and export comprehensive reports",
}

export default async function ReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: currentUser } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!currentUser || !["admin", "manager", "field_agent", "super_admin"].includes(currentUser.role)) {
    redirect("/dashboard")
  }

  // Get organizations for super admin
  const { data: organizations } = await supabase.from("organizations").select("id, org_name").order("org_name")

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-xl font-poppins font-semibold text-[#000000]">Reports</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">Generate and export comprehensive reports</p>
        </div>

        <ReportGenerator currentUser={currentUser} organizations={organizations || []} />
      </div>
    </div>
  )
}
