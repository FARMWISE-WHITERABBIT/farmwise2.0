import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Building2, Users, Landmark, UsersRound } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Organizations | Farmwise",
  description: "Manage government agencies, cooperatives, and partner organizations",
}

export default async function OrganizationsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  console.log("[v0] Fetching organizations for user:", user.id)

  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false })

  if (orgError) {
    console.error("[v0] Error fetching organizations:", orgError.message)
  }

  let organizationsWithCounts = organizations || []
  if (organizations && organizations.length > 0) {
    const countsPromises = organizations.map(async (org) => {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", org.id)

      return { ...org, userCount: count || 0 }
    })

    organizationsWithCounts = await Promise.all(countsPromises)
  }

  console.log("[v0] Organizations fetched:", organizationsWithCounts?.length || 0)

  const stats = {
    total: organizationsWithCounts?.length || 0,
    government: organizationsWithCounts?.filter((org) => org.org_type === "government").length || 0,
    cooperative: organizationsWithCounts?.filter((org) => org.org_type === "cooperative").length || 0,
    aggregator: organizationsWithCounts?.filter((org) => org.org_type === "private_aggregator").length || 0,
  }

  const getOrgTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      government: "Government Agency",
      cooperative: "Cooperative",
      ngo: "NGO",
      private_aggregator: "Commodity Aggregator",
      research: "Research Institution",
    }
    return labels[type] || type
  }

  return (
    <div className="flex-1 bg-background">
      <div className="p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Organizations */}
          <Card className="rounded-[20px] border-0 shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                  <Building2 className="h-6 w-6 text-[#39B54A]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1 font-inter">Total Organizations</p>
                  <p className="text-[32px] font-semibold text-foreground font-poppins">
                    {stats.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Government Agencies */}
          <Card className="rounded-[20px] border-0 shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(33,150,243,0.1)]">
                  <Landmark className="h-6 w-6 text-[#2196F3]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1 font-inter">Government Agencies</p>
                  <p className="text-[32px] font-semibold text-foreground font-poppins">
                    {stats.government.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commodity Aggregators */}
          <Card className="rounded-[20px] border-0 shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(156,39,176,0.1)]">
                  <Users className="h-6 w-6 text-[#9C27B0]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1 font-inter">Commodity Aggregators</p>
                  <p className="text-[32px] font-semibold text-foreground font-poppins">
                    {stats.aggregator.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cooperatives */}
          <Card className="rounded-[20px] border-0 shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,152,0,0.1)]">
                  <UsersRound className="h-6 w-6 text-[#FF9800]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1 font-inter">Cooperatives</p>
                  <p className="text-[32px] font-semibold text-foreground font-poppins">
                    {stats.cooperative.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] h-11 px-6 font-inter">
            <Link href="/dashboard/organizations/new">
              <Plus className="h-5 w-5 mr-2" />
              Add new organization
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground font-poppins">All Organizations</h2>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-[10px] border-border bg-card text-sm h-10 px-4 font-inter">
              Filter by State
            </Button>
            <Button variant="outline" className="rounded-[10px] border-border bg-card text-sm h-10 px-4 font-inter">
              Sort by
            </Button>
            <Button className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] text-sm h-10 px-6 font-inter">
              View All
            </Button>
          </div>
        </div>

        {!organizationsWithCounts || organizationsWithCounts.length === 0 ? (
          <Card className="rounded-[25px] border-0 shadow-sm">
            <CardContent className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                <Building2 className="h-8 w-8 text-[#39B54A]" />
              </div>
              <h3 className="font-semibold text-xl mb-2 font-poppins">No organizations yet</h3>
              <p className="text-muted-foreground mb-6 font-inter">Get started by adding your first organization</p>
              <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                <Link href="/dashboard/organizations/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Organization
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {organizationsWithCounts.map((org: any) => (
              <Card
                key={org.id}
                className="rounded-[20px] border-0 shadow-sm hover:shadow-md transition-shadow bg-card"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="relative mb-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] text-[#39B54A] text-2xl font-semibold font-poppins">
                        {org.org_name[0]}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          org.is_active ? "bg-[#39B54A] text-white" : "bg-[rgba(0,0,0,0.12)] text-muted-foreground"
                        }`}
                      >
                        {org.is_active ? "✓" : "○"}
                      </div>
                    </div>
                    <h3 className="font-semibold text-base text-foreground mb-1 line-clamp-1 font-poppins">
                      {org.org_name}
                    </h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium font-inter ${
                        org.is_active
                          ? "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
                          : "bg-[rgba(0,0,0,0.08)] text-muted-foreground"
                      }`}
                    >
                      {org.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-sm font-inter">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Organization Type:</span>
                      <span className="font-medium text-foreground">{getOrgTypeLabel(org.org_type)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium text-foreground line-clamp-1">{org.state || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium text-foreground line-clamp-1">{org.contact_phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Users:</span>
                      <span className="font-medium text-foreground">{org.userCount || 0}</span>
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-[10px] border-[#39B54A] text-[#39B54A] hover:bg-[rgba(57,181,74,0.1)] hover:text-[#39B54A] bg-transparent font-inter"
                  >
                    <Link href={`/dashboard/organizations/${org.id}`}>View Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
