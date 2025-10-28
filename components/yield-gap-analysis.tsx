"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { Droplets, Mountain } from "lucide-react"

interface YieldGapAnalysisProps {
  soilYields: Record<string, { total: number; count: number; avgPerHa: number }>
  irrigationImpact: number
  avgIrrigatedYield: number
  avgNonIrrigatedYield: number
  batches: any[]
}

export default function YieldGapAnalysis({
  soilYields,
  irrigationImpact,
  avgIrrigatedYield,
  avgNonIrrigatedYield,
  batches,
}: YieldGapAnalysisProps) {
  const soilData = Object.entries(soilYields).map(([soil, data]) => ({
    soil: soil.replace(/_/g, " "),
    avgYield: data.avgPerHa,
    harvests: data.count,
  }))

  const irrigationData = [
    {
      type: "Irrigated",
      yield: avgIrrigatedYield,
    },
    {
      type: "Non-Irrigated",
      yield: avgNonIrrigatedYield,
    },
  ]

  return (
    <div className="grid gap-6">
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-[#39B54A]" />
            <CardTitle className="font-poppins text-lg">Soil Type Impact on Yield</CardTitle>
          </div>
          <CardDescription className="font-inter">Average yield per hectare by soil type</CardDescription>
        </CardHeader>
        <CardContent>
          {soilData.length === 0 ? (
            <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">No soil data available yet</p>
          ) : (
            <ChartContainer
              config={{
                avgYield: {
                  label: "Avg Yield (kg/ha)",
                  color: "#39B54A",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={soilData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="soil" stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                  <YAxis stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="avgYield" fill="#39B54A" radius={[8, 8, 0, 0]} name="Avg Yield (kg/ha)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[25px] border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              <CardTitle className="font-poppins text-lg">Irrigation Impact</CardTitle>
            </div>
            <CardDescription className="font-inter">Comparison of irrigated vs non-irrigated plots</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                yield: {
                  label: "Yield (kg/ha)",
                  color: "#3B82F6",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={irrigationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="type" stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                  <YAxis stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="yield" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Yield (kg/ha)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[25px] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-poppins text-lg">Key Yield Factors</CardTitle>
            <CardDescription className="font-inter">Critical factors affecting crop yield</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-[15px]">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-semibold text-[#000000] font-inter">Irrigation</p>
              </div>
              <p className="text-2xl font-poppins font-semibold text-blue-600">+{irrigationImpact.toFixed(0)}%</p>
              <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter mt-1">
                Irrigated plots yield {irrigationImpact.toFixed(0)}% more than non-irrigated
              </p>
            </div>

            <div className="p-4 bg-[rgba(57,181,74,0.05)] rounded-[15px]">
              <div className="flex items-center gap-2 mb-2">
                <Mountain className="h-5 w-5 text-[#39B54A]" />
                <p className="text-sm font-semibold text-[#000000] font-inter">Soil Quality</p>
              </div>
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                {soilData.length > 0
                  ? `${soilData[0].soil} shows best performance with ${soilData[0].avgYield.toFixed(0)} kg/ha`
                  : "Insufficient data for analysis"}
              </p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-[15px]">
              <p className="text-sm font-semibold text-[#000000] font-inter mb-2">Recommendation</p>
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                Focus on expanding irrigation infrastructure and soil improvement programs to close the yield gap
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
