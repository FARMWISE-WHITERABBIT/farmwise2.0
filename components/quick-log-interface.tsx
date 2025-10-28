"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Sprout, Droplets, Leaf, Bug, Scissors, Wheat, Tractor } from "lucide-react"
import { ActivityLogForm } from "@/components/activity-log-form"

const activityTypes = [
  {
    type: "planting",
    label: "Planting",
    icon: Sprout,
    color: "bg-green-100 text-green-700 hover:bg-green-200",
    description: "Log planting activities",
  },
  {
    type: "irrigation",
    label: "Irrigation",
    icon: Droplets,
    color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    description: "Record watering activities",
  },
  {
    type: "fertilization",
    label: "Fertilization",
    icon: Leaf,
    color: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    description: "Log fertilizer application",
  },
  {
    type: "pest_control",
    label: "Pest Control",
    icon: Bug,
    color: "bg-red-100 text-red-700 hover:bg-red-200",
    description: "Record pest management",
  },
  {
    type: "weeding",
    label: "Weeding",
    icon: Scissors,
    color: "bg-lime-100 text-lime-700 hover:bg-lime-200",
    description: "Log weeding activities",
  },
  {
    type: "pruning",
    label: "Pruning",
    icon: Scissors,
    color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    description: "Record pruning work",
  },
  {
    type: "harvesting",
    label: "Harvesting",
    icon: Wheat,
    color: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    description: "Log harvest activities",
  },
  {
    type: "soil_preparation",
    label: "Soil Prep",
    icon: Tractor,
    color: "bg-brown-100 text-brown-700 hover:bg-brown-200",
    description: "Record soil preparation",
  },
]

interface QuickLogInterfaceProps {
  userId: string
}

export function QuickLogInterface({ userId }: QuickLogInterfaceProps) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  if (selectedActivity) {
    return (
      <ActivityLogForm
        activityType={selectedActivity}
        userId={userId}
        onCancel={() => setSelectedActivity(null)}
        onSuccess={() => setSelectedActivity(null)}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {activityTypes.map((activity) => {
        const Icon = activity.icon
        return (
          <Card
            key={activity.type}
            className={`${activity.color} cursor-pointer transition-all hover:shadow-lg active:scale-95 border-0 p-4 md:p-6`}
            onClick={() => setSelectedActivity(activity.type)}
          >
            <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
              <div className="p-3 md:p-4 bg-white/50 rounded-full">
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-lg">{activity.label}</h3>
                <p className="text-xs md:text-sm opacity-80 mt-0.5 md:mt-1 hidden sm:block">{activity.description}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
