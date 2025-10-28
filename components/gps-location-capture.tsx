"use client"

import { useState } from "react"
import { MapPin, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface GPSLocationCaptureProps {
  onCapture: (location: { latitude: number; longitude: number; accuracy: number }) => void
  label?: string
}

export function GPSLocationCapture({ onCapture, label = "Capture GPS Location" }: GPSLocationCaptureProps) {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        setLocation(locationData)
        onCapture(locationData)
        setLoading(false)
      },
      (error) => {
        console.error("[v0] GPS error:", error)
        setError("Unable to get location. Please check permissions.")
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      {location ? (
        <Card className="bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 text-green-600" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-green-900">Location Captured</p>
              <p className="text-xs text-green-700">
                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-green-600">Accuracy: ±{location.accuracy.toFixed(0)}m</p>
            </div>
            <Button variant="outline" size="sm" onClick={captureLocation} disabled={loading}>
              Recapture
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full bg-transparent"
          onClick={captureLocation}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Capture Location
            </>
          )}
        </Button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
