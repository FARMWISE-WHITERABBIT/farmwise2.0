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

interface ContractCreationFormProps {
  userId: string
  organizationId: string
}

export default function ContractCreationForm({ userId, organizationId }: ContractCreationFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dropdown data
  const [farmers, setFarmers] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    // Parties
    farmer_id: "",
    buyer_organization_id: "",

    // Contract details
    contract_type: "offtake",
    title: "",
    description: "",

    // Product
    crop_type: "",
    variety: "",
    quantity_kg: "",
    unit_of_measure: "kg",
    quality_specifications: "",

    // Financial terms
    price_per_unit: "",
    currency: "NGN",
    payment_terms: "",
    advance_payment_percentage: "0",

    // Timeline
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    delivery_date: "",

    // Terms
    terms_and_conditions: "",
    penalties_for_breach: "",
    dispute_resolution: "",

    // Additional
    notes: "",
  })

  // Load farmers and organizations
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

      // Load organizations (potential buyers)
      const { data: orgsData } = await supabase.from("organizations").select("id, org_name, org_type").order("org_name")

      if (orgsData) setOrganizations(orgsData)
    }

    loadData()
  }, [organizationId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Calculate total contract value
  const calculateTotalValue = () => {
    const quantity = Number.parseFloat(formData.quantity_kg) || 0
    const price = Number.parseFloat(formData.price_per_unit) || 0
    return quantity * price
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const totalValue = calculateTotalValue()

      // Prepare data
      const contractData = {
        farmer_id: formData.farmer_id,
        buyer_organization_id: formData.buyer_organization_id || null,
        organization_id: organizationId,
        contract_type: formData.contract_type,
        title: formData.title,
        description: formData.description || null,
        crop_type: formData.crop_type || null,
        variety: formData.variety || null,
        quantity_kg: formData.quantity_kg ? Number.parseFloat(formData.quantity_kg) : null,
        unit_of_measure: formData.unit_of_measure,
        quality_specifications: formData.quality_specifications || null,
        price_per_unit: Number.parseFloat(formData.price_per_unit),
        total_contract_value: totalValue,
        currency: formData.currency,
        payment_terms: formData.payment_terms || null,
        advance_payment_percentage: formData.advance_payment_percentage
          ? Number.parseFloat(formData.advance_payment_percentage)
          : 0,
        start_date: formData.start_date,
        end_date: formData.end_date,
        delivery_date: formData.delivery_date || null,
        status: "draft",
        created_by: userId,
        terms_and_conditions: formData.terms_and_conditions || null,
        penalties_for_breach: formData.penalties_for_breach || null,
        dispute_resolution: formData.dispute_resolution || null,
        notes: formData.notes || null,
      }

      const { error: insertError } = await supabase.from("contracts").insert(contractData)

      if (insertError) throw insertError

      router.push("/dashboard/contracts")
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
            <CardTitle className="font-poppins text-xl">Create Contract</CardTitle>
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
          {/* Step 1: Parties & Contract Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Parties & Contract Type</h3>

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
                <Label htmlFor="buyer_organization_id" className="font-inter">
                  Buyer Organization
                </Label>
                <Select
                  value={formData.buyer_organization_id}
                  onValueChange={(value) => handleInputChange("buyer_organization_id", value)}
                >
                  <SelectTrigger className="rounded-[10px] font-inter">
                    <SelectValue placeholder="Select buyer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.org_name} ({org.org_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_type" className="font-inter">
                  Contract Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(value) => handleInputChange("contract_type", value)}
                  required
                >
                  <SelectTrigger className="rounded-[10px] font-inter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offtake">Offtake Agreement</SelectItem>
                    <SelectItem value="supply">Supply Contract</SelectItem>
                    <SelectItem value="service">Service Agreement</SelectItem>
                    <SelectItem value="lease">Lease Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="font-inter">
                  Contract Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g., Maize Supply Agreement 2025"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-inter">
                  Description
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Brief description of the contract..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>
            </div>
          )}

          {/* Step 2: Product Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Product Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crop_type" className="font-inter">
                    Crop Type
                  </Label>
                  <Input
                    id="crop_type"
                    placeholder="e.g., Maize, Rice, Cassava"
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
                    placeholder="e.g., Yellow Maize"
                    value={formData.variety}
                    onChange={(e) => handleInputChange("variety", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="quantity_kg" className="font-inter">
                    Quantity
                  </Label>
                  <Input
                    id="quantity_kg"
                    type="number"
                    step="0.01"
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

              <div className="space-y-2">
                <Label htmlFor="quality_specifications" className="font-inter">
                  Quality Specifications
                </Label>
                <Textarea
                  id="quality_specifications"
                  rows={3}
                  placeholder="Describe quality requirements, grading standards, etc."
                  value={formData.quality_specifications}
                  onChange={(e) => handleInputChange("quality_specifications", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>
            </div>
          )}

          {/* Step 3: Financial Terms & Timeline */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Financial Terms & Timeline</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_per_unit" className="font-inter">
                    Price Per Unit <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.price_per_unit}
                    onChange={(e) => handleInputChange("price_per_unit", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="font-inter">
                    Currency
                  </Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger className="rounded-[10px] font-inter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.quantity_kg && formData.price_per_unit && (
                <div className="bg-[rgba(57,181,74,0.05)] p-4 rounded-[15px]">
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Total Contract Value</p>
                  <p className="text-2xl font-poppins font-semibold text-[#39B54A] mt-1">
                    {formData.currency} {calculateTotalValue().toLocaleString()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="advance_payment_percentage" className="font-inter">
                  Advance Payment (%)
                </Label>
                <Input
                  id="advance_payment_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.advance_payment_percentage}
                  onChange={(e) => handleInputChange("advance_payment_percentage", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms" className="font-inter">
                  Payment Terms
                </Label>
                <Textarea
                  id="payment_terms"
                  rows={2}
                  placeholder="e.g., 30% advance, 70% on delivery"
                  value={formData.payment_terms}
                  onChange={(e) => handleInputChange("payment_terms", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="font-inter">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="font-inter">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_date" className="font-inter">
                    Delivery Date
                  </Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => handleInputChange("delivery_date", e.target.value)}
                    className="rounded-[10px] font-inter"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Terms & Conditions */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-poppins font-semibold text-lg text-[#000000]">Terms & Conditions</h3>

              <div className="space-y-2">
                <Label htmlFor="terms_and_conditions" className="font-inter">
                  Terms and Conditions
                </Label>
                <Textarea
                  id="terms_and_conditions"
                  rows={4}
                  placeholder="Enter the general terms and conditions of this contract..."
                  value={formData.terms_and_conditions}
                  onChange={(e) => handleInputChange("terms_and_conditions", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="penalties_for_breach" className="font-inter">
                  Penalties for Breach
                </Label>
                <Textarea
                  id="penalties_for_breach"
                  rows={3}
                  placeholder="Specify penalties for contract breach..."
                  value={formData.penalties_for_breach}
                  onChange={(e) => handleInputChange("penalties_for_breach", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispute_resolution" className="font-inter">
                  Dispute Resolution
                </Label>
                <Textarea
                  id="dispute_resolution"
                  rows={3}
                  placeholder="Describe the dispute resolution process..."
                  value={formData.dispute_resolution}
                  onChange={(e) => handleInputChange("dispute_resolution", e.target.value)}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-inter">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Any additional notes or comments..."
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
                  Create Contract
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
