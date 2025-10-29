"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import { GPSLocationCapture } from "@/components/gps-location-capture"
import { BoundaryMapper } from "@/components/boundary-mapper"
import { PhotoUpload } from "@/components/photo-upload"
import CropSelector from "@/components/crop-selector"

interface PlotRegistrationFormProps {
  userId: string
  organizationId: string
}

export default function PlotRegistrationForm({ userId, organizationId }: PlotRegistrationFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dropdown data
  const [farmers, setFarmers] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    farmer_id: "",
    plot_name: "",
    size_hectares: "",
    size_acres: "",

    center_point: null as { lat: number; lng: number } | null,
    boundaries: [] as Array<{ lat: number; lng: number }>,
    satellite_image_url: "",

    // Soil & Terrain
    soil_type: "",
    soil_ph: "",
    elevation_meters: "",
    slope_degree: "",

    // Irrigation
    irrigation_type: "",
    irrigation_coverage_percent: "",

    crops: [] as Array<{ crop: string; hectares: number }>,
    planting_date: "",
    expected_harvest_date: "",
    crop_health_status: "healthy",

    // Additional
    notes: "",
  })

  // Load farmers
  useEffect(() => {
    const loadFarmers = async () => {
      const supabase = createClient()

      const { data: farmersData } = await supabase
        .from("farmers")
        .select("id, farmer_id, first_name, last_name")
        .eq("organization_id", organizationId)
        .order("first_name")

      if (farmersData) setFarmers(farmersData)
    }

    loadFarmers()
  }, [organizationId])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      // Auto-calculate acres from hectares
      if (field === "size_hectares" && value) {
        updated.size_acres = (Number.parseFloat(value) * 2.47105).toFixed(2)
      }

      return updated
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Generate plot code
      const plotCodePrefix = `PLT-${new Date().getFullYear()}`
      const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")
      const plotCode = `${plotCodePrefix}-${randomNum}`

      const cropsData = formData.crops.length > 0 ? JSON.stringify(formData.crops) : null

      // Prepare data
      const plotData = {
        farmer_id: formData.farmer_id,
        plot_name: formData.plot_name,
        plot_code: plotCode,
        size_hectares: Number.parseFloat(formData.size_hectares),
        size_acres: formData.size_acres ? Number.parseFloat(formData.size_acres) : null,
        center_point: formData.center_point ? `POINT(${formData.center_point.lng} ${formData.center_point.lat})` : null,
        boundaries: formData.boundaries.length > 0 ? JSON.stringify(formData.boundaries) : null,
        satellite_image_url: formData.satellite_image_url || null,
        soil_type: formData.soil_type || null,
        soil_ph: formData.soil_ph ? Number.parseFloat(formData.soil_ph) : null,
        elevation_meters: formData.elevation_meters ? Number.parseFloat(formData.elevation_meters) : null,
        slope_degree: formData.slope_degree ? Number.parseFloat(formData.slope_degree) : null,
        irrigation_type: formData.irrigation_type || null,
        irrigation_coverage_percent: formData.irrigation_coverage_percent
          ? Number.parseFloat(formData.irrigation_coverage_percent)
          : null,
        current_crop: cropsData,
        planting_date: formData.planting_date || null,
        expected_harvest_date: formData.expected_harvest_date || null,
        crop_health_status: formData.crop_health_status,
        notes: formData.notes || null,
        status: "active",
        created_by: userId,
      }

      const { error: insertError } = await supabase.from("farm_plots").insert(plotData)

      if (insertError) throw insertError

      router.push("/dashboard/plots")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const totalSteps = 4

  return (
    <Card className="rounded-[25px] border-none shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-poppins text-xl">Register Farm Plot</CardTitle>
            <CardDescription className="font-inter">
              Step {step} of {totalSteps}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-2 w-8 rounded-full ${i + 1 <= step ? "bg-[#39B54A]" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (step === totalSteps) {
              handleSubmit()
            } else {
              setStep(step + 1)
            }
          }}
        >
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Basic Information</h3>

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

              <div className="space-y-2">
                <Label htmlFor="plot_name" className="font-inter">
                  Plot Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="plot_name"
                  required
                  placeholder="e.g., North Field, Plot A"
                  value={formData.plot_name}
                  onChange={(e) => handleInputChange("plot_name", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size_hectares" className="font-inter">
                    Size (Hectares) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="size_hectares"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.size_hectares}
                    onChange={(e) => handleInputChange("size_hectares", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size_acres" className="font-inter">
                    Size (Acres)
                  </Label>
                  <Input
                    id="size_acres"
                    type="number"
                    step="0.01"
                    placeholder="Auto-calculated"
                    value={formData.size_acres}
                    onChange={(e) => handleInputChange("size_acres", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-inter">Plot Center Location</Label>
                <GPSLocationCapture
                  onLocationCapture={(location) => {
                    handleInputChange("center_point", location)
                    if (location.elevation) {
                      handleInputChange("elevation_meters", location.elevation.toString())
                    }
                  }}
                />
                {formData.center_point && (
                  <p className="text-sm text-gray-600 font-inter">
                    Location captured: {formData.center_point.lat.toFixed(6)}, {formData.center_point.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-inter">Map Plot Boundaries</Label>
                <BoundaryMapper
                  onBoundaryComplete={(boundaries, area) => {
                    handleInputChange("boundaries", boundaries)
                    handleInputChange("size_hectares", area.toFixed(2))
                  }}
                />
                {formData.boundaries.length > 0 && (
                  <p className="text-sm text-gray-600 font-inter">
                    {formData.boundaries.length} boundary points captured
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-inter">Plot Photo</Label>
                <PhotoUpload
                  onPhotoCapture={(url) => handleInputChange("satellite_image_url", url)}
                  label="Capture or upload plot photo"
                />
                {formData.satellite_image_url && (
                  <img
                    src={formData.satellite_image_url || "/placeholder.svg"}
                    alt="Plot"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 2: Soil & Terrain */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Soil & Terrain</h3>

              <div className="space-y-2">
                <Label htmlFor="soil_type" className="font-inter">
                  Soil Type
                </Label>
                <Select value={formData.soil_type} onValueChange={(value) => handleInputChange("soil_type", value)}>
                  <SelectTrigger className="rounded-[10px] font-inter">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clay">Clay</SelectItem>
                    <SelectItem value="sandy">Sandy</SelectItem>
                    <SelectItem value="loam">Loam</SelectItem>
                    <SelectItem value="silt">Silt</SelectItem>
                    <SelectItem value="peat">Peat</SelectItem>
                    <SelectItem value="chalk">Chalk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soil_ph" className="font-inter">
                    Soil pH
                  </Label>
                  <Input
                    id="soil_ph"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    placeholder="e.g., 6.5"
                    value={formData.soil_ph}
                    onChange={(e) => handleInputChange("soil_ph", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="elevation_meters" className="font-inter">
                    Elevation (m)
                  </Label>
                  <Input
                    id="elevation_meters"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 250"
                    value={formData.elevation_meters}
                    onChange={(e) => handleInputChange("elevation_meters", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slope_degree" className="font-inter">
                    Slope (°)
                  </Label>
                  <Input
                    id="slope_degree"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 5.0"
                    value={formData.slope_degree}
                    onChange={(e) => handleInputChange("slope_degree", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="irrigation_type" className="font-inter">
                    Irrigation Type
                  </Label>
                  <Select
                    value={formData.irrigation_type}
                    onValueChange={(value) => handleInputChange("irrigation_type", value)}
                  >
                    <SelectTrigger className="rounded-[10px] font-inter">
                      <SelectValue placeholder="Select irrigation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drip">Drip Irrigation</SelectItem>
                      <SelectItem value="sprinkler">Sprinkler</SelectItem>
                      <SelectItem value="rain-fed">Rain-fed</SelectItem>
                      <SelectItem value="flood">Flood Irrigation</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="irrigation_coverage_percent" className="font-inter">
                    Irrigation Coverage (%)
                  </Label>
                  <Input
                    id="irrigation_coverage_percent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g., 80"
                    value={formData.irrigation_coverage_percent}
                    onChange={(e) => handleInputChange("irrigation_coverage_percent", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Current Crop */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Current Crop</h3>

              <div className="space-y-2">
                <Label className="font-inter">Crops</Label>
                <CropSelector
                  value={formData.crops}
                  onChange={(crops) => handleInputChange("crops", crops)}
                  placeholder="Select crops and specify hectares for each"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planting_date" className="font-inter">
                    Planting Date
                  </Label>
                  <Input
                    id="planting_date"
                    type="date"
                    value={formData.planting_date}
                    onChange={(e) => handleInputChange("planting_date", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_harvest_date" className="font-inter">
                    Expected Harvest Date
                  </Label>
                  <Input
                    id="expected_harvest_date"
                    type="date"
                    value={formData.expected_harvest_date}
                    onChange={(e) => handleInputChange("expected_harvest_date", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crop_health_status" className="font-inter">
                  Crop Health Status
                </Label>
                <Select
                  value={formData.crop_health_status}
                  onValueChange={(value) => handleInputChange("crop_health_status", value)}
                >
                  <SelectTrigger className="rounded-[10px] font-inter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="attention">Needs Attention</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Additional Info */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Additional Info</h3>

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-inter">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Add any additional notes about this plot..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[10px] text-sm font-inter mt-4">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (step === 1) {
                  router.back()
                } else {
                  setStep(step - 1)
                }
              }}
              disabled={isLoading}
              className="rounded-[10px] font-inter"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 1 ? "Cancel" : "Previous"}
            </Button>

            <Button
              type="submit"
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
              disabled={isLoading}
            >
              {isLoading ? (
                "Saving..."
              ) : step === totalSteps ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Plot
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
