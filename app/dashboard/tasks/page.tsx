import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, ListTodo, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function TasksPage() {
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

  // Build query based on role
  let query = supabase
    .from("farmer_tasks")
    .select(
      `
      *,
      farmers(first_name, last_name),
      assigned_by_user:users!farmer_tasks_assigned_by_fkey(first_name, last_name),
      assigned_to_user:users!farmer_tasks_assigned_to_agent_fkey(first_name, last_name)
    `,
    )
    .order("created_at", { ascending: false })

  // Filter by organization for non-super admins
  if (currentUser.role !== "super_admin") {
    query = query.eq("organization_id", currentUser.organization_id)
  }

  // Filter by agent for field agents
  if (currentUser.role === "field_agent") {
    query = query.eq("assigned_to_agent", currentUser.id)
  }

  const { data: tasks } = await query

  const pendingTasks = tasks?.filter((t: any) => t.status === "pending") || []
  const inProgressTasks = tasks?.filter((t: any) => t.status === "in_progress") || []
  const completedTasks = tasks?.filter((t: any) => t.status === "completed") || []

  const canCreateTasks = ["admin", "manager", "super_admin"].includes(currentUser.role)

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-poppins font-semibold text-[#000000]">Task Management</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              {tasks?.length || 0} task{tasks?.length !== 1 ? "s" : ""} total
            </p>
          </div>
          {canCreateTasks && (
            <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
              <Link href="/dashboard/tasks/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Link>
            </Button>
          )}
        </div>

        <Card className="rounded-[25px] border-none shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.45)]" />
              <Input
                placeholder="Search tasks by title, farmer, or description..."
                className="pl-10 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white rounded-[15px] p-1 shadow-sm">
            <TabsTrigger
              value="all"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              All ({tasks?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Pending ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="in_progress"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              In Progress ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Completed ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TaskList tasks={tasks || []} />
          </TabsContent>

          <TabsContent value="pending">
            <TaskList tasks={pendingTasks} />
          </TabsContent>

          <TabsContent value="in_progress">
            <TaskList tasks={inProgressTasks} />
          </TabsContent>

          <TabsContent value="completed">
            <TaskList tasks={completedTasks} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function TaskList({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) {
    return (
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardContent className="py-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
              <ListTodo className="h-8 w-8 text-[#39B54A]" />
            </div>
          </div>
          <h3 className="text-lg font-poppins font-semibold text-[#000000] mb-2">No tasks found</h3>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Tasks will appear here when created</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task: any) => (
        <Card key={task.id} className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-inter font-semibold text-[#000000]">{task.title}</h3>
                  <Badge
                    variant="outline"
                    className={`rounded-full font-inter ${
                      task.priority === "urgent"
                        ? "border-red-500 text-red-500"
                        : task.priority === "high"
                          ? "border-orange-500 text-orange-500"
                          : task.priority === "medium"
                            ? "border-blue-500 text-blue-500"
                            : "border-gray-500 text-gray-500"
                    }`}
                  >
                    {task.priority}
                  </Badge>
                  <Badge
                    className={`rounded-full font-inter ${
                      task.status === "completed"
                        ? "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
                        : task.status === "in_progress"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">{task.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-[rgba(0,0,0,0.45)] font-inter">
                  <span>
                    Farmer: {task.farmers?.first_name} {task.farmers?.last_name}
                  </span>
                  {task.assigned_to_user && (
                    <span>
                      Agent: {task.assigned_to_user.first_name} {task.assigned_to_user.last_name}
                    </span>
                  )}
                  {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
              >
                <Link href={`/dashboard/tasks/${task.id}`}>View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
