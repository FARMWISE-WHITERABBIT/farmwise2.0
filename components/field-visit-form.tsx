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
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react"
import { PhotoUpload } from "@/components/photo-upload"
import { GPSLocationCapture } from "@/components/gps-location-capture"

interface FieldVisitFormProps {
  agentId: string
  farmers: Array<{ id: string; farmer_id: string; first_name: string; last_name: string }>
  initialFarmerId?: string
  initialPlots?: Array<{ id: string; plot_name: string; plot_code: string }>
}

interface Disbursement {
  item_name: string
  quantity: number
  unit: string
  value: number
  notes: string
}

export function FieldVisitForm({ agentId, farmers, initialFarmerId, initialPlots }: FieldVisitFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plots, setPlots] = useState<any[]>(initialPlots || [])

  const [formData, setFormData] = useState({
    farmer_id: initialFarmerId || "",
    plot_id: "",
    visit_date: new Date().toISOString().split("T")[0],
    visit_type: "routine",
    location: null as { lat: number; lng: number } | null,
    observations: "",
    recommendations: "",
    crop_health: "",
    pest_disease_notes: "",
    photos: [] as string[],
  })

  const [disbursements, setDisbursements] = useState<Disbursement[]>([])

  useEffect(() => {
    if (formData.farmer_id) {
      const loadPlots = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from("farm_plots")
          .select("id, plot_name, plot_code")
          .eq("farmer_id", formData.farmer_id)
          .order("plot_name")

        if (data) setPlots(data)
      }

      loadPlots()
    } else {
      setPlots([])
      setFormData((prev) => ({ ...prev, plot_id: "" }))
    }
  }, [formData.farmer_id])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoAdd = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, url],
    }))
  }

  const addDisbursement = () => {
    setDisbursements([...disbursements, { item_name: "", quantity: 0, unit: "", value: 0, notes: "" }])
  }

  const removeDisbursement = (index: number) => {
    setDisbursements(disbursements.filter((_, i) => i !== index))
  }

  const updateDisbursement = (index: number, field: keyof Disbursement, value: any) => {
    const updated = [...disbursements]
    updated[index] = { ...updated[index], [field]: value }
    setDisbursements(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const visitData = {
        farmer_id: formData.farmer_id,
        plot_id: formData.plot_id || null,
        agent_id: agentId,
        visit_date: formData.visit_date,
        visit_type: formData.visit_type,
        location: formData.location ? `POINT(${formData.location.lng} ${formData.location.lat})` : null,
        observations: formData.observations,
        recommendations: formData.recommendations,
        crop_health: formData.crop_health || null,
        pest_disease_notes: formData.pest_disease_notes || null,
        photos: formData.photos,
        created_by: agentId,
      }

      const { data: visitRecord, error: insertError } = await supabase
        .from("field_visits")
        .insert(visitData)
        .select()
        .single()

      if (insertError) throw insertError

      if (disbursements.length > 0 && visitRecord) {
        const disbursementRecords = disbursements
          .filter((d) => d.item_name && d.quantity > 0)
          .map((d) => ({
            farmer_id: formData.farmer_id,
            field_visit_id: visitRecord.id,
            agent_id: agentId,
            item_name: d.item_name,
            quantity: d.quantity,
            unit: d.unit,
            value: d.value,
            disbursement_date: formData.visit_date,
            notes: d.notes,
          }))

        if (disbursementRecords.length > 0) {
          const { error: disbursementError } = await supabase.from("input_disbursements").insert(disbursementRecords)

          if (disbursementError) {
            console.error("[v0] Error saving disbursements:", disbursementError)
          }
        }
      }

      if (initialFarmerId) {
        router.push(`/dashboard/farmers/${initialFarmerId}`)
      } else {
        router.push("/dashboard/field-agent")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedFarmer = farmers.find((f) => f.id === formData.farmer_id)

  return (
    <Card className="rounded-[25px] border-none shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6 pb-24 md:pb-24 lg:pb-8">
          {!initialFarmerId ? (
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
          ) : (
            <div className="bg-[rgba(57,181,74,0.1)] border border-[rgba(57,181,74,0.3)] rounded-[10px] p-4">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-1">Logging activity for:</p>
              <p className="font-poppins font-semibold text-[rgba(0,0,0,0.87)]">
                {selectedFarmer?.first_name} {selectedFarmer?.last_name} ({selectedFarmer?.farmer_id})
              </p>
            </div>
          )}

          {plots.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="plot_id" className="font-inter">
                Plot (Optional)
              </Label>
              <Select value={formData.plot_id} onValueChange={(value) => handleInputChange("plot_id", value)}>
                <SelectTrigger className="rounded-[10px] font-inter">
                  <SelectValue placeholder="Select plot" />
                </SelectTrigger>
                <SelectContent>
                  {plots.map((plot) => (
                    <SelectItem key={plot.id} value={plot.id}>
                      {plot.plot_name} ({plot.plot_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-inter text-base">Farm Input Disbursements</Label>
                <p className="text-sm text-muted-foreground">Record any inputs provided to the farmer</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDisbursement}
                className="rounded-[10px] bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {disbursements.map((disbursement, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-inter">Item {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDisbursement(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-inter">Item Name</Label>
                      <Input
                        placeholder="e.g., NPK Fertilizer, Seeds, Pesticide"
                        value={disbursement.item_name}
                        onChange={(e) => updateDisbursement(index, "item_name", e.target.value)}
                        className="rounded-[10px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-inter">Unit</Label>
                      <Select
                        value={disbursement.unit}
                        onValueChange={(value) => updateDisbursement(index, "unit", value)}
                      >
                        <SelectTrigger className="rounded-[10px]">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="bags">Bags</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                          <SelectItem value="bottles">Bottles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-inter">Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={disbursement.quantity || ""}
                        onChange={(e) => updateDisbursement(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                        className="rounded-[10px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-inter">Value (₦)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={disbursement.value || ""}
                        onChange={(e) => updateDisbursement(index, "value", Number.parseFloat(e.target.value) || 0)}
                        className="rounded-[10px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-inter">Notes (Optional)</Label>
                    <Input
                      placeholder="Additional notes about this disbursement"
                      value={disbursement.notes}
                      onChange={(e) => updateDisbursement(index, "notes", e.target.value)}
                      className="rounded-[10px]"
                    />
                  </div>
                </div>
              </Card>
            ))}

            {disbursements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No disbursements added. Click "Add Item" to record farm inputs provided.
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

export default FieldVisitForm
