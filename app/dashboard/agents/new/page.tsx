import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NewAgentClientPage from "./client-page"

export const metadata = {
  title: "Add Extension Agent | Farmwise",
  description: "Register a new extension agent to manage farmers",
}

export default async function NewAgentPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single()

  if (userError || !userData) {
    redirect("/auth/login")
  }

  const hasAccess = ["super_admin", "admin", "manager"].includes(userData.role)

  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, org_name")
    .eq("is_active", true)
    .order("org_name")

  return <NewAgentClientPage userData={userData} organizations={organizations || []} hasAccess={hasAccess} />
}
