"use client"

import { Calendar, MapPin, Package, Truck, CheckCircle, AlertCircle, User } from "lucide-react"

interface TimelineEvent {
  id: string
  event_type: string
  event_date: string
  description: string
  location?: string
  quantity_affected_kg?: number
  users?: {
    first_name: string
    last_name: string
  }
}

interface TraceabilityTimelineProps {
  events: TimelineEvent[]
}

export function TraceabilityTimeline({ events }: TraceabilityTimelineProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "harvest":
        return <Package className="h-5 w-5 text-green-600" />
      case "storage":
        return <Package className="h-5 w-5 text-blue-600" />
      case "transport":
        return <Truck className="h-5 w-5 text-yellow-600" />
      case "delivery":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "quality_check":
        return <CheckCircle className="h-5 w-5 text-[#39B54A]" />
      case "issue":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "harvest":
        return "bg-green-100 border-green-300"
      case "storage":
        return "bg-blue-100 border-blue-300"
      case "transport":
        return "bg-yellow-100 border-yellow-300"
      case "delivery":
        return "bg-green-100 border-green-300"
      case "quality_check":
        return "bg-[rgba(57,181,74,0.1)] border-[#39B54A]"
      case "issue":
        return "bg-red-100 border-red-300"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[rgba(0,0,0,0.45)] font-inter">No events recorded yet</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Events */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-4">
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full border-2 ${getEventColor(event.event_type)} flex items-center justify-center z-10`}
            >
              {getEventIcon(event.event_type)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="bg-white rounded-[15px] p-4 shadow-sm border border-[rgba(0,0,0,0.08)]">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-[#000000] font-inter capitalize">
                    {event.event_type.replace("_", " ")}
                  </h4>
                  <span className="text-xs text-[rgba(0,0,0,0.45)] font-inter">
                    {new Date(event.event_date).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">{event.description}</p>

                <div className="flex flex-wrap gap-4 text-xs text-[rgba(0,0,0,0.65)] font-inter">
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                  {event.quantity_affected_kg && (
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {event.quantity_affected_kg} kg
                    </div>
                  )}
                  {event.users && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {event.users.first_name} {event.users.last_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
