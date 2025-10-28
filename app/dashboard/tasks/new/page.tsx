import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TaskForm } from "@/components/task-form"

export default async function NewTaskPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: currentUser } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!currentUser || !["admin", "manager", "super_admin"].includes(currentUser.role)) {
    redirect("/dashboard/tasks")
  }

  // Get farmers
  let farmersQuery = supabase.from("farmers").select("id, first_name, last_name").order("first_name")

  if (currentUser.role !== "super_admin") {
    farmersQuery = farmersQuery.eq("organization_id", currentUser.organization_id)
  }

  const { data: farmers } = await farmersQuery

  // Get extension agents
  let agentsQuery = supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "field_agent")
    .order("first_name")

  if (currentUser.role !== "super_admin") {
    agentsQuery = agentsQuery.eq("organization_id", currentUser.organization_id)
  }

  const { data: agents } = await agentsQuery

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-xl font-poppins font-semibold text-[#000000]">Create New Task</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">Assign a task to a farmer</p>
        </div>

        <TaskForm currentUser={currentUser} farmers={farmers || []} agents={agents || []} />
      </div>
    </div>
  )
}
