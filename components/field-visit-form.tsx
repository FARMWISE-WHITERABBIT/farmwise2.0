"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, ArrowLeft } from "lucide-react"
import { PhotoUpload } from "@/components/photo-upload"
import { GPSLocationCapture } from "@/components/gps-location-capture"

interface FieldVisitFormProps {
  userId: string
}

export default function FieldVisitForm({ userId }: FieldVisitFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [farmers, setFarmers] = useState<any[]>([])

  const [formData, setFormData] = useState({
    farmer_id: "",
    visit_date: new Date().toISOString().split("T")[0],
    visit_type: "routine",
    location: null as { lat: number; lng: number } | null,
    observations: "",
    recommendations: "",
    crop_health: "",
    pest_disease_notes: "",
    photos: [] as string[],
  })

  useEffect(() => {
    const loadFarmers = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("farmers")
        .select("id, farmer_id, first_name, last_name")
        .eq("assigned_agent_id", userId)
        .order("first_name")

      if (data) setFarmers(data)
    }

    loadFarmers()
  }, [userId])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoAdd = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, url],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const visitData = {
        farmer_id: formData.farmer_id,
        agent_id: userId,
        visit_date: formData.visit_date,
        visit_type: formData.visit_type,
        location: formData.location ? `POINT(${formData.location.lng} ${formData.location.lat})` : null,
        observations: formData.observations,
        recommendations: formData.recommendations,
        crop_health: formData.crop_health || null,
        pest_disease_notes: formData.pest_disease_notes || null,
        photos: formData.photos,
        created_by: userId,
      }

      const { error: insertError } = await supabase.from("field_visits").insert(visitData)

      if (insertError) throw insertError

      router.push("/dashboard/field-agent/visits")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="rounded-[25px] border-none shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="farmer_id" className="font-inter">
              Farmer <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.farmer_id}
              onValueChange={(value) => handleInputChange("farmer_id", value)}
              required
            >
              <SelectTrigger className="rounded-[10px] font-inter">
                <SelectValue placeholder="Select farmer" />
              </SelectTrigger>
              <SelectContent>
                {farmers.map((farmer) => (
                  <SelectItem key={farmer.id} value={farmer.id}>
                    {farmer.first_name} {farmer.last_name} ({farmer.farmer_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_date" className="font-inter">
                Visit Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visit_date"
                type="date"
                required
                value={formData.visit_date}
                onChange={(e) => handleInputChange("visit_date", e.target.value)}
                className="rounded-[10px] font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_type" className="font-inter">
                Visit Type
              </Label>
              <Select value={formData.visit_type} onValueChange={(value) => handleInputChange("visit_type", value)}>
                <SelectTrigger className="rounded-[10px] font-inter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine Check</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="problem">Problem Investigation</SelectItem>
                  <SelectItem value="harvest">Harvest Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-inter">Visit Location</Label>
            <GPSLocationCapture onLocationCapture={(location) => handleInputChange("location", location)} />
            {formData.location && (
              <p className="text-sm text-gray-600 font-inter">
                Location captured: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations" className="font-inter">
              Observations <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="observations"
              required
              rows={4}
              placeholder="What did you observe during this visit?"
              value={formData.observations}
              onChange={(e) => handleInputChange("observations", e.target.value)}
              className="rounded-[10px] font-inter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations" className="font-inter">
              Recommendations
            </Label>
            <Textarea
              id="recommendations"
              rows={4}
              placeholder="What recommendations did you provide?"
              value={formData.recommendations}
              onChange={(e) => handleInputChange("recommendations", e.target.value)}
              className="rounded-[10px] font-inter"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crop_health" className="font-inter">
                Crop Health Status
              </Label>
              <Select value={formData.crop_health} onValueChange={(value) => handleInputChange("crop_health", value)}>
                <SelectTrigger className="rounded-[10px] font-inter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pest_disease_notes" className="font-inter">
                Pest/Disease Notes
              </Label>
              <Input
                id="pest_disease_notes"
                placeholder="Any pest or disease observations"
                value={formData.pest_disease_notes}
                onChange={(e) => handleInputChange("pest_disease_notes", e.target.value)}
                className="rounded-[10px] font-inter"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-inter">Visit Photos</Label>
            <PhotoUpload onPhotoCapture={handlePhotoAdd} label="Add photos from visit" />
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {formData.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo || "/placeholder.svg"}
                    alt={`Visit photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[10px] text-sm font-inter">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="rounded-[10px] font-inter"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
              disabled={isLoading}
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Visit
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
