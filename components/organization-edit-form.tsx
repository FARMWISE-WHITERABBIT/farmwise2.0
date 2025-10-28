"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface OrganizationEditFormProps {
  organization: any
}

export function OrganizationEditForm({ organization }: OrganizationEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    org_name: organization.org_name || "",
    org_type: organization.org_type || "",
    contact_email: organization.contact_email || "",
    contact_phone: organization.contact_phone || "",
    address: organization.address || "",
    state: organization.state || "",
    country: organization.country || "Nigeria",
    subscription_tier: organization.subscription_tier || "basic",
    max_users: organization.max_users || 10,
    is_active: organization.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update organization")
      }

      toast({
        title: "Success",
        description: "Organization updated successfully",
      })

      router.push(`/dashboard/organizations/${organization.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <Button type="button" asChild variant="ghost" className="text-muted-foreground hover:text-foreground -ml-2">
          <Link href={`/dashboard/organizations/${organization.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organization
          </Link>
        </Button>
      </div>

      <Card className="rounded-[25px] border-0 shadow-sm max-w-2xl">
        <CardHeader>
          <CardTitle className="font-poppins text-xl">Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="org_name" className="font-inter text-sm">
              Organization Name *
            </Label>
            <Input
              id="org_name"
              required
              value={formData.org_name}
              onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
              className="rounded-[10px] border-border font-inter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org_type" className="font-inter text-sm">
              Organization Type *
            </Label>
            <Select
              value={formData.org_type}
              onValueChange={(value) => setFormData({ ...formData, org_type: value })}
              required
            >
              <SelectTrigger className="rounded-[10px] border-border font-inter">
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
                className="rounded-[10px] border-border font-inter"
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
                className="rounded-[10px] border-border font-inter"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="font-inter text-sm">
              Address *
            </Label>
            <Input
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="rounded-[10px] border-border font-inter"
            />
          </div>

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
                className="rounded-[10px] border-border font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="font-inter text-sm">
                Country *
              </Label>
              <Input
                id="country"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="rounded-[10px] border-border font-inter"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subscription_tier" className="font-inter text-sm">
                Subscription Tier *
              </Label>
              <Select
                value={formData.subscription_tier}
                onValueChange={(value) => setFormData({ ...formData, subscription_tier: value })}
                required
              >
                <SelectTrigger className="rounded-[10px] border-border font-inter">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_users" className="font-inter text-sm">
                Max Users *
              </Label>
              <Input
                id="max_users"
                type="number"
                required
                min="1"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: Number.parseInt(e.target.value) })}
                className="rounded-[10px] border-border font-inter"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_active" className="font-inter text-sm">
              Status *
            </Label>
            <Select
              value={formData.is_active ? "active" : "inactive"}
              onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
              required
            >
              <SelectTrigger className="rounded-[10px] border-border font-inter">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="rounded-[10px] border-border font-inter"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
