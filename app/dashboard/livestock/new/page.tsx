import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LivestockRegistrationForm } from "@/components/livestock-registration-form"

export const metadata = {
  title: "Register Livestock | Farmwise",
  description: "Register new livestock",
}

export default async function NewLivestockPage({
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

  const farmerId = searchParams.farmer_id

  if (!farmerId) {
    redirect("/dashboard/farmers")
  }

  // Get farmer details
  const { data: farmer } = await supabase.from("farmers").select("first_name, last_name").eq("id", farmerId).single()

  const farmerName = farmer ? `${farmer.first_name} ${farmer.last_name}` : undefined

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pb-24 md:pb-24 lg:pb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-poppins font-semibold text-[rgba(0,0,0,0.87)]">Register Livestock</h1>
        <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
          Add livestock information to the farmer's profile
        </p>
      </div>

      <LivestockRegistrationForm farmerId={farmerId} farmerName={farmerName} />
    </div>
  )
}
