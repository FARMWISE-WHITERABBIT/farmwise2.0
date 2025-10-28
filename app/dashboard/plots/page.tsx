import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, MapPin, Sprout, Map } from "lucide-react"
import Link from "next/link"
import { getUserContext, canEdit } from "@/lib/auth/data-isolation"

export const metadata = {
  title: "Farm Plots | Farmwise",
  description: "GPS-mapped farm plots and field management",
}

export default async function FarmPlotsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const userContext = await getUserContext(supabase)
  if (!userContext) {
    redirect("/auth/login")
  }

  let plotsQuery = supabase
    .from("farm_plots")
    .select(
      `
      *,
      farmers(first_name, last_name, farmer_id, organization_id)
    `,
    )
    .order("created_at", { ascending: false })

  // Apply data isolation through farmers
  if (userContext.role !== "super_admin" && userContext.organizationId) {
    const { data: orgFarmers } = await supabase
      .from("farmers")
      .select("id")
      .eq("organization_id", userContext.organizationId)
    const farmerIds = orgFarmers?.map((f) => f.id) || []
    if (farmerIds.length > 0) {
      plotsQuery = plotsQuery.in("farmer_id", farmerIds)
    } else {
      plotsQuery = plotsQuery.eq("farmer_id", "00000000-0000-0000-0000-000000000000") // No results
    }
  }

  const { data: plots } = await plotsQuery

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
      case "attention":
        return "bg-yellow-100 text-yellow-700"
      case "critical":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const totalArea = plots?.reduce((sum, plot) => sum + (plot.size_hectares || 0), 0) || 0
  const activePlots = plots?.filter((p) => p.status === "active").length || 0
  const healthyPlots = plots?.filter((p) => p.crop_health_status === "healthy").length || 0

  const userCanEdit = canEdit(userContext.role)

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Farm Plots</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              GPS-mapped farm plots and field management
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-white">
              <Link href="/dashboard/plots/map">
                <Map className="h-4 w-4 mr-2" />
                Map View
              </Link>
            </Button>
            {userCanEdit && (
              <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                <Link href="/dashboard/plots/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Plot
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Total Plots</p>
                  <p className="text-3xl font-poppins font-semibold text-[#000000] mt-2">{plots?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Total Area</p>
                  <p className="text-3xl font-poppins font-semibold text-[#000000] mt-2">{totalArea.toFixed(1)}</p>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">hectares</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <Sprout className="h-6 w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Active Plots</p>
                  <p className="text-3xl font-poppins font-semibold text-[#39B54A] mt-2">{activePlots}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Healthy Plots</p>
                  <p className="text-3xl font-poppins font-semibold text-[#000000] mt-2">{healthyPlots}</p>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">
                    {plots && plots.length > 0 ? Math.round((healthyPlots / plots.length) * 100) : 0}% of total
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <Sprout className="h-6 w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 rounded-[25px] border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.45)]" />
                <Input
                  placeholder="Search by plot name, code, or farmer..."
                  className="pl-10 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                />
              </div>
              <Button variant="outline" className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-transparent">
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plots List */}
        {!plots || plots.length === 0 ? (
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                <MapPin className="h-8 w-8 text-[#39B54A]" />
              </div>
              <h3 className="font-poppins text-xl font-semibold mb-2">No farm plots yet</h3>
              <p className="text-[rgba(0,0,0,0.65)] font-inter mb-6">Start mapping farm plots with GPS coordinates</p>
              {userCanEdit && (
                <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                  <Link href="/dashboard/plots/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Plot
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {plots.map((plot: any) => (
              <Card key={plot.id} className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-poppins font-semibold text-lg text-[#000000]">{plot.plot_name}</h3>
                        <Badge className={`rounded-full font-inter text-xs ${getHealthColor(plot.crop_health_status)}`}>
                          {plot.crop_health_status}
                        </Badge>
                        {plot.status === "active" && (
                          <Badge className="rounded-full font-inter text-xs bg-blue-100 text-blue-700">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">
                        {plot.plot_code} • {plot.farmers?.first_name} {plot.farmers?.last_name}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter">
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Size</p>
                          <p className="font-semibold text-[#000000]">{plot.size_hectares} ha</p>
                        </div>
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Current Crop</p>
                          <p className="font-medium text-[#000000]">{plot.current_crop || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Soil Type</p>
                          <p className="font-medium text-[#000000]">{plot.soil_type || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Irrigation</p>
                          <p className="font-medium text-[#000000]">{plot.irrigation_type || "—"}</p>
                        </div>
                      </div>
                      {plot.planting_date && (
                        <div className="mt-3 text-sm font-inter">
                          <span className="text-[rgba(0,0,0,0.45)]">Planted:</span>{" "}
                          <span className="text-[#000000]">{new Date(plot.planting_date).toLocaleDateString()}</span>
                          {plot.expected_harvest_date && (
                            <>
                              {" • "}
                              <span className="text-[rgba(0,0,0,0.45)]">Expected Harvest:</span>{" "}
                              <span className="text-[#000000]">
                                {new Date(plot.expected_harvest_date).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                    >
                      <Link href={`/dashboard/plots/${plot.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
