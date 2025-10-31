import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCog, Building2, MapPin, TrendingUp, Sprout, AlertCircle } from "lucide-react"
import { getUserContext, applyDataIsolation } from "@/lib/auth/data-isolation"
import CropYieldDashboardChart from "@/components/crop-yield-dashboard-chart"
import OrganizationFilter from "@/components/organization-filter"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Dashboard | Farmwise",
  description: "Overview of your agricultural platform",
}

export default async function DashboardPage({ searchParams }: { searchParams: { org?: string } }) {
  let supabase
  try {
    supabase = await createServerClient()
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Configuration Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Database Connection Failed</AlertTitle>
              <AlertDescription>
                Unable to connect to the database. This may be due to missing environment variables or network issues.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Please ensure your Supabase configuration is correct and try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  let user
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("[v0] Auth error:", error.message)

      // Check if it's a network error
      if (error.message.includes("fetch") || error.message.includes("network")) {
        return (
          <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Connection Error
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication Service Unavailable</AlertTitle>
                  <AlertDescription>
                    Unable to verify your authentication. This may be a temporary network issue.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  Please try refreshing the page. If the problem persists, contact support.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      }

      redirect("/auth/login")
    }

    if (!data?.user) {
      console.log("[v0] No user found, redirecting to login")
      redirect("/auth/login")
    }

    user = data.user
  } catch (error: any) {
    console.error("[v0] Failed to get user:", error)

    // Check if it's a network/fetch error
    if (error?.message?.includes("fetch") || error?.message?.includes("Failed to fetch")) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Connection Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Network Error</AlertTitle>
                <AlertDescription>
                  Unable to connect to the authentication service. This may be due to network connectivity issues.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Possible causes:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Network connectivity issues</li>
                  <li>Supabase service temporarily unavailable</li>
                  <li>CORS or firewall restrictions</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Please try refreshing the page or check your network connection.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    redirect("/auth/login")
  }

  const userContext = await getUserContext(supabase)
  if (!userContext) {
    redirect("/auth/login")
  }

  if (userContext.role === "field_agent") {
    redirect("/dashboard/field-agent")
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("first_name, last_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  let organizations: any[] = []
  if (userContext.role === "super_admin") {
    const { data: orgs } = await supabase.from("organizations").select("id, org_name").order("org_name")
    organizations = orgs || []
  }

  const filterOrgId = userContext.role === "super_admin" && searchParams.org ? searchParams.org : null

  let usersQuery = supabase.from("users").select("id, role").in("role", ["super_admin", "admin"])
  if (filterOrgId) {
    usersQuery = usersQuery.eq("organization_id", filterOrgId)
  } else {
    usersQuery = applyDataIsolation(usersQuery, userContext)
  }
  const { data: adminUsers } = await usersQuery

  let agentsQuery = supabase.from("users").select("id, role").eq("role", "field_agent")
  if (filterOrgId) {
    agentsQuery = agentsQuery.eq("organization_id", filterOrgId)
  } else {
    agentsQuery = applyDataIsolation(agentsQuery, userContext)
  }
  const { data: extensionAgents } = await agentsQuery

  let farmersQuery = supabase.from("farmers").select("id, gender")
  if (filterOrgId) {
    farmersQuery = farmersQuery.eq("organization_id", filterOrgId)
  } else {
    farmersQuery = applyDataIsolation(farmersQuery, userContext)
  }
  const { data: allFarmers } = await farmersQuery

  console.log("[v0] Total farmers:", allFarmers?.length)
  console.log(
    "[v0] Farmer gender values:",
    allFarmers?.map((f) => ({ id: f.id, gender: f.gender })),
  )

  const maleFarmers = allFarmers?.filter((f) => f.gender && f.gender.toLowerCase() === "male").length || 0
  const femaleFarmers = allFarmers?.filter((f) => f.gender && f.gender.toLowerCase() === "female").length || 0

  console.log("[v0] Male count:", maleFarmers)
  console.log("[v0] Female count:", femaleFarmers)

  let orgsQuery = supabase.from("organizations").select("id, org_type")
  if (filterOrgId) {
    orgsQuery = orgsQuery.eq("id", filterOrgId)
  } else if (userContext.role !== "super_admin" && userContext.organizationId) {
    orgsQuery = orgsQuery.eq("id", userContext.organizationId)
  }
  const { data: displayOrganizations } = await orgsQuery

  let plotsQuery = supabase.from("farm_plots").select("*", { count: "exact", head: true })
  if (filterOrgId) {
    const { data: orgFarmers } = await supabase.from("farmers").select("id").eq("organization_id", filterOrgId)
    const farmerIds = orgFarmers?.map((f) => f.id) || []
    if (farmerIds.length > 0) {
      plotsQuery = plotsQuery.in("farmer_id", farmerIds)
    }
  } else if (userContext.role !== "super_admin" && userContext.organizationId) {
    const { data: orgFarmers } = await supabase
      .from("farmers")
      .select("id")
      .eq("organization_id", userContext.organizationId)
    const farmerIds = orgFarmers?.map((f) => f.id) || []
    if (farmerIds.length > 0) {
      plotsQuery = plotsQuery.in("farmer_id", farmerIds)
    }
  }
  const { count: plotsCount } = await plotsQuery

  let activitiesQuery = supabase.from("farm_activities").select("*", { count: "exact", head: true })
  if (filterOrgId) {
    const { data: orgFarmers } = await supabase.from("farmers").select("id").eq("organization_id", filterOrgId)
    const farmerIds = orgFarmers?.map((f) => f.id) || []
    if (farmerIds.length > 0) {
      activitiesQuery = activitiesQuery.in("farmer_id", farmerIds)
    }
  } else if (userContext.role !== "super_admin" && userContext.organizationId) {
    const { data: orgFarmers } = await supabase
      .from("farmers")
      .select("id")
      .eq("organization_id", userContext.organizationId)
    const farmerIds = orgFarmers?.map((f) => f.id) || []
    if (farmerIds.length > 0) {
      activitiesQuery = activitiesQuery.in("farmer_id", farmerIds)
    }
  }
  const { count: activitiesCount } = await activitiesQuery

  let batchesQuery = supabase
    .from("harvest_batches")
    .select("id, crop_type, quantity_kg, harvest_date, organization_id")
    .order("harvest_date", { ascending: false })

  if (filterOrgId) {
    batchesQuery = batchesQuery.eq("organization_id", filterOrgId)
  } else if (userContext.role !== "super_admin" && userContext.organizationId) {
    batchesQuery = batchesQuery.eq("organization_id", userContext.organizationId)
  }

  const { data: harvestBatches } = await batchesQuery

  const totalYield = harvestBatches?.reduce((sum, batch) => sum + (batch.quantity_kg || 0), 0) || 0

  return (
    <div className="space-y-6">
      {userContext.role === "super_admin" && organizations.length > 0 && (
        <div className="flex justify-end">
          <OrganizationFilter organizations={organizations} currentPath="/dashboard" />
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Total Admin</CardTitle>
            <div className="h-10 w-10 rounded-full bg-[rgba(255,182,193,0.3)] flex items-center justify-center">
              <Users className="h-5 w-5 text-[#FF6B9D]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-[32px] font-bold font-poppins text-[rgba(0,0,0,0.87)]">{adminUsers?.length || 0}</div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">System administrators</p>
          </CardContent>
        </Card>

        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">
              Total Extension Agents
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-[rgba(138,43,226,0.2)] flex items-center justify-center">
              <UserCog className="h-5 w-5 text-[#8A2BE2]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-[32px] font-bold font-poppins text-[rgba(0,0,0,0.87)]">
              {extensionAgents?.length || 0}
            </div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">Extension agents</p>
          </CardContent>
        </Card>

        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Total Farmers</CardTitle>
            <div className="h-10 w-10 rounded-full bg-[rgba(57,181,74,0.2)] flex items-center justify-center">
              <Users className="h-5 w-5 text-[#39B54A]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-[32px] font-bold font-poppins text-[rgba(0,0,0,0.87)]">{allFarmers?.length || 0}</div>
            <div className="flex items-center gap-4 mt-2 text-xs font-inter text-[rgba(0,0,0,0.65)]">
              <span>● Male: {maleFarmers}</span>
              <span>● Female: {femaleFarmers}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Organizations</CardTitle>
            <div className="h-10 w-10 rounded-full bg-[rgba(100,149,237,0.2)] flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#6495ED]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-[32px] font-bold font-poppins text-[rgba(0,0,0,0.87)]">
              {displayOrganizations?.length || 0}
            </div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">
              {userContext.role === "super_admin"
                ? filterOrgId
                  ? "Filtered organization"
                  : "Registered organizations"
                : "Your organization"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Total Farm Plots</CardTitle>
            <MapPin className="h-5 w-5 text-[#39B54A]" />
          </CardHeader>
          <CardContent>
            <div className="text-[32px] font-bold font-poppins text-[rgba(0,0,0,0.87)]">{plotsCount || 0}</div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">Mapped farm plots</p>
          </CardContent>
        </Card>

        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Farm Activities</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#39B54A]" />
          </CardHeader>
          <CardContent>
            <div className="text-[32px] font-bold font-poppins text-[rgba(0,0,0,0.87)]">{activitiesCount || 0}</div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">Logged activities</p>
          </CardContent>
        </Card>

        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Total Yield</CardTitle>
            <Sprout className="h-5 w-5 text-[#39B54A]" />
          </CardHeader>
          <CardContent>
            <div className="text-[32px] font-bold font-poppins text-[rgba(0,0,0,0.87)]">
              {(totalYield / 1000).toFixed(1)}
            </div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">tons harvested</p>
          </CardContent>
        </Card>
      </div>

      <CropYieldDashboardChart batches={harvestBatches || []} userContext={userContext} />
    </div>
  )
}
