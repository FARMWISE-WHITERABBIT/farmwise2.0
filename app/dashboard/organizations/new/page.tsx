import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrganizationRegistrationForm } from "@/components/organization-registration-form"

export default async function NewOrganizationPage() {
  let user = null
  let authError = null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    user = data?.user
    authError = error
  } catch (error) {
    console.error("[v0] Failed to connect to Supabase:", error)
    authError = error as Error
  }

  // Only redirect if we successfully connected but user is not authenticated
  if (authError && authError.message !== "Supabase environment variables are not configured") {
    redirect("/auth/login")
  }

  if (!user && !authError) {
    redirect("/auth/login")
  }
  // </CHANGE>

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-xl font-poppins font-semibold text-[#000000]">Add New Organization</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            Register a new government agency, cooperative, or partner organization
          </p>
        </div>

        <OrganizationRegistrationForm />
      </div>
    </div>
  )
}
