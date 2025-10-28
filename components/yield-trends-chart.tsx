"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useMemo } from "react"

interface YieldTrendsChartProps {
  batches: any[]
}

export default function YieldTrendsChart({ batches }: YieldTrendsChartProps) {
  const chartData = useMemo(() => {
    // Group by month
    const monthlyData: Record<string, { month: string; yield: number; count: number }> = {}

    batches.forEach((batch) => {
      const date = new Date(batch.harvest_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthLabel = date.toLocaleDateString("en-US", { year: "numeric", month: "short" })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, yield: 0, count: 0 }
      }

      monthlyData[monthKey].yield += batch.quantity_kg || 0
      monthlyData[monthKey].count += 1
    })

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: data.month,
        totalYield: Math.round(data.yield),
        avgYield: Math.round(data.yield / data.count),
        harvests: data.count,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-12) // Last 12 months
  }, [batches])

  return (
    <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="font-poppins text-base md:text-lg">Yield Trends Over Time</CardTitle>
        <CardDescription className="font-inter text-xs md:text-sm">
          Monthly harvest yields for the past 12 months
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {chartData.length === 0 ? (
          <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8 md:py-12 text-sm">
            No harvest data available for trend analysis
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300} className="md:h-[400px]">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey="month"
                stroke="rgba(0,0,0,0.65)"
                style={{ fontSize: "10px" }}
                className="md:text-xs"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="rgba(0,0,0,0.65)" style={{ fontSize: "10px" }} className="md:text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "none",
                  borderRadius: "10px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} className="md:text-sm" />
              <Line
                type="monotone"
                dataKey="totalYield"
                stroke="#39B54A"
                strokeWidth={2}
                name="Total Yield (kg)"
                dot={{ fill: "#39B54A", r: 3 }}
                className="md:r-4"
              />
              <Line
                type="monotone"
                dataKey="avgYield"
                stroke="#2D5016"
                strokeWidth={2}
                name="Avg Yield (kg)"
                dot={{ fill: "#2D5016", r: 3 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
