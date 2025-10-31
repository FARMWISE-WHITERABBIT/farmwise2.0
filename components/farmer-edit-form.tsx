"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { NIGERIA_STATES, getLGAsForState, getWardsForLGA } from "@/lib/data/nigeria-states-lgas"

interface FarmerEditFormProps {
  farmer: any
  userId: string
}

export default function FarmerEditForm({ farmer, userId }: FarmerEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableLGAs, setAvailableLGAs] = useState<string[]>(() => {
    return farmer.state ? getLGAsForState(farmer.state) : []
  })
  const [availableWards, setAvailableWards] = useState<string[]>(() => {
    return farmer.lga ? getWardsForLGA(farmer.lga) : []
  })

  const [formData, setFormData] = useState({
    first_name: farmer.first_name || "",
    last_name: farmer.last_name || "",
    primary_phone: farmer.primary_phone || "",
    alternate_phone: farmer.alternate_phone || "",
    email: farmer.email || "",
    date_of_birth: farmer.date_of_birth || "",
    gender: farmer.gender || "",
    state: farmer.state || "",
    lga: farmer.lga || "",
    ward: farmer.ward || farmer.city_town || "",
    residential_address: farmer.residential_address || "",
    bvn: farmer.bvn || "",
    nin: farmer.nin || "",
    total_farm_area_hectares: farmer.total_farm_area_hectares || "",
    farming_experience_years: farmer.farming_experience_years || "",
    land_ownership_type: farmer.land_ownership_type || "",
    farming_method: farmer.farming_method || "",
    irrigation_available: farmer.irrigation_available || false,
  })

  const handleInputChange = (field: string, value: any) => {
    if (field === "state") {
      const lgas = getLGAsForState(value as string)
      setAvailableLGAs(lgas)
      setFormData((prev) => ({ ...prev, [field]: value, lga: "", ward: "" }))
      setAvailableWards([])
    } else if (field === "lga") {
      const wards = getWardsForLGA(value as string)
      setAvailableWards(wards)
      setFormData((prev) => ({ ...prev, [field]: value, ward: "" }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from("farmers")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          primary_phone: formData.primary_phone,
          alternate_phone: formData.alternate_phone || null,
          email: formData.email || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          state: formData.state,
          lga: formData.lga,
          ward: formData.ward || null,
          residential_address: formData.residential_address || null,
          bvn: formData.bvn || null,
          nin: formData.nin || null,
          total_farm_area_hectares: formData.total_farm_area_hectares || null,
          farming_experience_years: formData.farming_experience_years || null,
          land_ownership_type: formData.land_ownership_type || null,
          farming_method: formData.farming_method || null,
          irrigation_available: formData.irrigation_available,
          updated_at: new Date().toISOString(),
        })
        .eq("id", farmer.id)

      if (updateError) throw updateError

      router.push(`/dashboard/farmers/${farmer.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="rounded-[25px] border-none shadow-sm">
      <CardHeader>
        <CardTitle className="font-poppins text-xl">Farmer Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-poppins font-semibold text-lg">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className="rounded-[10px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className="rounded-[10px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_phone">
                  Primary Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="primary_phone"
                  type="tel"
                  required
                  value={formData.primary_phone}
                  onChange={(e) => handleInputChange("primary_phone", e.target.value)}
                  className="rounded-[10px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternate_phone">Alternate Phone</Label>
                <Input
                  id="alternate_phone"
                  type="tel"
                  value={formData.alternate_phone}
                  onChange={(e) => handleInputChange("alternate_phone", e.target.value)}
                  className="rounded-[10px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="rounded-[10px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  className="rounded-[10px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="font-poppins font-semibold text-lg">Location Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)} required>
                  <SelectTrigger className="rounded-[10px]">
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
                <Label htmlFor="lga">
                  LGA <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.lga}
                  onValueChange={(value) => handleInputChange("lga", value)}
                  required
                  disabled={!formData.state}
                >
                  <SelectTrigger className="rounded-[10px]">
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

              <div className="space-y-2">
                <Label htmlFor="ward">Ward</Label>
                <Select
                  value={formData.ward}
                  onValueChange={(value) => handleInputChange("ward", value)}
                  disabled={!formData.lga}
                >
                  <SelectTrigger className="rounded-[10px]">
                    <SelectValue placeholder={formData.lga ? "Select ward" : "Select LGA first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWards.map((ward) => (
                      <SelectItem key={ward} value={ward}>
                        {ward}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residential_address">Full Address</Label>
              <Input
                id="residential_address"
                value={formData.residential_address}
                onChange={(e) => handleInputChange("residential_address", e.target.value)}
                className="rounded-[10px]"
              />
            </div>
          </div>

          {/* Identification */}
          <div className="space-y-4">
            <h3 className="font-poppins font-semibold text-lg">Identification</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bvn">BVN</Label>
                <Input
                  id="bvn"
                  value={formData.bvn}
                  onChange={(e) => handleInputChange("bvn", e.target.value)}
                  className="rounded-[10px]"
                  maxLength={11}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nin">NIN</Label>
                <Input
                  id="nin"
                  value={formData.nin}
                  onChange={(e) => handleInputChange("nin", e.target.value)}
                  className="rounded-[10px]"
                  maxLength={11}
                />
              </div>
            </div>
          </div>

          {/* Farm Information */}
          <div className="space-y-4">
            <h3 className="font-poppins font-semibold text-lg">Farm Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_farm_area_hectares">Total Farm Area (Hectares)</Label>
                <Input
                  id="total_farm_area_hectares"
                  type="number"
                  step="0.01"
                  value={formData.total_farm_area_hectares}
                  onChange={(e) => handleInputChange("total_farm_area_hectares", e.target.value)}
                  className="rounded-[10px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farming_experience_years">Farming Experience (Years)</Label>
                <Input
                  id="farming_experience_years"
                  type="number"
                  value={formData.farming_experience_years}
                  onChange={(e) => handleInputChange("farming_experience_years", e.target.value)}
                  className="rounded-[10px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="land_ownership_type">Land Ownership Type</Label>
                <Select
                  value={formData.land_ownership_type}
                  onValueChange={(value) => handleInputChange("land_ownership_type", value)}
                >
                  <SelectTrigger className="rounded-[10px]">
                    <SelectValue placeholder="Select ownership type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">Owned</SelectItem>
                    <SelectItem value="leased">Leased</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="communal">Communal</SelectItem>
                    <SelectItem value="family">Family Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farming_method">Farming Method</Label>
                <Select
                  value={formData.farming_method}
                  onValueChange={(value) => handleInputChange("farming_method", value)}
                >
                  <SelectTrigger className="rounded-[10px]">
                    <SelectValue placeholder="Select farming method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="conventional">Conventional</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="sustainable">Sustainable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="irrigation_available"
                checked={formData.irrigation_available}
                onChange={(e) => handleInputChange("irrigation_available", e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="irrigation_available" className="cursor-pointer">
                Irrigation Available
              </Label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[10px] text-sm">{error}</div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="rounded-[10px]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px]"
              disabled={isLoading}
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
