"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VoiceNoteRecorder } from "@/components/voice-note-recorder"
import { ArrowLeft, Camera, MapPin, Send } from "lucide-react"
import { useRouter } from "next/navigation"

interface ActivityLogFormProps {
  activityType: string
  userId: string
  onCancel: () => void
  onSuccess: () => void
}

export function ActivityLogForm({ activityType, userId, onCancel, onSuccess }: ActivityLogFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Basic fields
    farmer_id: "",
    plot_id: "",
    activity_date: new Date().toISOString().split("T")[0],
    start_time: new Date().toTimeString().slice(0, 5),
    end_time: "",
    weather_condition: "",

    // Activity-specific fields
    crop_type: "",
    crop_variety: "",
    seed_quantity: "",
    seed_unit: "",
    planting_method: "",
    plant_spacing_cm: "",
    row_spacing_cm: "",

    // Irrigation
    water_source: "",
    irrigation_method: "",
    irrigation_duration_minutes: "",
    water_volume_liters: "",

    // Fertilization
    fertilizer_name: "",
    fertilizer_type: "",
    npk_ratio: "",
    fertilizer_quantity: "",
    fertilizer_unit: "",
    application_method: "",

    // Pest Control
    pest_identified: "",
    pest_severity: "",
    pesticide_name: "",
    pesticide_dosage: "",
    pesticide_unit: "",

    // Harvesting
    quantity_harvested: "",
    harvest_unit: "",
    quality_grade: "",
    harvest_method: "",
    storage_location: "",

    // Resources
    labor_workers: "",
    labor_hours: "",
    labor_cost: "",
    equipment_used: [] as string[],

    // Documentation
    photos: [] as string[],
    voice_notes: [] as string[],
    notes: "",
    gps_coordinates: null as { lat: number; lng: number } | null,
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          activity_type: activityType,
          recorded_by: userId,
          status: "completed",
        }),
      })

      if (response.ok) {
        onSuccess()
        router.refresh()
      }
    } catch (error) {
      console.error("Error submitting activity:", error)
    } finally {
      setLoading(false)
    }
  }

  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          gps_coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        })
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold capitalize">{activityType.replace("_", " ")}</h2>
              <p className="text-sm text-gray-600">Step {step} of 4</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Save Draft
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Farmer *</Label>
              <Select
                value={formData.farmer_id}
                onValueChange={(value) => setFormData({ ...formData, farmer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select farmer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer1">John Doe</SelectItem>
                  <SelectItem value="farmer2">Jane Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Farm Plot *</Label>
              <Select value={formData.plot_id} onValueChange={(value) => setFormData({ ...formData, plot_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plot1">Plot A - 2.5 hectares</SelectItem>
                  <SelectItem value="plot2">Plot B - 1.8 hectares</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Activity Date *</Label>
                <Input
                  type="date"
                  value={formData.activity_date}
                  onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Weather Condition</Label>
              <Select
                value={formData.weather_condition}
                onValueChange={(value) => setFormData({ ...formData, weather_condition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">☀️ Sunny</SelectItem>
                  <SelectItem value="cloudy">⛅ Cloudy</SelectItem>
                  <SelectItem value="rainy">🌧️ Rainy</SelectItem>
                  <SelectItem value="stormy">⛈️ Stormy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setStep(2)} className="w-full">
              Next: Activity Details
            </Button>
          </div>
        )}

        {/* Step 2: Activity-Specific Details */}
        {step === 2 && (
          <div className="space-y-4">
            {activityType === "planting" && (
              <>
                <div>
                  <Label>Crop Type *</Label>
                  <Input
                    value={formData.crop_type}
                    onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                    placeholder="e.g., Maize, Rice, Cassava"
                  />
                </div>
                <div>
                  <Label>Crop Variety</Label>
                  <Input
                    value={formData.crop_variety}
                    onChange={(e) => setFormData({ ...formData, crop_variety: e.target.value })}
                    placeholder="e.g., FARO 44, BR 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Seed Quantity *</Label>
                    <Input
                      type="number"
                      value={formData.seed_quantity}
                      onChange={(e) => setFormData({ ...formData, seed_quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select
                      value={formData.seed_unit}
                      onValueChange={(value) => setFormData({ ...formData, seed_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="seeds">Seeds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Planting Method</Label>
                  <Select
                    value={formData.planting_method}
                    onValueChange={(value) => setFormData({ ...formData, planting_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct_seeding">Direct Seeding</SelectItem>
                      <SelectItem value="transplanting">Transplanting</SelectItem>
                      <SelectItem value="broadcasting">Broadcasting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plant Spacing (cm)</Label>
                    <Input
                      type="number"
                      value={formData.plant_spacing_cm}
                      onChange={(e) => setFormData({ ...formData, plant_spacing_cm: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Row Spacing (cm)</Label>
                    <Input
                      type="number"
                      value={formData.row_spacing_cm}
                      onChange={(e) => setFormData({ ...formData, row_spacing_cm: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {activityType === "irrigation" && (
              <>
                <div>
                  <Label>Water Source *</Label>
                  <Select
                    value={formData.water_source}
                    onValueChange={(value) => setFormData({ ...formData, water_source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borehole">Borehole</SelectItem>
                      <SelectItem value="river">River</SelectItem>
                      <SelectItem value="well">Well</SelectItem>
                      <SelectItem value="rain">Rain</SelectItem>
                      <SelectItem value="municipal">Municipal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Irrigation Method *</Label>
                  <Select
                    value={formData.irrigation_method}
                    onValueChange={(value) => setFormData({ ...formData, irrigation_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drip">Drip Irrigation</SelectItem>
                      <SelectItem value="sprinkler">Sprinkler</SelectItem>
                      <SelectItem value="flood">Flood Irrigation</SelectItem>
                      <SelectItem value="manual">Manual Watering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.irrigation_duration_minutes}
                      onChange={(e) => setFormData({ ...formData, irrigation_duration_minutes: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Water Volume (liters)</Label>
                    <Input
                      type="number"
                      value={formData.water_volume_liters}
                      onChange={(e) => setFormData({ ...formData, water_volume_liters: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {activityType === "fertilization" && (
              <>
                <div>
                  <Label>Fertilizer Type *</Label>
                  <Select
                    value={formData.fertilizer_type}
                    onValueChange={(value) => setFormData({ ...formData, fertilizer_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organic">Organic</SelectItem>
                      <SelectItem value="inorganic">Inorganic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fertilizer Name *</Label>
                  <Input
                    value={formData.fertilizer_name}
                    onChange={(e) => setFormData({ ...formData, fertilizer_name: e.target.value })}
                    placeholder="e.g., NPK, Urea, Compost"
                  />
                </div>
                <div>
                  <Label>NPK Ratio</Label>
                  <Input
                    value={formData.npk_ratio}
                    onChange={(e) => setFormData({ ...formData, npk_ratio: e.target.value })}
                    placeholder="e.g., 15-15-15"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={formData.fertilizer_quantity}
                      onChange={(e) => setFormData({ ...formData, fertilizer_quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select
                      value={formData.fertilizer_unit}
                      onValueChange={(value) => setFormData({ ...formData, fertilizer_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Application Method</Label>
                  <Select
                    value={formData.application_method}
                    onValueChange={(value) => setFormData({ ...formData, application_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broadcasting">Broadcasting</SelectItem>
                      <SelectItem value="banding">Banding</SelectItem>
                      <SelectItem value="foliar">Foliar Spray</SelectItem>
                      <SelectItem value="fertigation">Fertigation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {activityType === "pest_control" && (
              <>
                <div>
                  <Label>Pest Identified *</Label>
                  <Input
                    value={formData.pest_identified}
                    onChange={(e) => setFormData({ ...formData, pest_identified: e.target.value })}
                    placeholder="e.g., Aphids, Caterpillars, Beetles"
                  />
                </div>
                <div>
                  <Label>Pest Severity *</Label>
                  <Select
                    value={formData.pest_severity}
                    onValueChange={(value) => setFormData({ ...formData, pest_severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pesticide Name *</Label>
                  <Input
                    value={formData.pesticide_name}
                    onChange={(e) => setFormData({ ...formData, pesticide_name: e.target.value })}
                    placeholder="e.g., Lambda-cyhalothrin"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dosage *</Label>
                    <Input
                      type="number"
                      value={formData.pesticide_dosage}
                      onChange={(e) => setFormData({ ...formData, pesticide_dosage: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select
                      value={formData.pesticide_unit}
                      onValueChange={(value) => setFormData({ ...formData, pesticide_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml">Milliliters</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="grams">Grams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {activityType === "harvesting" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity Harvested *</Label>
                    <Input
                      type="number"
                      value={formData.quantity_harvested}
                      onChange={(e) => setFormData({ ...formData, quantity_harvested: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select
                      value={formData.harvest_unit}
                      onValueChange={(value) => setFormData({ ...formData, harvest_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="crates">Crates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Quality Grade *</Label>
                  <Select
                    value={formData.quality_grade}
                    onValueChange={(value) => setFormData({ ...formData, quality_grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="grade_a">Grade A</SelectItem>
                      <SelectItem value="grade_b">Grade B</SelectItem>
                      <SelectItem value="grade_c">Grade C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Harvest Method</Label>
                  <Select
                    value={formData.harvest_method}
                    onValueChange={(value) => setFormData({ ...formData, harvest_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="mechanical">Mechanical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Storage Location</Label>
                  <Input
                    value={formData.storage_location}
                    onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                    placeholder="e.g., Warehouse A, Cold Storage"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Next: Resources
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Resources */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Workers</Label>
                <Input
                  type="number"
                  value={formData.labor_workers}
                  onChange={(e) => setFormData({ ...formData, labor_workers: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Hours</Label>
                <Input
                  type="number"
                  value={formData.labor_hours}
                  onChange={(e) => setFormData({ ...formData, labor_hours: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Cost (₦)</Label>
                <Input
                  type="number"
                  value={formData.labor_cost}
                  onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Equipment Used</Label>
              <Textarea placeholder="List equipment used (e.g., Tractor, Sprayer, Hoe)" rows={3} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Next: Documentation
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Documentation */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label>Photos</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Button variant="outline" className="h-24 bg-transparent">
                  <Camera className="w-6 h-6 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" className="h-24 bg-transparent">
                  <Camera className="w-6 h-6 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </div>

            <div>
              <Label>Voice Note</Label>
              <VoiceNoteRecorder
                onRecordingComplete={(url) => {
                  setFormData({
                    ...formData,
                    voice_notes: [...formData.voice_notes, url],
                  })
                }}
              />
            </div>

            <div>
              <Label>GPS Location</Label>
              <Button variant="outline" onClick={captureGPS} className="w-full bg-transparent">
                <MapPin className="w-4 h-4 mr-2" />
                {formData.gps_coordinates
                  ? `Location Captured: ${formData.gps_coordinates.lat.toFixed(6)}, ${formData.gps_coordinates.lng.toFixed(6)}`
                  : "Capture GPS Location"}
              </Button>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes or observations..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Submitting..." : "Submit Activity"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
