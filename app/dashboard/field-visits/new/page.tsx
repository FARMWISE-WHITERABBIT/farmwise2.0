import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FieldVisitForm } from "@/components/field-visit-form"

export const metadata = {
  title: "Log Field Visit | Farmwise",
  description: "Record a new field visit",
}

export default async function NewFieldVisitPage({
  searchParams,
}: {
  searchParams: { farmer_id?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user details
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (userData?.role !== "field_agent") {
    redirect("/dashboard")
  }

  // Get farmers assigned to this agent
  const { data: farmers } = await supabase
    .from("farmers")
    .select("id, first_name, last_name, farmer_id")
    .eq("assigned_agent_id", user.id)
    .order("first_name")

  // If farmer_id is provided, get that farmer's plots
  let farmerPlots = null
  if (searchParams.farmer_id) {
    const { data: plots } = await supabase
      .from("farm_plots")
      .select("id, plot_name, plot_code")
      .eq("farmer_id", searchParams.farmer_id)
      .order("plot_name")

    farmerPlots = plots
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pb-24 md:pb-24 lg:pb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-poppins font-semibold text-[rgba(0,0,0,0.87)]">Log Field Visit</h1>
        <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
          Record observations and recommendations from your farm visit
        </p>
      </div>

      <FieldVisitForm
        agentId={user.id}
        farmers={farmers || []}
        initialFarmerId={searchParams.farmer_id}
        initialPlots={farmerPlots || []}
      />
    </div>
  )
}
