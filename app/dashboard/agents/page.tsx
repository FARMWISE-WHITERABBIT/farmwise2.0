import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, UserCog, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Extension Agents | Farmwise",
  description: "Manage extension agents and their farmer assignments",
}

export default async function ExtensionAgentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch extension agents (users with role='field_agent')
  const { data: agents } = await supabase
    .from("users")
    .select(
      `
      *,
      assigned_farmers:farmers!farmers_assigned_agent_id_fkey(count)
    `,
    )
    .eq("role", "field_agent")
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Extension Agents</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              Manage extension agents and their farmer assignments
            </p>
          </div>
          <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
            <Link href="/dashboard/agents/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 rounded-[25px] border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.45)]" />
                <Input
                  placeholder="Search agents by name, email, or phone..."
                  className="pl-10 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                />
              </div>
              <Button variant="outline" className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-transparent">
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agents Grid */}
        {!agents || agents.length === 0 ? (
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                <UserCog className="h-8 w-8 text-[#39B54A]" />
              </div>
              <h3 className="font-poppins text-xl font-semibold mb-2">No extension agents yet</h3>
              <p className="text-[rgba(0,0,0,0.65)] font-inter mb-6">
                Get started by adding your first extension agent
              </p>
              <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                <Link href="/dashboard/agents/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Agent
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent: any) => {
              const farmerCount = agent.assigned_farmers?.[0]?.count || 0
              return (
                <Card key={agent.id} className="rounded-[25px] border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] text-[#39B54A] font-semibold text-lg flex-shrink-0">
                        {agent.first_name[0]}
                        {agent.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-poppins font-semibold text-lg text-[#000000] truncate">
                          {agent.first_name} {agent.last_name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="mt-1 rounded-full font-inter text-xs bg-[rgba(57,181,74,0.1)] text-[#39B54A] border-[#39B54A]"
                        >
                          Extension Agent
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm font-inter">
                      {agent.email && (
                        <div className="flex items-center gap-2 text-[rgba(0,0,0,0.65)]">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{agent.email}</span>
                        </div>
                      )}
                      {agent.phone && (
                        <div className="flex items-center gap-2 text-[rgba(0,0,0,0.65)]">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{agent.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[rgba(57,181,74,0.1)]">
                          <span className="text-sm font-semibold text-[#39B54A]">{farmerCount}</span>
                        </div>
                        <span className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                          {farmerCount === 1 ? "farmer" : "farmers"}
                        </span>
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                      >
                        <Link href={`/dashboard/agents/${agent.id}`}>View</Link>
                      </Button>
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
