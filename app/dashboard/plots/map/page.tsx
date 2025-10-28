import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlotMapViewer } from "@/components/plot-map-viewer"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MapPin, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Plot Map View | Farmwise",
  description: "Visualize all farm plots on a map",
}

export default async function PlotMapPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user's organization
  const { data: userData } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  // Fetch all plots with location data
  const { data: plots } = await supabase
    .from("farm_plots")
    .select(
      `
      *,
      farmer:farmers(first_name, last_name, farmer_id)
    `,
    )
    .eq("farmers.organization_id", userData?.organization_id)
    .not("center_point", "is", null)
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button asChild variant="ghost" size="sm" className="rounded-[8px]">
                <Link href="/dashboard/plots">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Plots
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Plot Map View</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              Visualize all farm plots with GPS coordinates
            </p>
          </div>
        </div>

        {!plots || plots.length === 0 ? (
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                <MapPin className="h-8 w-8 text-[#39B54A]" />
              </div>
              <h3 className="font-poppins text-xl font-semibold mb-2">No plots with GPS data</h3>
              <p className="text-[rgba(0,0,0,0.65)] font-inter mb-6">
                Register plots with GPS coordinates to see them on the map
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-base">Total Plots</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-poppins font-bold text-[#39B54A]">{plots.length}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[25px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-base">Total Area</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-poppins font-bold text-[#39B54A]">
                    {plots.reduce((sum, p) => sum + (p.size_hectares || 0), 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">hectares</p>
                </CardContent>
              </Card>

              <Card className="rounded-[25px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-base">With Boundaries</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-poppins font-bold text-[#39B54A]">
                    {plots.filter((p) => p.boundaries && JSON.parse(p.boundaries as string).length > 0).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Individual Plot Maps */}
            <div className="space-y-6">
              {plots.map((plot: any) => {
                // Parse center point from PostGIS format
                let centerPoint = null
                if (plot.center_point) {
                  const match = plot.center_point.match(/POINT$$([^ ]+) ([^ ]+)$$/)
                  if (match) {
                    centerPoint = { lng: Number.parseFloat(match[1]), lat: Number.parseFloat(match[2]) }
                  }
                }

                // Parse boundaries
                let boundaries = []
                if (plot.boundaries) {
                  try {
                    boundaries = JSON.parse(plot.boundaries)
                  } catch (e) {
                    console.error("[v0] Error parsing boundaries:", e)
                  }
                }

                return (
                  <Card key={plot.id} className="rounded-[25px] border-none shadow-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-poppins text-lg">{plot.plot_name}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="rounded-full font-inter text-xs bg-[rgba(57,181,74,0.1)] text-[#39B54A] border-[#39B54A]"
                            >
                              {plot.plot_code}
                            </Badge>
                            {plot.farmer && (
                              <span className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                                {plot.farmer.first_name} {plot.farmer.last_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Size</p>
                          <p className="text-lg font-poppins font-semibold text-[#39B54A]">{plot.size_hectares} ha</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <PlotMapViewer centerPoint={centerPoint} boundaries={boundaries} plotName={plot.plot_name} />
                      {centerPoint && (
                        <div className="mt-4 p-3 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                          <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter">
                            <strong>Coordinates:</strong> {centerPoint.lat.toFixed(6)}, {centerPoint.lng.toFixed(6)}
                          </p>
                          {boundaries.length > 0 && (
                            <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter mt-1">
                              <strong>Boundary Points:</strong> {boundaries.length}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
