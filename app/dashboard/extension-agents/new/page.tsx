import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ExtensionAgentForm } from "@/components/extension-agent-form"

export default async function NewExtensionAgentPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get current user's profile
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!currentUser) {
    redirect("/auth/login")
  }

  // Get organizations for super admin
  const { data: organizations } = await supabase.from("organizations").select("id, org_name").order("org_name")

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-xl font-poppins font-semibold text-[#000000]">Register Extension Agent</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">Add a new extension agent to assist farmers</p>
        </div>

        <ExtensionAgentForm currentUser={currentUser} organizations={organizations || []} />
      </div>
    </div>
  )
}
