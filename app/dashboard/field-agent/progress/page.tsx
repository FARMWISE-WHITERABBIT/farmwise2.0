import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, MapPin, Camera, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Progress Tracking | Farmwise",
  description: "Track your extension agent performance and farmer progress",
}

export default async function ProgressTrackingPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get farmers assigned to this agent
  const { data: farmers } = await supabase
    .from("farmers")
    .select(
      `
      *,
      farm_plots(count),
      field_visits:field_visits!field_visits_farmer_id_fkey(count)
    `,
    )
    .eq("assigned_agent_id", user.id)
    .order("created_at", { ascending: false })

  // Get field visits
  const { data: visits } = await supabase
    .from("field_visits")
    .select("*")
    .eq("agent_id", user.id)
    .order("visit_date", { ascending: false })

  // Calculate stats
  const totalFarmers = farmers?.length || 0
  const farmersWithPlots = farmers?.filter((f: any) => f.farm_plots?.[0]?.count > 0).length || 0
  const totalVisits = visits?.length || 0
  const thisMonthVisits =
    visits?.filter((v: any) => {
      const visitDate = new Date(v.visit_date)
      const now = new Date()
      return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear()
    }).length || 0

  const plotCompletionRate = totalFarmers > 0 ? Math.round((farmersWithPlots / totalFarmers) * 100) : 0

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-poppins font-semibold text-[#000000]">Progress Tracking</h1>
          <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            Monitor your performance and farmer progress
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] flex-shrink-0">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-[#39B54A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter truncate">Total Farmers</p>
                  <p className="text-xl md:text-2xl font-poppins font-bold text-[#000000]">{totalFarmers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] flex-shrink-0">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 text-[#39B54A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter truncate">Plots Mapped</p>
                  <p className="text-xl md:text-2xl font-poppins font-bold text-[#000000]">{farmersWithPlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] flex-shrink-0">
                  <Camera className="h-5 w-5 md:h-6 md:w-6 text-[#39B54A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter truncate">Field Visits</p>
                  <p className="text-xl md:text-2xl font-poppins font-bold text-[#000000]">{totalVisits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] flex-shrink-0">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-[#39B54A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter truncate">This Month</p>
                  <p className="text-xl md:text-2xl font-poppins font-bold text-[#000000]">{thisMonthVisits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Progress */}
        <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="font-poppins text-lg">Plot Mapping Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-inter text-[rgba(0,0,0,0.65)]">
                  {farmersWithPlots} of {totalFarmers} farmers have mapped plots
                </span>
                <span className="text-sm font-poppins font-semibold text-[#39B54A]">{plotCompletionRate}%</span>
              </div>
              <Progress value={plotCompletionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Farmer Progress List */}
        <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="font-poppins text-base md:text-lg">Farmer Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {!farmers || farmers.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <p className="text-[rgba(0,0,0,0.65)] font-inter text-sm">No farmers assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {farmers.map((farmer: any) => {
                  const plotCount = farmer.farm_plots?.[0]?.count || 0
                  const visitCount = farmer.field_visits?.[0]?.count || 0
                  const hasPlots = plotCount > 0
                  const hasVisits = visitCount > 0

                  return (
                    <div
                      key={farmer.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 rounded-[15px] bg-[rgba(0,0,0,0.02)] hover:bg-[rgba(0,0,0,0.04)] transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] text-[#39B54A] font-semibold flex-shrink-0 text-sm md:text-base">
                          {farmer.first_name[0]}
                          {farmer.last_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/dashboard/farmers/${farmer.id}`}
                            className="font-poppins font-medium text-sm md:text-base text-[#000000] hover:text-[#39B54A] transition-colors block truncate"
                          >
                            {farmer.first_name} {farmer.last_name}
                          </Link>
                          <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter truncate">{farmer.farmer_id}</p>
                          <div className="flex items-center gap-2 md:gap-3 mt-1.5 md:mt-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[rgba(0,0,0,0.45)] flex-shrink-0" />
                              <span className="text-xs text-[rgba(0,0,0,0.65)] font-inter">
                                {plotCount} {plotCount === 1 ? "plot" : "plots"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Camera className="h-3 w-3 text-[rgba(0,0,0,0.45)] flex-shrink-0" />
                              <span className="text-xs text-[rgba(0,0,0,0.65)] font-inter">
                                {visitCount} {visitCount === 1 ? "visit" : "visits"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {hasPlots && (
                          <Badge
                            variant="outline"
                            className="rounded-full font-inter text-xs bg-[rgba(57,181,74,0.1)] text-[#39B54A] border-[#39B54A]"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mapped
                          </Badge>
                        )}
                        {hasVisits && (
                          <Badge
                            variant="outline"
                            className="rounded-full font-inter text-xs bg-[rgba(57,181,74,0.1)] text-[#39B54A] border-[#39B54A]"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Visited
                          </Badge>
                        )}
                        {!hasPlots && !hasVisits && (
                          <Badge
                            variant="outline"
                            className="rounded-full font-inter text-xs bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.45)] border-[rgba(0,0,0,0.12)]"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
