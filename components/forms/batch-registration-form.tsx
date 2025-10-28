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
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"

interface BatchRegistrationFormProps {
  userId: string
  organizationId: string
}

export default function BatchRegistrationForm({ userId, organizationId }: BatchRegistrationFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dropdown data
  const [farmers, setFarmers] = useState<any[]>([])
  const [farmPlots, setFarmPlots] = useState<any[]>([])
  const [filteredPlots, setFilteredPlots] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    farmer_id: "",
    farm_plot_id: "",
    crop_type: "",
    variety: "",

    // Quantity
    quantity_kg: "",
    unit_of_measure: "kg",

    // Harvest Details
    harvest_date: new Date().toISOString().split("T")[0],
    expected_shelf_life_days: "",
    quality_grade: "",

    // Certifications
    is_organic: false,
    certifications: "",

    // Storage
    storage_location: "",
    storage_temperature_celsius: "",
    storage_conditions: "",

    // Additional
    notes: "",
  })

  // Load farmers and plots
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      // Load farmers
      const { data: farmersData } = await supabase
        .from("farmers")
        .select("id, farmer_id, first_name, last_name")
        .eq("organization_id", organizationId)
        .order("first_name")

      if (farmersData) setFarmers(farmersData)

      // Load farm plots
      const { data: plotsData } = await supabase
        .from("farm_plots")
        .select("id, plot_code, plot_name, farmer_id")
        .order("plot_name")

      if (plotsData) setFarmPlots(plotsData)
    }

    loadData()
  }, [organizationId])

  // Filter plots when farmer changes
  useEffect(() => {
    if (formData.farmer_id) {
      const filtered = farmPlots.filter((plot) => plot.farmer_id === formData.farmer_id)
      setFilteredPlots(filtered)
    } else {
      setFilteredPlots([])
    }
  }, [formData.farmer_id, farmPlots])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Prepare data
      const batchData = {
        farmer_id: formData.farmer_id,
        farm_plot_id: formData.farm_plot_id || null,
        organization_id: organizationId,
        crop_type: formData.crop_type,
        variety: formData.variety || null,
        quantity_kg: Number.parseFloat(formData.quantity_kg),
        unit_of_measure: formData.unit_of_measure,
        harvest_date: formData.harvest_date,
        expected_shelf_life_days: formData.expected_shelf_life_days
          ? Number.parseInt(formData.expected_shelf_life_days)
          : null,
        quality_grade: formData.quality_grade || null,
        is_organic: formData.is_organic,
        certifications: formData.certifications ? formData.certifications.split(",").map((c) => c.trim()) : [],
        storage_location: formData.storage_location || null,
        storage_temperature_celsius: formData.storage_temperature_celsius
          ? Number.parseFloat(formData.storage_temperature_celsius)
          : null,
        storage_conditions: formData.storage_conditions || null,
        status: "harvested",
        current_handler_id: userId,
        notes: formData.notes || null,
      }

      const { data: batch, error: insertError } = await supabase
        .from("harvest_batches")
        .insert(batchData)
        .select()
        .single()

      if (insertError) throw insertError

      // Create initial traceability event
      await supabase.from("traceability_events").insert({
        batch_id: batch.id,
        event_type: "harvest",
        event_date: formData.harvest_date,
        performed_by: userId,
        organization_id: organizationId,
        description: `Harvest batch created for ${formData.crop_type}`,
        quantity_affected_kg: Number.parseFloat(formData.quantity_kg),
      })

      router.push("/dashboard/traceability")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const totalSteps = 3

  return (
    <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="font-poppins text-lg md:text-xl">Register Harvest Batch</CardTitle>
            <CardDescription className="font-inter text-xs md:text-sm">
              Step {step} of {totalSteps}
            </CardDescription>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 md:h-2 w-6 md:w-8 rounded-full ${i + 1 <= step ? "bg-[#39B54A]" : "bg-gray-200"}`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
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
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-poppins font-semibold text-base md:text-lg text-[#000000]">Basic Information</h3>

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
                <Label htmlFor="farm_plot_id" className="font-inter">
                  Farm Plot (Optional)
                </Label>
                <Select
                  value={formData.farm_plot_id}
                  onValueChange={(value) => handleInputChange("farm_plot_id", value)}
                  disabled={!formData.farmer_id}
                >
                  <SelectTrigger className="rounded-[10px] font-inter">
                    <SelectValue placeholder={formData.farmer_id ? "Select farm plot" : "Select farmer first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlots.map((plot) => (
                      <SelectItem key={plot.id} value={plot.id}>
                        {plot.plot_name} ({plot.plot_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crop_type" className="font-inter">
                    Crop Type <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="crop_type"
                    required
                    placeholder="e.g., Maize, Rice, Tomato"
                    value={formData.crop_type}
                    onChange={(e) => handleInputChange("crop_type", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variety" className="font-inter">
                    Variety
                  </Label>
                  <Input
                    id="variety"
                    placeholder="e.g., Yellow Maize, Basmati"
                    value={formData.variety}
                    onChange={(e) => handleInputChange("variety", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="quantity_kg" className="font-inter">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity_kg"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.quantity_kg}
                    onChange={(e) => handleInputChange("quantity_kg", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure" className="font-inter">
                    Unit
                  </Label>
                  <Select
                    value={formData.unit_of_measure}
                    onValueChange={(value) => handleInputChange("unit_of_measure", value)}
                  >
                    <SelectTrigger className="rounded-[10px] font-inter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="tons">tons</SelectItem>
                      <SelectItem value="bags">bags</SelectItem>
                      <SelectItem value="crates">crates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="harvest_date" className="font-inter">
                    Harvest Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="harvest_date"
                    type="date"
                    required
                    value={formData.harvest_date}
                    onChange={(e) => handleInputChange("harvest_date", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_shelf_life_days" className="font-inter">
                    Expected Shelf Life (Days)
                  </Label>
                  <Input
                    id="expected_shelf_life_days"
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.expected_shelf_life_days}
                    onChange={(e) => handleInputChange("expected_shelf_life_days", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Quality & Certifications */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Quality & Certifications</h3>

              <div className="space-y-2">
                <Label htmlFor="quality_grade" className="font-inter">
                  Quality Grade
                </Label>
                <Select
                  value={formData.quality_grade}
                  onValueChange={(value) => handleInputChange("quality_grade", value)}
                >
                  <SelectTrigger className="rounded-[10px] font-inter">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grade A (Premium)</SelectItem>
                    <SelectItem value="B">Grade B (Standard)</SelectItem>
                    <SelectItem value="C">Grade C (Basic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_organic"
                  checked={formData.is_organic}
                  onCheckedChange={(checked) => handleInputChange("is_organic", checked as boolean)}
                />
                <Label htmlFor="is_organic" className="cursor-pointer font-inter">
                  Organic Certified
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications" className="font-inter">
                  Certifications (comma-separated)
                </Label>
                <Input
                  id="certifications"
                  placeholder="e.g., GlobalGAP, Organic, Fair Trade"
                  value={formData.certifications}
                  onChange={(e) => handleInputChange("certifications", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_location" className="font-inter">
                  Storage Location
                </Label>
                <Input
                  id="storage_location"
                  placeholder="e.g., Warehouse A, Cold Storage Unit 3"
                  value={formData.storage_location}
                  onChange={(e) => handleInputChange("storage_location", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storage_temperature_celsius" className="font-inter">
                    Storage Temperature (°C)
                  </Label>
                  <Input
                    id="storage_temperature_celsius"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 4.0"
                    value={formData.storage_temperature_celsius}
                    onChange={(e) => handleInputChange("storage_temperature_celsius", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_conditions" className="font-inter">
                    Storage Conditions
                  </Label>
                  <Input
                    id="storage_conditions"
                    placeholder="e.g., Cool, Dry, Ventilated"
                    value={formData.storage_conditions}
                    onChange={(e) => handleInputChange("storage_conditions", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Additional Information */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Additional Information</h3>

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-inter">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  rows={6}
                  placeholder="Add any additional notes about this harvest batch..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              {/* Summary */}
              <div className="bg-[rgba(57,181,74,0.05)] p-4 rounded-[15px] space-y-2">
                <h4 className="font-poppins font-semibold text-[#000000]">Batch Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm font-inter">
                  <div>
                    <span className="text-[rgba(0,0,0,0.45)]">Crop:</span>
                    <span className="ml-2 font-medium text-[#000000]">{formData.crop_type || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[rgba(0,0,0,0.45)]">Quantity:</span>
                    <span className="ml-2 font-medium text-[#000000]">
                      {formData.quantity_kg || "—"} {formData.unit_of_measure}
                    </span>
                  </div>
                  <div>
                    <span className="text-[rgba(0,0,0,0.45)]">Harvest Date:</span>
                    <span className="ml-2 font-medium text-[#000000]">
                      {formData.harvest_date ? new Date(formData.harvest_date).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[rgba(0,0,0,0.45)]">Quality:</span>
                    <span className="ml-2 font-medium text-[#000000]">
                      {formData.quality_grade ? `Grade ${formData.quality_grade}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[10px] text-sm font-inter mt-4">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col md:flex-row justify-between gap-3 mt-6">
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
              className="rounded-[10px] font-inter w-full md:w-auto order-2 md:order-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 1 ? "Cancel" : "Previous"}
            </Button>

            <Button
              type="submit"
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter w-full md:w-auto order-1 md:order-2"
              disabled={isLoading}
            >
              {isLoading ? (
                "Saving..."
              ) : step === totalSteps ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Batch
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
