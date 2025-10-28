import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PlotRegistrationForm from "@/components/forms/plot-registration-form"

export default async function NewPlotPage() {
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
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-poppins font-semibold text-[#000000]">New Farm Plot</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">Register a new farm plot with GPS mapping</p>
        </div>

        <div className="max-w-3xl">
          <PlotRegistrationForm userId={user.id} organizationId={userData.organization_id} />
        </div>
      </div>
    </div>
  )
}
