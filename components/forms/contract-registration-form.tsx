"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface ContractRegistrationFormProps {
  contractId: string
  contract: any
  farmerProfile: any
  allFarmers: any[] | null
  userRole: string
}

export default function ContractRegistrationForm({
  contractId,
  contract,
  farmerProfile,
  allFarmers,
  userRole,
}: ContractRegistrationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedFarmerId, setSelectedFarmerId] = useState(farmerProfile?.id || "")
  const [formData, setFormData] = useState({
    proposed_quantity_kg: "",
    proposed_delivery_date: "",
    farmer_notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createBrowserClient()

      // Determine which farmer to register
      const farmerId = userRole === "field_agent" ? selectedFarmerId : farmerProfile?.id

      if (!farmerId) {
        setError("Please select a farmer")
        setLoading(false)
        return
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        setLoading(false)
        return
      }

      // Check if registration already exists
      const { data: existingReg } = await supabase
        .from("contract_registrations")
        .select("id")
        .eq("contract_id", contractId)
        .eq("farmer_id", farmerId)
        .single()

      if (existingReg) {
        setError("This farmer has already registered for this contract")
        setLoading(false)
        return
      }

      // Create registration
      const { error: insertError } = await supabase.from("contract_registrations").insert({
        contract_id: contractId,
        farmer_id: farmerId,
        registered_by: user.id,
        registration_type: userRole === "farmer" ? "farmer_applied" : "agent_registered",
        proposed_quantity_kg: Number.parseFloat(formData.proposed_quantity_kg) || null,
        proposed_delivery_date: formData.proposed_delivery_date || null,
        farmer_notes: formData.farmer_notes || null,
        status: "pending",
      })

      if (insertError) {
        console.error("[v0] Registration error:", insertError)
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Success - redirect
      router.push("/dashboard/contracts/available?success=true")
    } catch (err: any) {
      console.error("[v0] Unexpected error:", err)
      setError(err.message || "An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-[25px] border-none shadow-sm">
      <CardHeader>
        <CardTitle className="font-poppins text-lg">Registration Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Farmer Selection (for extension agents) */}
          {userRole === "field_agent" && allFarmers && (
            <div className="space-y-2">
              <Label htmlFor="farmer" className="font-inter text-sm">
                Select Farmer <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedFarmerId} onValueChange={setSelectedFarmerId} required>
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                  <SelectValue placeholder="Choose a farmer" />
                </SelectTrigger>
                <SelectContent>
                  {allFarmers.map((farmer) => (
                    <SelectItem key={farmer.id} value={farmer.id}>
                      {farmer.first_name} {farmer.last_name} ({farmer.farmer_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Farmer Info Display (for farmers) */}
          {userRole === "farmer" && farmerProfile && (
            <div className="p-4 bg-[rgba(57,181,74,0.05)] rounded-[10px]">
              <p className="text-sm font-inter text-[rgba(0,0,0,0.65)]">Applying as:</p>
              <p className="font-semibold font-inter text-[#000000]">
                {farmerProfile.first_name} {farmerProfile.last_name}
              </p>
              <p className="text-xs font-inter text-[rgba(0,0,0,0.65)]">Farmer ID: {farmerProfile.farmer_id}</p>
            </div>
          )}

          {/* Proposed Quantity */}
          <div className="space-y-2">
            <Label htmlFor="proposed_quantity_kg" className="font-inter text-sm">
              Proposed Quantity (kg) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="proposed_quantity_kg"
              type="number"
              step="0.01"
              placeholder="Enter quantity in kilograms"
              value={formData.proposed_quantity_kg}
              onChange={(e) => setFormData({ ...formData, proposed_quantity_kg: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              required
            />
            <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">
              Contract requires: {contract.quantity_kg?.toLocaleString()} kg
            </p>
          </div>

          {/* Proposed Delivery Date */}
          <div className="space-y-2">
            <Label htmlFor="proposed_delivery_date" className="font-inter text-sm">
              Proposed Delivery Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="proposed_delivery_date"
              type="date"
              value={formData.proposed_delivery_date}
              onChange={(e) => setFormData({ ...formData, proposed_delivery_date: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              required
            />
            <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">
              Contract delivery date: {new Date(contract.delivery_date || contract.end_date).toLocaleDateString()}
            </p>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="farmer_notes" className="font-inter text-sm">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="farmer_notes"
              placeholder="Add any additional information about your application..."
              value={formData.farmer_notes}
              onChange={(e) => setFormData({ ...formData, farmer_notes: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter min-h-[100px]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-[10px]">
              <p className="text-sm text-red-700 font-inter">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
