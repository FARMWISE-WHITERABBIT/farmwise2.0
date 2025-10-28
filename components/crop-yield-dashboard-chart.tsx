"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

interface HarvestBatch {
  id: string
  crop_type: string
  quantity_kg: number
  harvest_date: string
  organization_id: string
}

interface UserContext {
  role: string
  organizationId?: string
}

interface CropYieldDashboardChartProps {
  batches: HarvestBatch[]
  userContext: UserContext
}

export default function CropYieldDashboardChart({ batches, userContext }: CropYieldDashboardChartProps) {
  // Get unique crop types
  const cropTypes = useMemo(() => {
    const types = new Set(batches.map((b) => b.crop_type).filter(Boolean))
    return ["All Crops", ...Array.from(types)]
  }, [batches])

  const [selectedCrop, setSelectedCrop] = useState<string>("All Crops")

  // Filter batches by selected crop
  const filteredBatches = useMemo(() => {
    if (selectedCrop === "All Crops") return batches
    return batches.filter((b) => b.crop_type === selectedCrop)
  }, [batches, selectedCrop])

  // Group by month for trend chart
  const monthlyData = useMemo(() => {
    const grouped: Record<string, { month: string; yield: number; count: number }> = {}

    filteredBatches.forEach((batch) => {
      const date = new Date(batch.harvest_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthLabel = date.toLocaleDateString("en-US", { year: "numeric", month: "short" })

      if (!grouped[monthKey]) {
        grouped[monthKey] = { month: monthLabel, yield: 0, count: 0 }
      }

      grouped[monthKey].yield += batch.quantity_kg / 1000 // Convert to tons
      grouped[monthKey].count += 1
    })

    return Object.values(grouped)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
  }, [filteredBatches])

  // Group by crop type for comparison
  const cropComparison = useMemo(() => {
    const grouped: Record<string, { crop: string; yield: number; count: number }> = {}

    const batchesToUse = selectedCrop === "All Crops" ? batches : filteredBatches

    batchesToUse.forEach((batch) => {
      const crop = batch.crop_type || "Unknown"

      if (!grouped[crop]) {
        grouped[crop] = { crop, yield: 0, count: 0 }
      }

      grouped[crop].yield += batch.quantity_kg / 1000 // Convert to tons
      grouped[crop].count += 1
    })

    return Object.values(grouped)
      .sort((a, b) => b.yield - a.yield)
      .slice(0, 5) // Top 5 crops
  }, [batches, filteredBatches, selectedCrop])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalYield = filteredBatches.reduce((sum, b) => sum + b.quantity_kg, 0) / 1000 // tons
    const avgYield = filteredBatches.length > 0 ? totalYield / filteredBatches.length : 0

    // Calculate trend (last 3 months vs previous 3 months)
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    const recentBatches = filteredBatches.filter((b) => new Date(b.harvest_date) >= threeMonthsAgo)
    const previousBatches = filteredBatches.filter((b) => {
      const date = new Date(b.harvest_date)
      return date >= sixMonthsAgo && date < threeMonthsAgo
    })

    const recentYield = recentBatches.reduce((sum, b) => sum + b.quantity_kg, 0)
    const previousYield = previousBatches.reduce((sum, b) => sum + b.quantity_kg, 0)
    const trend = previousYield > 0 ? ((recentYield - previousYield) / previousYield) * 100 : 0

    return {
      totalYield,
      avgYield,
      trend,
      harvestCount: filteredBatches.length,
    }
  }, [filteredBatches])

  if (batches.length === 0) {
    return (
      <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-poppins">Crop Yield Overview</CardTitle>
          <CardDescription className="font-inter">No harvest data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">
            Start recording harvests to see yield analytics
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Crop Selector and Stats */}
      <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-poppins">Crop Yield Overview</CardTitle>
              <CardDescription className="font-inter">Track yield performance by crop type</CardDescription>
            </div>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select crop" />
              </SelectTrigger>
              <SelectContent>
                {cropTypes.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-[#F5F5F5] rounded-[15px]">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-1">Total Yield</p>
              <p className="text-2xl font-poppins font-semibold text-[#39B54A]">{stats.totalYield.toFixed(1)} tons</p>
            </div>
            <div className="p-4 bg-[#F5F5F5] rounded-[15px]">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-1">Avg per Harvest</p>
              <p className="text-2xl font-poppins font-semibold text-[#000000]">{stats.avgYield.toFixed(2)} tons</p>
            </div>
            <div className="p-4 bg-[#F5F5F5] rounded-[15px]">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-1">Total Harvests</p>
              <p className="text-2xl font-poppins font-semibold text-[#000000]">{stats.harvestCount}</p>
            </div>
            <div className="p-4 bg-[#F5F5F5] rounded-[15px]">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-1">Trend (3 months)</p>
              <div className="flex items-center gap-2">
                <p
                  className={`text-2xl font-poppins font-semibold ${stats.trend >= 0 ? "text-[#39B54A]" : "text-red-500"}`}
                >
                  {stats.trend >= 0 ? "+" : ""}
                  {stats.trend.toFixed(1)}%
                </p>
                {stats.trend >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-[#39B54A]" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trend */}
        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-poppins">Monthly Yield Trend</CardTitle>
            <CardDescription className="font-inter">Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">No data for selected period</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="rgba(0,0,0,0.65)" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="rgba(0,0,0,0.65)"
                    label={{ value: "Tons", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="yield"
                    stroke="#39B54A"
                    strokeWidth={2}
                    dot={{ fill: "#39B54A", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Crop Comparison */}
        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-poppins">
              {selectedCrop === "All Crops" ? "Top Crops by Yield" : "Harvest Distribution"}
            </CardTitle>
            <CardDescription className="font-inter">Total yield comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {cropComparison.length === 0 ? (
              <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cropComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="crop" tick={{ fontSize: 12 }} stroke="rgba(0,0,0,0.65)" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="rgba(0,0,0,0.65)"
                    label={{ value: "Tons", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="yield" fill="#39B54A" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
