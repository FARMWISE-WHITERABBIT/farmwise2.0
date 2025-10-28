import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FarmerRegistrationForm } from "@/components/farmer-registration-form"

export const metadata = {
  title: "Register New Farmer | Farmwise",
  description: "Add a new farmer to your database",
}

export default async function NewFarmerPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 bg-[#F5F5F5] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Register New Farmer</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">Add a new farmer to your database</p>
        </div>

        <FarmerRegistrationForm userId={user.id} />
      </div>
    </div>
  )
}
