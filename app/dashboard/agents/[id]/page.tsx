import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, Calendar, Users, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  if (params.id === "new") {
    redirect("/dashboard/agents/new")
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  console.log("[v0] Fetching agent with ID:", params.id)

  const { data: agent, error } = await supabase
    .from("users")
    .select(`
      *,
      organizations!users_organization_id_fkey(org_name)
    `)
    .eq("id", params.id)
    .eq("role", "field_agent")
    .single()

  console.log("[v0] Agent query result:", { agent, error })

  if (error || !agent) {
    console.log("[v0] Agent not found, calling notFound()")
    notFound()
  }

  // Fetch assigned farmers
  const { data: assignedFarmers } = await supabase
    .from("farmers")
    .select("*")
    .eq("assigned_agent_id", params.id)
    .order("created_at", { ascending: false })

  console.log("[v0] Assigned farmers:", assignedFarmers?.length || 0)

  return (
    <div className="flex-1 bg-background">
      <div className="p-8">
        <Button asChild variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/agents">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Extension Agents
          </Link>
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl flex-shrink-0">
              {agent.first_name?.[0] || "E"}
              {agent.last_name?.[0] || "A"}
            </div>
            <div>
              <h1 className="text-2xl font-poppins font-semibold text-foreground">
                {agent.first_name} {agent.last_name}
              </h1>
              <p className="text-sm text-muted-foreground font-inter mt-1">Extension Agent</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={agent.is_active ? "default" : "secondary"} className="rounded-full font-inter">
                  {agent.is_active ? "Active" : "Inactive"}
                </Badge>
                {agent.organizations && (
                  <Badge variant="outline" className="rounded-full font-inter">
                    {agent.organizations.org_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-[10px] font-inter">
            <Link href={`/dashboard/extension-agents/${params.id}/edit`}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Agent
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card rounded-[15px] p-1 shadow-sm">
            <TabsTrigger
              value="overview"
              className="rounded-[10px] font-inter data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="farmers"
              className="rounded-[10px] font-inter data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Assigned Farmers ({assignedFarmers?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="rounded-[10px] font-inter data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agent.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground font-inter">Email</p>
                        <p className="text-sm font-inter">{agent.email}</p>
                      </div>
                    </div>
                  )}
                  {agent.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground font-inter">Phone</p>
                        <p className="text-sm font-inter">{agent.phone}</p>
                      </div>
                    </div>
                  )}
                  {agent.state && (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5" />
                      <div>
                        <p className="text-xs text-muted-foreground font-inter">Location</p>
                        <p className="text-sm font-inter">
                          {agent.lga}, {agent.state}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground font-inter">Joined</p>
                      <p className="text-sm font-inter">{new Date(agent.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-[15px]">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-sm font-inter text-muted-foreground">Assigned Farmers</span>
                    </div>
                    <span className="text-2xl font-poppins font-semibold text-primary">
                      {assignedFarmers?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="farmers" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground font-inter">
                {assignedFarmers?.length || 0} farmer{assignedFarmers?.length !== 1 ? "s" : ""} assigned to this agent
              </p>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-[10px] font-inter">
                Assign Farmers
              </Button>
            </div>
            {assignedFarmers && assignedFarmers.length > 0 ? (
              <div className="grid gap-4">
                {assignedFarmers.map((farmer: any) => (
                  <Card
                    key={farmer.id}
                    className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {farmer.first_name[0]}
                          {farmer.last_name[0]}
                        </div>
                        <div>
                          <p className="font-inter font-medium">
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
                        className="text-primary hover:text-primary/90 hover:bg-primary/10 rounded-[8px] font-inter"
                      >
                        <Link href={`/dashboard/farmers/${farmer.id}`}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground font-inter">No farmers assigned to this agent yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance">
            <Card className="rounded-[25px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-inter">Performance tracking coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
