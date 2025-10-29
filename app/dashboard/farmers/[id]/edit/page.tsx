import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import FarmerEditForm from "@/components/farmer-edit-form"

export default async function EditFarmerPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get farmer data
  const { data: farmer } = await supabase.from("farmers").select("*").eq("id", params.id).single()

  if (!farmer) {
    redirect("/dashboard/farmers")
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pb-24 md:pb-24 lg:pb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-poppins font-semibold text-[rgba(0,0,0,0.87)]">Edit Farmer</h1>
        <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
          Update farmer information for {farmer.first_name} {farmer.last_name}
        </p>
      </div>

      <FarmerEditForm farmer={farmer} userId={user.id} />
    </div>
  )
}
