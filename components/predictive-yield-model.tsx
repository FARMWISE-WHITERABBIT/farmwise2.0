"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertCircle, Target } from "lucide-react"

interface PredictiveYieldModelProps {
  batches: any[]
  cropYields: Record<string, { total: number; count: number; batches: any[] }>
  predictedYield: number
  historicalTrend: number
}

export default function PredictiveYieldModel({
  batches,
  cropYields,
  predictedYield,
  historicalTrend,
}: PredictiveYieldModelProps) {
  // Generate historical and predicted data
  const now = new Date()
  const historicalData: any[] = []

  // Get last 12 months of data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthBatches = batches.filter((b) => {
      const batchDate = new Date(b.harvest_date)
      return batchDate.getMonth() === date.getMonth() && batchDate.getFullYear() === date.getFullYear()
    })

    const totalYield = monthBatches.reduce((sum, b) => sum + (b.quantity_kg || 0), 0)

    historicalData.push({
      month: date.toLocaleString("default", { month: "short", year: "2-digit" }),
      actual: totalYield / 1000, // Convert to tons
      predicted: null,
    })
  }

  // Add predicted data for next 6 months
  const avgMonthlyYield = historicalData.reduce((sum, d) => sum + d.actual, 0) / historicalData.length
  const growthRate = historicalTrend / 100 / 12 // Monthly growth rate

  for (let i = 1; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const predictedValue = avgMonthlyYield * (1 + growthRate * i)

    historicalData.push({
      month: date.toLocaleString("default", { month: "short", year: "2-digit" }),
      actual: null,
      predicted: predictedValue,
    })
  }

  // Calculate confidence intervals
  const stdDev =
    Math.sqrt(
      historicalData
        .filter((d) => d.actual !== null)
        .reduce((sum, d) => sum + Math.pow(d.actual - avgMonthlyYield, 2), 0) /
        historicalData.filter((d) => d.actual !== null).length,
    ) || 0

  const confidenceLevel = stdDev < avgMonthlyYield * 0.2 ? "High" : stdDev < avgMonthlyYield * 0.4 ? "Medium" : "Low"

  // Top crops for next season
  const topPredictedCrops = Object.entries(cropYields)
    .map(([crop, data]) => {
      const avgYield = data.total / data.count
      const predicted = avgYield * (1 + historicalTrend / 100)
      return {
        crop,
        current: avgYield,
        predicted,
        growth: ((predicted - avgYield) / avgYield) * 100,
      }
    })
    .sort((a, b) => b.predicted - a.predicted)
    .slice(0, 5)

  return (
    <div className="grid gap-6">
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-poppins text-lg">Predictive Yield Model</CardTitle>
              <CardDescription className="font-inter">
                Historical data and 6-month yield forecast based on trend analysis
              </CardDescription>
            </div>
            <Badge
              className={`rounded-full font-inter ${
                confidenceLevel === "High"
                  ? "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
                  : confidenceLevel === "Medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {confidenceLevel} Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">
              Insufficient data for predictive modeling
            </p>
          ) : (
            <ChartContainer
              config={{
                actual: {
                  label: "Actual Yield (tons)",
                  color: "#39B54A",
                },
                predicted: {
                  label: "Predicted Yield (tons)",
                  color: "#3B82F6",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                  <YAxis stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#39B54A"
                    strokeWidth={3}
                    dot={{ fill: "#39B54A", r: 4 }}
                    name="Actual Yield (tons)"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: "#3B82F6", r: 4 }}
                    name="Predicted Yield (tons)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[25px] border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <CardTitle className="font-poppins text-lg">Next Season Forecast</CardTitle>
            </div>
            <CardDescription className="font-inter">Predicted yields by crop type</CardDescription>
          </CardHeader>
          <CardContent>
            {topPredictedCrops.length === 0 ? (
              <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">No forecast data available</p>
            ) : (
              <div className="space-y-4">
                {topPredictedCrops.map((crop) => (
                  <div key={crop.crop} className="p-4 bg-[#F5F5F5] rounded-[15px]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-poppins font-semibold text-[#000000]">{crop.crop}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-[#39B54A]" />
                        <span className="text-sm font-semibold text-[#39B54A] font-inter">
                          +{crop.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm font-inter">
                      <span className="text-[rgba(0,0,0,0.65)]">Current: {crop.current.toFixed(0)} kg</span>
                      <span className="text-blue-600 font-semibold">Predicted: {crop.predicted.toFixed(0)} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[25px] border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="font-poppins text-lg">Risk Assessment & Recommendations</CardTitle>
            </div>
            <CardDescription className="font-inter">Key insights for planning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-[15px]">
              <p className="text-sm font-semibold text-[#000000] font-inter mb-2">Model Confidence</p>
              <p className="text-2xl font-poppins font-semibold text-blue-600">{confidenceLevel}</p>
              <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter mt-1">
                Based on {batches.length} historical data points
              </p>
            </div>

            <div className="p-4 bg-[rgba(57,181,74,0.05)] rounded-[15px]">
              <p className="text-sm font-semibold text-[#000000] font-inter mb-2">Expected Growth</p>
              <p className="text-2xl font-poppins font-semibold text-[#39B54A]">
                {historicalTrend >= 0 ? "+" : ""}
                {historicalTrend.toFixed(1)}%
              </p>
              <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter mt-1">Projected yield increase next season</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-[15px]">
              <p className="text-sm font-semibold text-[#000000] font-inter mb-2">Recommendations</p>
              <ul className="space-y-2 text-sm text-[rgba(0,0,0,0.65)] font-inter">
                <li className="flex items-start gap-2">
                  <span className="text-[#39B54A]">•</span>
                  <span>Focus on high-performing crops: {topPredictedCrops[0]?.crop || "N/A"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#39B54A]">•</span>
                  <span>Expand irrigation to increase yields by up to 30%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#39B54A]">•</span>
                  <span>Monitor weather patterns for optimal planting times</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
