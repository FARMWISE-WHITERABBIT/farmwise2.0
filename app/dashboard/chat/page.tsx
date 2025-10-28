import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chat-interface"

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: currentUser } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!currentUser) {
    redirect("/auth/login")
  }

  // Get conversations based on user role
  let conversationsQuery = supabase
    .from("chat_conversations")
    .select(
      `
      *,
      farmers(id, first_name, last_name, user_id),
      agents:users!chat_conversations_agent_id_fkey(id, first_name, last_name)
    `,
    )
    .order("last_message_at", { ascending: false })

  if (currentUser.role === "field_agent") {
    conversationsQuery = conversationsQuery.eq("agent_id", currentUser.id)
  } else if (currentUser.role === "farmer") {
    // Get farmer profile
    const { data: farmerProfile } = await supabase.from("farmers").select("id").eq("user_id", currentUser.id).single()

    if (farmerProfile) {
      conversationsQuery = conversationsQuery.eq("farmer_id", farmerProfile.id)
    }
  } else if (currentUser.role !== "super_admin") {
    conversationsQuery = conversationsQuery.eq("organization_id", currentUser.organization_id)
  }

  const { data: conversations } = await conversationsQuery

  // Get all farmers for starting new conversations (for agents)
  let farmers = []
  if (currentUser.role === "field_agent") {
    const { data: farmersList } = await supabase
      .from("farmers")
      .select("id, first_name, last_name, user_id")
      .eq("assigned_agent_id", currentUser.id)
      .order("first_name")

    farmers = farmersList || []
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <ChatInterface currentUser={currentUser} conversations={conversations || []} farmers={farmers} />
    </div>
  )
}
