import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Sprout,
  BarChart3,
  AlertTriangle,
  Target,
  CloudRain,
} from "lucide-react"
import YieldTrendsChart from "@/components/yield-trends-chart"
import CropYieldComparison from "@/components/crop-yield-comparison"
import SeasonalPatternsChart from "@/components/seasonal-patterns-chart"
import RegionalYieldMap from "@/components/regional-yield-map"
import YieldGapAnalysis from "@/components/yield-gap-analysis"
import PredictiveYieldModel from "@/components/predictive-yield-model"

export const metadata = {
  title: "Yield Forecasting | Farmwise",
  description: "Advanced yield forecasting and analytics",
}

export default async function YieldForecastingPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch harvest batches for yield analysis
  const { data: batches } = await supabase
    .from("harvest_batches")
    .select(
      `
      *,
      farmers(first_name, last_name, state, lga),
      farm_plots(plot_name, area_hectares, soil_type, irrigation_type)
    `,
    )
    .order("harvest_date", { ascending: false })

  // Fetch farm plots with detailed information
  const { data: plots } = await supabase.from("farm_plots").select("*")

  // Calculate comprehensive statistics
  const totalPlots = plots?.length || 0
  const activePlots = plots?.filter((p) => p.status === "active").length || 0
  const totalYield = batches?.reduce((sum, batch) => sum + (batch.quantity_kg || 0), 0) || 0

  // Calculate average yield per hectare
  const batchesWithArea = batches?.filter((b) => b.farm_plots?.area_hectares) || []
  const avgYieldPerHectare =
    batchesWithArea.length > 0
      ? batchesWithArea.reduce((sum, b) => sum + b.quantity_kg / b.farm_plots.area_hectares, 0) / batchesWithArea.length
      : 0

  // Group by crop type for detailed analysis
  const cropYields: Record<string, { total: number; count: number; batches: any[] }> = {}
  batches?.forEach((batch) => {
    const crop = batch.crop_type || "Unknown"
    if (!cropYields[crop]) {
      cropYields[crop] = { total: 0, count: 0, batches: [] }
    }
    cropYields[crop].total += batch.quantity_kg || 0
    cropYields[crop].count += 1
    cropYields[crop].batches.push(batch)
  })

  // Calculate trends (compare last 3 months vs previous 3 months)
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

  const recentBatches = batches?.filter((b) => new Date(b.harvest_date) >= threeMonthsAgo) || []
  const previousBatches =
    batches?.filter((b) => {
      const date = new Date(b.harvest_date)
      return date >= sixMonthsAgo && date < threeMonthsAgo
    }) || []

  const recentYield = recentBatches.reduce((sum, b) => sum + (b.quantity_kg || 0), 0)
  const previousYield = previousBatches.reduce((sum, b) => sum + (b.quantity_kg || 0), 0)
  const yieldTrend = previousYield > 0 ? ((recentYield - previousYield) / previousYield) * 100 : 0

  const yieldValues = batches?.map((b) => b.quantity_kg || 0) || []
  const avgYield = yieldValues.length > 0 ? yieldValues.reduce((a, b) => a + b, 0) / yieldValues.length : 0
  const variance =
    yieldValues.length > 0
      ? yieldValues.reduce((sum, val) => sum + Math.pow(val - avgYield, 2), 0) / yieldValues.length
      : 0
  const stdDeviation = Math.sqrt(variance)
  const coefficientOfVariation = avgYield > 0 ? (stdDeviation / avgYield) * 100 : 0

  const regionalYields: Record<string, { total: number; count: number; avgPerHa: number }> = {}
  batchesWithArea.forEach((batch) => {
    const region = batch.farmers?.state || "Unknown"
    if (!regionalYields[region]) {
      regionalYields[region] = { total: 0, count: 0, avgPerHa: 0 }
    }
    regionalYields[region].total += batch.quantity_kg
    regionalYields[region].count += 1
    regionalYields[region].avgPerHa += batch.quantity_kg / batch.farm_plots.area_hectares
  })

  Object.keys(regionalYields).forEach((region) => {
    regionalYields[region].avgPerHa /= regionalYields[region].count
  })

  const soilYields: Record<string, { total: number; count: number; avgPerHa: number }> = {}
  batchesWithArea.forEach((batch) => {
    const soil = batch.farm_plots?.soil_type || "Unknown"
    if (!soilYields[soil]) {
      soilYields[soil] = { total: 0, count: 0, avgPerHa: 0 }
    }
    soilYields[soil].total += batch.quantity_kg
    soilYields[soil].count += 1
    soilYields[soil].avgPerHa += batch.quantity_kg / batch.farm_plots.area_hectares
  })

  Object.keys(soilYields).forEach((soil) => {
    soilYields[soil].avgPerHa /= soilYields[soil].count
  })

  const irrigatedBatches = batchesWithArea.filter(
    (b) =>
      b.farm_plots?.irrigation_type &&
      b.farm_plots.irrigation_type !== "rain-fed" &&
      b.farm_plots.irrigation_type !== "none",
  )
  const nonIrrigatedBatches = batchesWithArea.filter(
    (b) =>
      !b.farm_plots?.irrigation_type ||
      b.farm_plots.irrigation_type === "rain-fed" ||
      b.farm_plots.irrigation_type === "none",
  )

  const avgIrrigatedYield =
    irrigatedBatches.length > 0
      ? irrigatedBatches.reduce((sum, b) => sum + b.quantity_kg / b.farm_plots.area_hectares, 0) /
        irrigatedBatches.length
      : 0

  const avgNonIrrigatedYield =
    nonIrrigatedBatches.length > 0
      ? nonIrrigatedBatches.reduce((sum, b) => sum + b.quantity_kg / b.farm_plots.area_hectares, 0) /
        nonIrrigatedBatches.length
      : 0

  const irrigationImpact =
    avgNonIrrigatedYield > 0 ? ((avgIrrigatedYield - avgNonIrrigatedYield) / avgNonIrrigatedYield) * 100 : 0

  // Top performing crops
  const topCrops = Object.entries(cropYields)
    .map(([crop, data]) => ({
      crop,
      avgYield: data.total / data.count,
      totalYield: data.total,
      count: data.count,
    }))
    .sort((a, b) => b.avgYield - a.avgYield)
    .slice(0, 5)

  const lastYearBatches = batches?.filter((b) => {
    const date = new Date(b.harvest_date)
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    return date >= oneYearAgo
  })

  const predictedYield = lastYearBatches ? lastYearBatches.reduce((sum, b) => sum + (b.quantity_kg || 0), 0) * 1.05 : 0 // 5% growth assumption

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Advanced Yield Forecasting & Analytics</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            Comprehensive yield analysis, predictive modeling, and performance insights for data-driven decision making
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4 mb-6 md:mb-8">
          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter">Total Plots</p>
                  <p className="text-2xl md:text-3xl font-poppins font-semibold text-[#000000] mt-1 md:mt-2">
                    {totalPlots}
                  </p>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">{activePlots} active</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter">Total Yield</p>
                  <p className="text-2xl md:text-3xl font-poppins font-semibold text-[#000000] mt-1 md:mt-2">
                    {(totalYield / 1000).toFixed(1)}
                  </p>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">tons harvested</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <Sprout className="h-5 w-5 md:h-6 md:w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter">Avg Yield/Ha</p>
                  <p className="text-2xl md:text-3xl font-poppins font-semibold text-[#000000] mt-1 md:mt-2">
                    {avgYieldPerHectare.toFixed(0)}
                  </p>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">kg per hectare</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter">Yield Trend</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-2xl md:text-3xl font-poppins font-semibold text-[#000000]">
                      {Math.abs(yieldTrend).toFixed(1)}%
                    </p>
                    {yieldTrend >= 0 ? (
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-[#39B54A]" />
                    ) : (
                      <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">vs previous quarter</p>
                </div>
                <div
                  className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center ${
                    yieldTrend >= 0 ? "bg-[rgba(57,181,74,0.1)]" : "bg-red-100"
                  }`}
                >
                  <Calendar
                    className={`h-5 w-5 md:h-6 md:w-6 ${yieldTrend >= 0 ? "text-[#39B54A]" : "text-red-500"}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 mb-6 md:mb-8">
          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter">Yield Variability (CV)</p>
                <AlertTriangle
                  className={`h-4 w-4 md:h-5 md:w-5 ${coefficientOfVariation > 30 ? "text-red-500" : coefficientOfVariation > 20 ? "text-yellow-500" : "text-[#39B54A]"}`}
                />
              </div>
              <p className="text-2xl md:text-3xl font-poppins font-semibold text-[#000000]">
                {coefficientOfVariation.toFixed(1)}%
              </p>
              <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-2">
                {coefficientOfVariation > 30
                  ? "High risk - inconsistent yields"
                  : coefficientOfVariation > 20
                    ? "Moderate variability"
                    : "Low risk - stable yields"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter">Irrigation Impact</p>
                <CloudRain className="h-4 w-4 md:h-5 md:w-5 text-[#39B54A]" />
              </div>
              <p className="text-2xl md:text-3xl font-poppins font-semibold text-[#39B54A]">
                +{irrigationImpact.toFixed(0)}%
              </p>
              <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-2">Irrigated vs non-irrigated plots</p>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter">Predicted Next Season</p>
                <Target className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <p className="text-2xl md:text-3xl font-poppins font-semibold text-blue-600">
                {(predictedYield / 1000).toFixed(1)}
              </p>
              <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-2">tons (5% growth projection)</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="bg-white rounded-[15px] p-1 shadow-sm inline-flex w-max md:w-auto">
              <TabsTrigger
                value="overview"
                className="rounded-[10px] font-inter text-xs md:text-sm data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A] whitespace-nowrap"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="trends"
                className="rounded-[10px] font-inter text-xs md:text-sm data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A] whitespace-nowrap"
              >
                Trends
              </TabsTrigger>
              <TabsTrigger
                value="crops"
                className="rounded-[10px] font-inter text-xs md:text-sm data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A] whitespace-nowrap"
              >
                By Crop
              </TabsTrigger>
              <TabsTrigger
                value="regional"
                className="rounded-[10px] font-inter text-xs md:text-sm data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A] whitespace-nowrap"
              >
                Regional
              </TabsTrigger>
              <TabsTrigger
                value="factors"
                className="rounded-[10px] font-inter text-xs md:text-sm data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A] whitespace-nowrap"
              >
                Yield Factors
              </TabsTrigger>
              <TabsTrigger
                value="predictions"
                className="rounded-[10px] font-inter text-xs md:text-sm data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A] whitespace-nowrap"
              >
                Predictions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Top Performing Crops */}
            <Card className="rounded-[25px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Top Performing Crops</CardTitle>
                <CardDescription className="font-inter">Based on average yield per harvest</CardDescription>
              </CardHeader>
              <CardContent>
                {topCrops.length === 0 ? (
                  <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">No harvest data available yet</p>
                ) : (
                  <div className="space-y-4">
                    {topCrops.map((crop, index) => (
                      <div
                        key={crop.crop}
                        className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-[15px]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white font-poppins font-semibold text-[#39B54A]">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-poppins font-semibold text-[#000000]">{crop.crop}</p>
                            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{crop.count} harvests recorded</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-poppins font-semibold text-[#39B54A]">{crop.avgYield.toFixed(0)} kg</p>
                          <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter">avg per harvest</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Harvests */}
            <Card className="rounded-[25px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Recent Harvests</CardTitle>
                <CardDescription className="font-inter">Latest harvest batches</CardDescription>
              </CardHeader>
              <CardContent>
                {!batches || batches.length === 0 ? (
                  <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">No harvest data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {batches.slice(0, 10).map((batch) => (
                      <div key={batch.id} className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-[15px]">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-poppins font-semibold text-[#000000]">{batch.crop_type}</p>
                            {batch.is_organic && (
                              <Badge className="rounded-full text-xs bg-green-100 text-green-700">Organic</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                            {batch.farmers?.first_name} {batch.farmers?.last_name} •{" "}
                            {new Date(batch.harvest_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-poppins font-semibold text-[#000000]">{batch.quantity_kg} kg</p>
                          {batch.farm_plots?.area_hectares && (
                            <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter">
                              {(batch.quantity_kg / batch.farm_plots.area_hectares).toFixed(0)} kg/ha
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <YieldTrendsChart batches={batches || []} />
            <SeasonalPatternsChart batches={batches || []} />
          </TabsContent>

          <TabsContent value="crops" className="space-y-6">
            <CropYieldComparison cropYields={cropYields} />
          </TabsContent>

          <TabsContent value="regional" className="space-y-6">
            <RegionalYieldMap regionalYields={regionalYields} batches={batches || []} />
          </TabsContent>

          <TabsContent value="factors" className="space-y-6">
            <YieldGapAnalysis
              soilYields={soilYields}
              irrigationImpact={irrigationImpact}
              avgIrrigatedYield={avgIrrigatedYield}
              avgNonIrrigatedYield={avgNonIrrigatedYield}
              batches={batches || []}
            />
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <PredictiveYieldModel
              batches={batches || []}
              cropYields={cropYields}
              predictedYield={predictedYield}
              historicalTrend={yieldTrend}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
