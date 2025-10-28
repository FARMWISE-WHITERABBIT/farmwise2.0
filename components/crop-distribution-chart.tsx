"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface Plot {
  current_crop: string | null
  crop_health_status: string | null
}

interface CropDistributionChartProps {
  plots: Plot[]
}

const COLORS = ["#65a30d", "#84cc16", "#a3e635", "#bef264", "#d9f99d", "#ecfccb"]

export function CropDistributionChart({ plots }: CropDistributionChartProps) {
  // Count plots by crop type
  const cropCounts = plots.reduce(
    (acc, plot) => {
      const crop = plot.current_crop || "Unknown"
      acc[crop] = (acc[crop] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Convert to chart data format
  const chartData = Object.entries(cropCounts).map(([crop, count]) => ({
    name: crop.charAt(0).toUpperCase() + crop.slice(1),
    value: count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crop Distribution</CardTitle>
        <CardDescription>Distribution of crops across all plots</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">No crop data available</div>
        )}
      </CardContent>
    </Card>
  )
}
