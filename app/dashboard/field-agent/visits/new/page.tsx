import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import FieldVisitForm from "@/components/field-visit-form"

export const metadata = {
  title: "New Field Visit | Farmwise",
  description: "Document a new field visit",
}

export default async function NewFieldVisitPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Document Field Visit</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            Record your farm visit with photos, location, and observations
          </p>
        </div>

        <FieldVisitForm userId={user.id} />
      </div>
    </div>
  )
}
