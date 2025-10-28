"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

interface SeasonalPatternsChartProps {
  batches: any[]
}

export default function SeasonalPatternsChart({ batches }: SeasonalPatternsChartProps) {
  // Group by month across all years
  const monthlyData: Record<string, { total: number; count: number }> = {}

  batches.forEach((batch) => {
    const date = new Date(batch.harvest_date)
    const month = date.toLocaleString("default", { month: "short" })

    if (!monthlyData[month]) {
      monthlyData[month] = { total: 0, count: 0 }
    }
    monthlyData[month].total += batch.quantity_kg || 0
    monthlyData[month].count += 1
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const chartData = months.map((month) => ({
    month,
    avgYield: monthlyData[month] ? monthlyData[month].total / monthlyData[month].count : 0,
    harvests: monthlyData[month]?.count || 0,
  }))

  return (
    <Card className="rounded-[25px] border-none shadow-sm">
      <CardHeader>
        <CardTitle className="font-poppins text-lg">Seasonal Yield Patterns</CardTitle>
        <CardDescription className="font-inter">Average yield by month across all years</CardDescription>
      </CardHeader>
      <CardContent>
        {batches.length === 0 ? (
          <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">No harvest data available yet</p>
        ) : (
          <ChartContainer
            config={{
              avgYield: {
                label: "Average Yield (kg)",
                color: "#39B54A",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="month" stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                <YAxis stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgYield"
                  stroke="#39B54A"
                  strokeWidth={3}
                  dot={{ fill: "#39B54A", r: 4 }}
                  name="Avg Yield (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
