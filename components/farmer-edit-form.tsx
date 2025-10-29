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
import { NIGERIAN_STATES } from "@/lib/data/nigeria-states-lgas"

interface FarmerEditFormProps {
  farmer: any
  userId: string
}

export default function FarmerEditForm({ farmer, userId }: FarmerEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: farmer.first_name || "",
    last_name: farmer.last_name || "",
    primary_phone: farmer.primary_phone || "",
    secondary_phone: farmer.secondary_phone || "",
    email: farmer.email || "",
    date_of_birth: farmer.date_of_birth || "",
    gender: farmer.gender || "",
    state: farmer.state || "",
    lga: farmer.lga || "",
    community: farmer.community || "",
    address: farmer.address || "",
    bvn: farmer.bvn || "",
    nin: farmer.nin || "",
  })

  const selectedState = NIGERIAN_STATES.find((s) => s.state === formData.state)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      // Reset LGA when state changes
      if (field === "state") {
        updated.lga = ""
      }
      return updated
    })
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
          secondary_phone: formData.secondary_phone || null,
          email: formData.email || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          state: formData.state,
          lga: formData.lga,
          community: formData.community || null,
          address: formData.address || null,
          bvn: formData.bvn || null,
          nin: formData.nin || null,
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
                <Label htmlFor="secondary_phone">Secondary Phone</Label>
                <Input
                  id="secondary_phone"
                  type="tel"
                  value={formData.secondary_phone}
                  onChange={(e) => handleInputChange("secondary_phone", e.target.value)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)} required>
                  <SelectTrigger className="rounded-[10px]">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state.state} value={state.state}>
                        {state.state}
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
                    <SelectValue placeholder="Select LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedState?.lgas.map((lga) => (
                      <SelectItem key={lga} value={lga}>
                        {lga}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community">Community/Village</Label>
              <Input
                id="community"
                value={formData.community}
                onChange={(e) => handleInputChange("community", e.target.value)}
                className="rounded-[10px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
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
