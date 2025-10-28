import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Users, Shield, Eye, UserCog } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "User Management | Farmwise",
  description: "Manage organization users and permissions",
}

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get current user's role and organization
  const { data: currentUser } = await supabase.from("users").select("role, organization_id").eq("id", user.id).single()

  if (!currentUser || !["super_admin", "admin"].includes(currentUser.role)) {
    redirect("/dashboard")
  }

  // Fetch users based on role
  let usersQuery = supabase
    .from("users")
    .select(`
      *,
      organizations(org_name)
    `)
    .order("created_at", { ascending: false })

  // If not super_admin, only show users from same organization
  if (currentUser.role !== "super_admin" && currentUser.organization_id) {
    usersQuery = usersQuery.eq("organization_id", currentUser.organization_id)
  }

  const { data: users } = await usersQuery

  const stats = {
    total: users?.length || 0,
    admins: users?.filter((u) => u.role === "admin").length || 0,
    managers: users?.filter((u) => u.role === "manager").length || 0,
    viewers: users?.filter((u) => u.role === "viewer").length || 0,
    agents: users?.filter((u) => u.role === "field_agent").length || 0,
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      manager: "Manager",
      viewer: "Viewer",
      field_agent: "Extension Agent",
      analyst: "Analyst",
      farmer: "Farmer",
    }
    return labels[role] || role
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
      case "super_admin":
        return Shield
      case "manager":
        return UserCog
      case "viewer":
        return Eye
      default:
        return Users
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
      case "super_admin":
        return "text-[#9C27B0] bg-[rgba(156,39,176,0.1)]"
      case "manager":
        return "text-[#2196F3] bg-[rgba(33,150,243,0.1)]"
      case "viewer":
        return "text-[#FF9800] bg-[rgba(255,152,0,0.1)]"
      default:
        return "text-[#39B54A] bg-[rgba(57,181,74,0.1)]"
    }
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Users */}
          <Card className="rounded-[20px] border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                  <Users className="h-6 w-6 text-[#39B54A]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[rgba(0,0,0,0.65)] mb-1 font-inter">Total Users</p>
                  <p className="text-[32px] font-semibold text-[#000000] font-poppins">
                    {stats.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admins */}
          <Card className="rounded-[20px] border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(156,39,176,0.1)]">
                  <Shield className="h-6 w-6 text-[#9C27B0]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[rgba(0,0,0,0.65)] mb-1 font-inter">Admins</p>
                  <p className="text-[32px] font-semibold text-[#000000] font-poppins">
                    {stats.admins.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Managers */}
          <Card className="rounded-[20px] border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(33,150,243,0.1)]">
                  <UserCog className="h-6 w-6 text-[#2196F3]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[rgba(0,0,0,0.65)] mb-1 font-inter">Managers</p>
                  <p className="text-[32px] font-semibold text-[#000000] font-poppins">
                    {stats.managers.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Viewers */}
          <Card className="rounded-[20px] border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,152,0,0.1)]">
                  <Eye className="h-6 w-6 text-[#FF9800]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[rgba(0,0,0,0.65)] mb-1 font-inter">Viewers</p>
                  <p className="text-[32px] font-semibold text-[#000000] font-poppins">
                    {stats.viewers.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-poppins font-semibold text-[#000000]">User Management</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              Manage users and their permissions within your organization
            </p>
          </div>
          <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] h-11 px-6 font-inter">
            <Link href="/dashboard/users/new">
              <Plus className="h-5 w-5 mr-2" />
              Add User
            </Link>
          </Button>
        </div>

        {!users || users.length === 0 ? (
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                <Users className="h-8 w-8 text-[#39B54A]" />
              </div>
              <h3 className="font-semibold text-xl mb-2 font-poppins">No users yet</h3>
              <p className="text-[rgba(0,0,0,0.65)] mb-6 font-inter">Get started by adding your first user</p>
              <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                <Link href="/dashboard/users/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First User
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {users.map((u: any) => {
              const RoleIcon = getRoleIcon(u.role)
              const roleColor = getRoleColor(u.role)

              return (
                <Card
                  key={u.id}
                  className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${roleColor}`}>
                          <RoleIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-[#000000] font-poppins">
                            {u.first_name} {u.last_name}
                          </h3>
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{u.email}</p>
                          {u.organizations && (
                            <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">
                              {u.organizations.org_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium font-inter ${roleColor}`}
                        >
                          {getRoleLabel(u.role)}
                        </span>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium font-inter ${
                            u.is_active
                              ? "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
                              : "bg-[rgba(0,0,0,0.08)] text-[rgba(0,0,0,0.45)]"
                          }`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-[10px] border-[#39B54A] text-[#39B54A] hover:bg-[rgba(57,181,74,0.1)] hover:text-[#39B54A] bg-transparent font-inter"
                        >
                          <Link href={`/dashboard/users/${u.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
