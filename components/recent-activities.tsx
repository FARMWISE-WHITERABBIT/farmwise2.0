"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, User, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Activity {
  id: string
  activity_type: string
  activity_date: string
  description: string
  farmers: {
    farmer_id: string
    first_name: string
    last_name: string
  } | null
  farm_plots: {
    id: string
    plot_name: string
  } | null
}

interface RecentActivitiesProps {
  activities: Activity[]
}

const activityTypeColors: Record<string, string> = {
  planting: "bg-green-100 text-green-800",
  fertilizing: "bg-yellow-100 text-yellow-800",
  weeding: "bg-orange-100 text-orange-800",
  pest_control: "bg-red-100 text-red-800",
  harvesting: "bg-blue-100 text-blue-800",
  irrigation: "bg-cyan-100 text-cyan-800",
  soil_preparation: "bg-purple-100 text-purple-800",
  pruning: "bg-pink-100 text-pink-800",
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest farm activities logged in the system</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/activities">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={activityTypeColors[activity.activity_type] || "bg-gray-100 text-gray-800"}>
                      {activity.activity_type.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(activity.activity_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{activity.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {activity.farmers && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {activity.farmers.first_name} {activity.farmers.last_name}
                      </div>
                    )}
                    {activity.farm_plots && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.farm_plots.plot_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activities</p>
            <Button asChild className="mt-4 bg-lime-600 hover:bg-lime-700">
              <Link href="/dashboard/activities/new">Log Your First Activity</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
