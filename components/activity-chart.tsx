"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Activity {
  activity_type: string
  activity_date: string
}

interface ActivityChartProps {
  activities: Activity[]
}

export function ActivityChart({ activities }: ActivityChartProps) {
  // Count activities by type
  const activityCounts = activities.reduce(
    (acc, activity) => {
      const type = activity.activity_type
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Convert to chart data format
  const chartData = Object.entries(activityCounts).map(([type, count]) => ({
    name: type.replace(/_/g, " ").charAt(0).toUpperCase() + type.replace(/_/g, " ").slice(1),
    count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Distribution</CardTitle>
        <CardDescription>Breakdown of farm activities by type</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#65a30d" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No activity data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
