"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlotMapViewerProps {
  centerPoint?: { lat: number; lng: number } | null
  boundaries?: Array<{ lat: number; lng: number }>
  plotName?: string
  showFullscreen?: boolean
}

export function PlotMapViewer({ centerPoint, boundaries, plotName, showFullscreen = true }: PlotMapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapError) return

    // Check if we have location data
    if (!centerPoint && (!boundaries || boundaries.length === 0)) {
      return
    }

    // Initialize map with Leaflet (using CDN)
    const initMap = async () => {
      try {
        // Load Leaflet CSS
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link")
          link.id = "leaflet-css"
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(link)
        }

        // Load Leaflet JS
        if (!(window as any).L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            script.onload = resolve
            script.onerror = reject
            document.body.appendChild(script)
          })
        }

        const L = (window as any).L

        // Clear existing map
        if (mapRef.current) {
          mapRef.current.innerHTML = ""
        }

        // Determine center and zoom
        let center: [number, number]
        let zoom = 15

        if (centerPoint) {
          center = [centerPoint.lat, centerPoint.lng]
        } else if (boundaries && boundaries.length > 0) {
          // Calculate center from boundaries
          const avgLat = boundaries.reduce((sum, p) => sum + p.lat, 0) / boundaries.length
          const avgLng = boundaries.reduce((sum, p) => sum + p.lng, 0) / boundaries.length
          center = [avgLat, avgLng]
        } else {
          center = [9.082, 8.6753] // Default to Nigeria center
          zoom = 6
        }

        // Create map
        const map = L.map(mapRef.current).setView(center, zoom)

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        // Add center marker if available
        if (centerPoint) {
          const marker = L.marker([centerPoint.lat, centerPoint.lng], {
            icon: L.divIcon({
              className: "custom-marker",
              html: `<div style="background-color: #39B54A; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          }).addTo(map)

          if (plotName) {
            marker.bindPopup(`<strong>${plotName}</strong><br/>Plot Center`)
          }
        }

        // Add boundary polygon if available
        if (boundaries && boundaries.length > 0) {
          const latLngs = boundaries.map((p) => [p.lat, p.lng] as [number, number])

          L.polygon(latLngs, {
            color: "#39B54A",
            fillColor: "#39B54A",
            fillOpacity: 0.2,
            weight: 3,
          }).addTo(map)

          // Fit map to boundary
          const bounds = L.latLngBounds(latLngs)
          map.fitBounds(bounds, { padding: [50, 50] })
        }
      } catch (error) {
        console.error("[v0] Map initialization error:", error)
        setMapError(true)
      }
    }

    initMap()
  }, [centerPoint, boundaries, plotName, mapError])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.parentElement?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (!centerPoint && (!boundaries || boundaries.length === 0)) {
    return (
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardContent className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
            <MapPin className="h-8 w-8 text-[#39B54A]" />
          </div>
          <h3 className="font-poppins text-lg font-semibold mb-2">No location data</h3>
          <p className="text-[rgba(0,0,0,0.65)] font-inter text-sm">
            GPS coordinates will be displayed here once captured
          </p>
        </CardContent>
      </Card>
    )
  }

  if (mapError) {
    return (
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardContent className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <MapPin className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="font-poppins text-lg font-semibold mb-2">Map unavailable</h3>
          <p className="text-[rgba(0,0,0,0.65)] font-inter text-sm">Unable to load map visualization</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-[25px] border-none shadow-sm relative">
      {showFullscreen && (
        <Button
          onClick={toggleFullscreen}
          size="sm"
          variant="outline"
          className="absolute top-4 right-4 z-[1000] bg-white rounded-[8px]"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
      <div ref={mapRef} className="w-full h-[400px] rounded-[25px]" />
    </Card>
  )
}
