import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users2, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"

export default async function ExtensionAgentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get current user's profile
  const { data: currentUser } = await supabase
    .from("users")
    .select("*, organizations(org_name)")
    .eq("id", user.id)
    .single()

  if (!currentUser) {
    redirect("/auth/login")
  }

  // Build query based on role
  let query = supabase
    .from("users")
    .select("*, organizations(org_name)")
    .eq("role", "field_agent")
    .order("created_at", { ascending: false })

  // Filter by organization for non-super admins
  if (currentUser.role !== "super_admin") {
    query = query.eq("organization_id", currentUser.organization_id)
  }

  const { data: agents } = await query

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-poppins font-semibold text-[#000000]">Extension Agents</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              {agents?.length || 0} agent{agents?.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
            <Link href="/dashboard/extension-agents/new">
              <Plus className="h-4 w-4 mr-2" />
              Register Agent
            </Link>
          </Button>
        </div>

        <Card className="rounded-[25px] border-none shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.45)]" />
              <Input
                placeholder="Search agents by name, phone, or ID..."
                className="pl-10 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </CardContent>
        </Card>

        {agents && agents.length > 0 ? (
          <div className="grid gap-4">
            {agents.map((agent: any) => (
              <Card key={agent.id} className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center text-[#39B54A] font-semibold text-lg flex-shrink-0">
                        {agent.first_name[0]}
                        {agent.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-inter font-semibold text-[#000000]">
                          {agent.first_name} {agent.last_name}
                        </h3>
                        <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{agent.email}</p>
                        {agent.phone && <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{agent.phone}</p>}
                        {agent.organizations && (
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">
                            {agent.organizations.org_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={agent.is_active ? "default" : "secondary"}
                        className={`rounded-full font-inter ${
                          agent.is_active
                            ? "bg-[rgba(57,181,74,0.1)] text-[#39B54A] hover:bg-[rgba(57,181,74,0.2)]"
                            : ""
                        }`}
                      >
                        {agent.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                      >
                        <Link href={`/dashboard/extension-agents/${agent.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <Users2 className="h-8 w-8 text-[#39B54A]" />
                </div>
              </div>
              <h3 className="text-lg font-poppins font-semibold text-[#000000] mb-2">No extension agents yet</h3>
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-6">
                Get started by registering your first extension agent
              </p>
              <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                <Link href="/dashboard/extension-agents/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Register First Agent
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
