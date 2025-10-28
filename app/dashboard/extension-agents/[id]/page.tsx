import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Users, Calendar, ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"

export default async function ExtensionAgentDetailPage({ params }: { params: { id: string } }) {
  if (params.id === "new") {
    redirect("/dashboard/extension-agents")
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch agent details
  const { data: agent, error } = await supabase
    .from("users")
    .select("*, organizations(org_name)")
    .eq("id", params.id)
    .eq("role", "field_agent")
    .single()

  if (error || !agent) {
    console.error("[v0] Agent fetch error:", error)
    notFound()
  }

  // Fetch farmers assigned to this agent
  const { data: farmers } = await supabase
    .from("farmers")
    .select("*")
    .eq("assigned_agent_id", params.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 bg-background">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-[rgba(57,181,74,0.1)]">
            <Link href="/dashboard/extension-agents">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-poppins font-semibold text-foreground">Extension Agent Profile</h1>
            <p className="text-sm text-muted-foreground font-inter">View and manage agent details</p>
          </div>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] text-[#39B54A] font-bold text-2xl flex-shrink-0">
              {agent.first_name[0]}
              {agent.last_name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-poppins font-semibold text-foreground">
                {agent.first_name} {agent.last_name}
              </h2>
              <p className="text-sm text-muted-foreground font-inter mt-1">Extension Agent</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={agent.is_active ? "default" : "secondary"}
                  className={`rounded-full font-inter ${
                    agent.is_active ? "bg-[rgba(57,181,74,0.1)] text-[#39B54A] hover:bg-[rgba(57,181,74,0.2)]" : ""
                  }`}
                >
                  {agent.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
            <Link href={`/dashboard/extension-agents/${agent.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Agent
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card className="rounded-[25px] border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="font-poppins text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-inter">Email</p>
                  <p className="text-sm font-inter text-foreground">{agent.email}</p>
                </div>
              </div>
              {agent.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-inter">Phone</p>
                    <p className="text-sm font-inter text-foreground">{agent.phone}</p>
                  </div>
                </div>
              )}
              {(agent.state || agent.lga) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-inter">Location</p>
                    <p className="text-sm font-inter text-foreground">
                      {agent.lga && `${agent.lga}, `}
                      {agent.state}
                    </p>
                  </div>
                </div>
              )}
              {agent.organizations && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-inter">Organization</p>
                    <p className="text-sm font-inter text-foreground">{agent.organizations.org_name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="font-poppins text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[rgba(57,181,74,0.05)] rounded-[15px]">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#39B54A]" />
                  <span className="text-sm font-inter text-muted-foreground">Assigned Farmers</span>
                </div>
                <span className="text-2xl font-poppins font-semibold text-[#39B54A]">{farmers?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[rgba(57,181,74,0.05)] rounded-[15px]">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[#39B54A]" />
                  <span className="text-sm font-inter text-muted-foreground">Joined</span>
                </div>
                <span className="text-sm font-inter font-medium text-foreground">
                  {new Date(agent.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[25px] border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="font-poppins text-lg">Assigned Farmers ({farmers?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {farmers && farmers.length > 0 ? (
              <div className="grid gap-4">
                {farmers.map((farmer: any) => (
                  <div key={farmer.id} className="flex items-center justify-between p-4 bg-muted rounded-[15px]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center text-[#39B54A] font-semibold">
                        {farmer.first_name[0]}
                        {farmer.last_name[0]}
                      </div>
                      <div>
                        <p className="font-inter font-medium text-foreground">
                          {farmer.first_name} {farmer.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground font-inter">
                          {farmer.lga}, {farmer.state}
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                    >
                      <Link href={`/dashboard/farmers/${farmer.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground font-inter py-8">No farmers assigned yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
