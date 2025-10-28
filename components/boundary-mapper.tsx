"use client"

import { useState, useEffect } from "react"
import { MapPin, Trash2, Check, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface BoundaryPoint {
  latitude: number
  longitude: number
  timestamp: number
}

interface BoundaryMapperProps {
  onComplete: (boundaries: BoundaryPoint[], area: number) => void
  label?: string
}

export function BoundaryMapper({ onComplete, label = "Map Farm Plot Boundaries" }: BoundaryMapperProps) {
  const [points, setPoints] = useState<BoundaryPoint[]>([])
  const [tracking, setTracking] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

  const calculateArea = (points: BoundaryPoint[]): number => {
    if (points.length < 3) return 0

    // Haversine formula for area calculation
    const R = 6371000 // Earth's radius in meters
    let area = 0

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      const lat1 = (points[i].latitude * Math.PI) / 180
      const lat2 = (points[j].latitude * Math.PI) / 180
      const lng1 = (points[i].longitude * Math.PI) / 180
      const lng2 = (points[j].longitude * Math.PI) / 180

      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2))
    }

    area = (Math.abs(area) * R * R) / 2
    return area / 10000 // Convert to hectares
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported")
      return
    }

    setTracking(true)
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newPoint: BoundaryPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        }
        setPoints((prev) => [...prev, newPoint])
      },
      (error) => {
        console.error("[v0] GPS tracking error:", error)
        alert("Unable to track location")
        stopTracking()
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
      },
    )
    setWatchId(id)
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setTracking(false)
  }

  const addManualPoint = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPoint: BoundaryPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        }
        setPoints((prev) => [...prev, newPoint])
      },
      (error) => {
        console.error("[v0] GPS error:", error)
        alert("Unable to get location")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const removePoint = (index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index))
  }

  const completeBoundary = () => {
    if (points.length < 3) {
      alert("Please add at least 3 points to create a boundary")
      return
    }

    const area = calculateArea(points)
    onComplete(points, area)
    stopTracking()
  }

  const reset = () => {
    setPoints([])
    stopTracking()
  }

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const area = calculateArea(points)

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">{label}</label>

      <Card className="p-4">
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Points Captured</p>
              <p className="text-2xl font-bold text-[#39B54A]">{points.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Area</p>
              <p className="text-2xl font-bold text-[#39B54A]">{area.toFixed(2)} ha</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!tracking ? (
              <>
                <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={startTracking}>
                  <Navigation className="mr-2 h-4 w-4" />
                  Start Tracking
                </Button>
                <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={addManualPoint}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Add Point
                </Button>
              </>
            ) : (
              <Button type="button" variant="destructive" className="flex-1" onClick={stopTracking}>
                Stop Tracking
              </Button>
            )}
          </div>

          {/* Points list */}
          {points.length > 0 && (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {points.map((point, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium">Point {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePoint(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {points.length >= 3 && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={reset}>
                Reset
              </Button>
              <Button type="button" className="flex-1 bg-[#39B54A] hover:bg-[#2d8f3a]" onClick={completeBoundary}>
                <Check className="mr-2 h-4 w-4" />
                Complete Boundary
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
