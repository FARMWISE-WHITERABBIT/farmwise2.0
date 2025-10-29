"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react"
import { PhotoUpload } from "@/components/photo-upload"
import { CropSelector } from "@/components/crop-selector"
import { useToast } from "@/hooks/use-toast"
import { NIGERIA_STATES, getLGAsForState } from "@/lib/data/nigeria-states-lgas"

interface FarmerRegistrationFormProps {
  userId: string
}

interface CropWithHectares {
  category: string
  crop: string
  hectares: number
}

export function FarmerRegistrationForm({ userId }: FarmerRegistrationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [availableLGAs, setAvailableLGAs] = useState<string[]>([])
  const [selectedCrops, setSelectedCrops] = useState<CropWithHectares[]>([])

  const [formData, setFormData] = useState({
    // Personal Information
    title: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    marital_status: "",

    // Contact Information
    primary_phone: "",
    alternate_phone: "",
    email: "",
    whatsapp_number: "",

    // Address
    residential_address: "",
    city_town: "",
    lga: "",
    state: "",
    nearest_landmark: "",

    // Identification
    bvn: "",
    nin: "",

    // Banking
    bank_name: "",
    account_number: "",
    account_name: "",

    // Farm Details
    total_farm_area_hectares: "", // This will be calculated from selectedCrops if used, otherwise entered manually
    land_ownership_type: "",
    // primary_crops: "", // Replaced by selectedCrops
    farming_method: "",
    irrigation_available: false,

    // Emergency Contact
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",

    // Additional
    notes: "",

    // Profile Photo
    profile_photo_url: "",
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "state") {
      const lgas = getLGAsForState(value as string)
      setAvailableLGAs(lgas)
      setFormData((prev) => ({ ...prev, [field]: value, lga: "" }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    console.log("[v0] Starting farmer registration...")

    try {
      const supabase = createClient()

      console.log("[v0] Fetching user organization...")
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("[v0] Error fetching user data:", userError)
        throw userError
      }

      console.log("[v0] User organization:", userData?.organization_id)

      const farmerIdPrefix = `FW-${formData.state.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}`
      const randomNum = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0")
      const farmerId = `${farmerIdPrefix}-${randomNum}`

      console.log("[v0] Generated farmer ID:", farmerId)

      const primaryCrops = selectedCrops.map((c) => c.crop)

      const farmerData = {
        farmer_id: farmerId,
        organization_id: userData?.organization_id,
        title: formData.title,
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        marital_status: formData.marital_status || null,
        primary_phone: formData.primary_phone,
        alternate_phone: formData.alternate_phone || null,
        email: formData.email || null,
        whatsapp_number: formData.whatsapp_number || null,
        residential_address: formData.residential_address || null,
        city_town: formData.city_town || null,
        lga: formData.lga,
        state: formData.state,
        nearest_landmark: formData.nearest_landmark || null,
        bvn: formData.bvn || null,
        nin: formData.nin || null,
        bank_name: formData.bank_name || null,
        account_number: formData.account_number || null,
        account_name: formData.account_name || null,
        total_farm_area_hectares:
          selectedCrops.length > 0
            ? selectedCrops.reduce((sum, crop) => sum + crop.hectares, 0)
            : formData.total_farm_area_hectares
              ? Number.parseFloat(formData.total_farm_area_hectares)
              : null,
        land_ownership_type: formData.land_ownership_type || null,
        primary_crops: primaryCrops,
        farming_method: formData.farming_method || null,
        irrigation_available: formData.irrigation_available,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relationship: formData.emergency_contact_relationship || null,
        notes: formData.notes || null,
        registered_by: userId,
        assigned_agent_id: userId, // Automatically assign to the registering agent
        registration_source: "field_agent",
        profile_photo_url: formData.profile_photo_url || null,
        registration_date: new Date().toISOString().split("T")[0],
        verification_status: formData.primary_phone ? "phone_verified" : "unverified",
      }

      console.log("[v0] Inserting farmer data:", farmerData)

      const { error: insertError } = await supabase.from("farmers").insert(farmerData)

      if (insertError) {
        console.error("[v0] Error inserting farmer:", insertError)
        throw insertError
      }

      console.log("[v0] Farmer registered successfully")

      toast({
        title: "Success",
        description: `Farmer ${formData.first_name} ${formData.last_name} registered successfully`,
      })

      // Redirect to the field agent dashboard
      router.push("/dashboard/field-agent")
      router.refresh()
    } catch (err) {
      console.error("[v0] Farmer registration error:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to register farmer",
        variant: "destructive",
      })
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
            <CardTitle className="font-poppins text-xl">Farmer Registration</CardTitle>
            <CardDescription className="font-inter">
              Step {step} of {totalSteps}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${i + 1 <= step ? "bg-[#39B54A]" : "bg-[rgba(0,0,0,0.12)]"}`}
              />
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
          className="pb-24 md:pb-24 lg:pb-8"
        >
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg font-poppins text-[rgba(0,0,0,0.87)]">Personal Information</h3>

              <div className="space-y-2">
                <Label className="font-inter">Profile Photo</Label>
                <PhotoUpload
                  label="Capture or upload farmer photo"
                  value={formData.profile_photo_url}
                  onChange={(url) => handleInputChange("profile_photo_url", url)}
                  onRemove={() => handleInputChange("profile_photo_url", "")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-inter">
                    Title
                  </Label>
                  <Select value={formData.title} onValueChange={(value) => handleInputChange("title", value)}>
                    <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.23)]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Chief">Chief</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="first_name" className="font-inter">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="middle_name" className="font-inter">
                    Middle Name
                  </Label>
                  <Input
                    id="middle_name"
                    value={formData.middle_name}
                    onChange={(e) => handleInputChange("middle_name", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="font-inter">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="font-inter">
                    Date of Birth
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="font-inter">
                    Gender
                  </Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.23)]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marital_status" className="font-inter">
                    Marital Status
                  </Label>
                  <Select
                    value={formData.marital_status}
                    onValueChange={(value) => handleInputChange("marital_status", value)}
                  >
                    <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.23)]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Address */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg font-poppins text-[rgba(0,0,0,0.87)]">
                Contact & Address Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_phone" className="font-inter">
                    Primary Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="primary_phone"
                    type="tel"
                    required
                    placeholder="+234..."
                    value={formData.primary_phone}
                    onChange={(e) => handleInputChange("primary_phone", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternate_phone" className="font-inter">
                    Alternate Phone
                  </Label>
                  <Input
                    id="alternate_phone"
                    type="tel"
                    placeholder="+234..."
                    value={formData.alternate_phone}
                    onChange={(e) => handleInputChange("alternate_phone", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-inter">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number" className="font-inter">
                    WhatsApp Number
                  </Label>
                  <Input
                    id="whatsapp_number"
                    type="tel"
                    placeholder="+234..."
                    value={formData.whatsapp_number}
                    onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="residential_address" className="font-inter">
                  Residential Address
                </Label>
                <Textarea
                  id="residential_address"
                  value={formData.residential_address}
                  onChange={(e) => handleInputChange("residential_address", e.target.value)}
                  className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city_town" className="font-inter">
                    City/Town
                  </Label>
                  <Input
                    id="city_town"
                    value={formData.city_town}
                    onChange={(e) => handleInputChange("city_town", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="font-inter">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)} required>
                    <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.23)]">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIA_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lga" className="font-inter">
                    LGA <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.lga}
                    onValueChange={(value) => handleInputChange("lga", value)}
                    required
                    disabled={!formData.state}
                  >
                    <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.23)]">
                      <SelectValue placeholder={formData.state ? "Select LGA" : "Select state first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLGAs.map((lga) => (
                        <SelectItem key={lga} value={lga}>
                          {lga}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nearest_landmark" className="font-inter">
                  Nearest Landmark
                </Label>
                <Input
                  id="nearest_landmark"
                  value={formData.nearest_landmark}
                  onChange={(e) => handleInputChange("nearest_landmark", e.target.value)}
                  className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                />
              </div>
            </div>
          )}

          {/* Step 3: Identification & Banking */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg font-poppins text-[rgba(0,0,0,0.87)]">Identification & Banking</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bvn" className="font-inter">
                    BVN (Bank Verification Number)
                  </Label>
                  <Input
                    id="bvn"
                    value={formData.bvn}
                    onChange={(e) => handleInputChange("bvn", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                    maxLength={11}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nin" className="font-inter">
                    NIN (National Identification Number)
                  </Label>
                  <Input
                    id="nin"
                    value={formData.nin}
                    onChange={(e) => handleInputChange("nin", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                    maxLength={11}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name" className="font-inter">
                  Bank Name
                </Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange("bank_name", e.target.value)}
                  className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_number" className="font-inter">
                    Account Number
                  </Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => handleInputChange("account_number", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_name" className="font-inter">
                    Account Name
                  </Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => handleInputChange("account_name", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>
              </div>

              <h3 className="font-semibold text-lg font-poppins text-[rgba(0,0,0,0.87)] mt-8">Emergency Contact</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name" className="font-inter">
                    Name
                  </Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone" className="font-inter">
                    Phone
                  </Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship" className="font-inter">
                    Relationship
                  </Label>
                  <Input
                    id="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Farm Details */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg font-poppins text-[rgba(0,0,0,0.87)]">Farm Details</h3>

              <div className="space-y-2">
                <Label className="font-inter">
                  Primary Crops <span className="text-red-500">*</span>
                </Label>
                <CropSelector value={selectedCrops} onChange={setSelectedCrops} />
              </div>

              {/* Removed total_farm_area_hectares input as it's now calculated from selectedCrops */}
              {/* If manual entry is still desired for cases where crops aren't selected, this can be re-added */}
              {/*
              <div className="space-y-2">
                <Label htmlFor="total_farm_area_hectares" className="font-inter">
                  Total Farm Area (Hectares)
                </Label>
                <Input
                  id="total_farm_area_hectares"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_farm_area_hectares}
                  onChange={(e) => handleInputChange("total_farm_area_hectares", e.target.value)}
                  className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                />
              </div>
              */}

              <div className="space-y-2">
                <Label htmlFor="land_ownership_type" className="font-inter">
                  Land Ownership Type
                </Label>
                <Select
                  value={formData.land_ownership_type}
                  onValueChange={(value) => handleInputChange("land_ownership_type", value)}
                >
                  <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.23)]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">Owned</SelectItem>
                    <SelectItem value="leased">Leased</SelectItem>
                    <SelectItem value="family_land">Family Land</SelectItem>
                    <SelectItem value="communal">Communal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farming_method" className="font-inter">
                  Farming Method
                </Label>
                <Select
                  value={formData.farming_method}
                  onValueChange={(value) => handleInputChange("farming_method", value)}
                >
                  <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.23)]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traditional">Traditional</SelectItem>
                    <SelectItem value="improved">Improved</SelectItem>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="irrigation_available"
                  checked={formData.irrigation_available}
                  onCheckedChange={(checked) => handleInputChange("irrigation_available", checked as boolean)}
                  className="border-[rgba(0,0,0,0.23)]"
                />
                <Label htmlFor="irrigation_available" className="cursor-pointer font-inter">
                  Irrigation Available
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-inter">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  placeholder="Any additional information about the farmer..."
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[rgba(0,0,0,0.12)]">
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
              className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
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
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : step === totalSteps ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Farmer
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
