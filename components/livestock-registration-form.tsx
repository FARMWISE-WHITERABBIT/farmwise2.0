"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

const LIVESTOCK_TYPES = [
  { value: "cattle", label: "Cattle" },
  { value: "poultry", label: "Poultry (Chickens, Ducks, etc.)" },
  { value: "goats", label: "Goats" },
  { value: "sheep", label: "Sheep" },
  { value: "pigs", label: "Pigs" },
  { value: "rabbits", label: "Rabbits" },
  { value: "fish", label: "Fish" },
  { value: "other", label: "Other" },
]

const HEALTH_STATUS = [
  { value: "healthy", label: "Healthy" },
  { value: "sick", label: "Sick" },
  { value: "under_treatment", label: "Under Treatment" },
  { value: "quarantined", label: "Quarantined" },
]

const VACCINATION_STATUS = [
  { value: "vaccinated", label: "Vaccinated" },
  { value: "not_vaccinated", label: "Not Vaccinated" },
  { value: "partial", label: "Partially Vaccinated" },
]

const PURPOSE = [
  { value: "meat", label: "Meat Production" },
  { value: "dairy", label: "Dairy Production" },
  { value: "eggs", label: "Egg Production" },
  { value: "breeding", label: "Breeding" },
  { value: "draft", label: "Draft/Work" },
  { value: "mixed", label: "Mixed Purpose" },
]

const HOUSING_TYPES = [
  { value: "barn", label: "Barn" },
  { value: "coop", label: "Coop" },
  { value: "pen", label: "Pen" },
  { value: "pasture", label: "Pasture/Free Range" },
  { value: "pond", label: "Pond" },
  { value: "cage", label: "Cage" },
  { value: "other", label: "Other" },
]

interface LivestockRegistrationFormProps {
  farmerId: string
  farmerName?: string
  onSuccess?: () => void
}

export function LivestockRegistrationForm({ farmerId, farmerName, onSuccess }: LivestockRegistrationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    livestock_type: "",
    breed: "",
    tag_number: "",
    quantity: "1",
    age_months: "",
    gender: "",
    health_status: "healthy",
    vaccination_status: "not_vaccinated",
    last_vaccination_date: "",
    purpose: "",
    housing_type: "",
    acquisition_date: "",
    acquisition_cost: "",
    current_market_value: "",
    feed_type: "",
    daily_feed_cost: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user and organization
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: userData } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

      // Prepare livestock data
      const livestockData = {
        farmer_id: farmerId,
        organization_id: userData?.organization_id,
        livestock_type: formData.livestock_type,
        breed: formData.breed || null,
        tag_number: formData.tag_number || null,
        quantity: Number.parseInt(formData.quantity) || 1,
        age_months: formData.age_months ? Number.parseInt(formData.age_months) : null,
        gender: formData.gender || null,
        health_status: formData.health_status,
        vaccination_status: formData.vaccination_status,
        last_vaccination_date: formData.last_vaccination_date || null,
        purpose: formData.purpose || null,
        housing_type: formData.housing_type || null,
        acquisition_date: formData.acquisition_date || null,
        acquisition_cost: formData.acquisition_cost ? Number.parseFloat(formData.acquisition_cost) : null,
        current_market_value: formData.current_market_value ? Number.parseFloat(formData.current_market_value) : null,
        feed_type: formData.feed_type || null,
        daily_feed_cost: formData.daily_feed_cost ? Number.parseFloat(formData.daily_feed_cost) : null,
        notes: formData.notes || null,
        created_by: user.id,
      }

      const { error } = await supabase.from("livestock").insert(livestockData)

      if (error) throw error

      toast.success("Livestock registered successfully!")

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/farmers/${farmerId}`)
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error registering livestock:", error)
      toast.error(error.message || "Failed to register livestock")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {farmerName && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Registering livestock for:</strong> {farmerName}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="livestock_type">
                Livestock Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.livestock_type}
                onValueChange={(value) => setFormData({ ...formData, livestock_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select livestock type" />
                </SelectTrigger>
                <SelectContent>
                  {LIVESTOCK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="e.g., Holstein, Rhode Island Red"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag_number">Tag/ID Number</Label>
              <Input
                id="tag_number"
                value={formData.tag_number}
                onChange={(e) => setFormData({ ...formData, tag_number: e.target.value })}
                placeholder="Unique identifier"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age_months">Age (months)</Label>
              <Input
                id="age_months"
                type="number"
                min="0"
                value={formData.age_months}
                onChange={(e) => setFormData({ ...formData, age_months: e.target.value })}
                placeholder="Age in months"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="mixed">Mixed (for groups)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Health & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="health_status">Health Status</Label>
              <Select
                value={formData.health_status}
                onValueChange={(value) => setFormData({ ...formData, health_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vaccination_status">Vaccination Status</Label>
              <Select
                value={formData.vaccination_status}
                onValueChange={(value) => setFormData({ ...formData, vaccination_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VACCINATION_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_vaccination_date">Last Vaccination Date</Label>
              <Input
                id="last_vaccination_date"
                type="date"
                value={formData.last_vaccination_date}
                onChange={(e) => setFormData({ ...formData, last_vaccination_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Select value={formData.purpose} onValueChange={(value) => setFormData({ ...formData, purpose: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSE.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Housing & Care</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="housing_type">Housing Type</Label>
              <Select
                value={formData.housing_type}
                onValueChange={(value) => setFormData({ ...formData, housing_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select housing type" />
                </SelectTrigger>
                <SelectContent>
                  {HOUSING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed_type">Feed Type</Label>
              <Input
                id="feed_type"
                value={formData.feed_type}
                onChange={(e) => setFormData({ ...formData, feed_type: e.target.value })}
                placeholder="e.g., Grass, Commercial feed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_feed_cost">Daily Feed Cost (₦)</Label>
              <Input
                id="daily_feed_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.daily_feed_cost}
                onChange={(e) => setFormData({ ...formData, daily_feed_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisition_date">Acquisition Date</Label>
              <Input
                id="acquisition_date"
                type="date"
                value={formData.acquisition_date}
                onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional information about the livestock..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4 pb-20 md:pb-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-[#39B54A] hover:bg-[#2D5016]">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Livestock
        </Button>
      </div>
    </form>
  )
}
