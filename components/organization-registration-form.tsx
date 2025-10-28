"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOrganization } from "@/app/actions/create-organization"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function OrganizationRegistrationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    org_name: "",
    org_type: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    state: "",
    country: "Nigeria",
    subscription_tier: "basic",
    max_users: 5,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createOrganization(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: "Organization registered successfully",
      })

      router.push("/dashboard/organizations")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Organization registration error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to register organization",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="rounded-[25px] border-none shadow-sm max-w-3xl">
        <CardHeader>
          <CardTitle className="font-poppins text-xl">Organization Information</CardTitle>
          <CardDescription className="font-inter">Enter the details of the organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org_name" className="font-inter text-sm">
                Organization Name *
              </Label>
              <Input
                id="org_name"
                required
                value={formData.org_name}
                onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org_type" className="font-inter text-sm">
                Organization Type *
              </Label>
              <Select
                required
                value={formData.org_type}
                onValueChange={(value) => setFormData({ ...formData, org_type: value })}
              >
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Government Agency</SelectItem>
                  <SelectItem value="cooperative">Cooperative</SelectItem>
                  <SelectItem value="ngo">NGO</SelectItem>
                  <SelectItem value="private_aggregator">Commodity Aggregator</SelectItem>
                  <SelectItem value="research">Research Institution</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="font-inter text-sm">
                Contact Email *
              </Label>
              <Input
                id="contact_email"
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="font-inter text-sm">
                Contact Phone *
              </Label>
              <Input
                id="contact_phone"
                type="tel"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="font-inter text-sm">
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="state" className="font-inter text-sm">
                State *
              </Label>
              <Input
                id="state"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="font-inter text-sm">
                Country
              </Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </div>

          {/* Subscription */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subscription_tier" className="font-inter text-sm">
                Subscription Tier
              </Label>
              <Select
                value={formData.subscription_tier}
                onValueChange={(value) => setFormData({ ...formData, subscription_tier: value })}
              >
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_users" className="font-inter text-sm">
                Maximum Users
              </Label>
              <Input
                id="max_users"
                type="number"
                min="1"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: Number.parseInt(e.target.value) })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
