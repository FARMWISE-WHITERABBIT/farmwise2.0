"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { NIGERIA_STATES, getLGAsForState } from "@/lib/data/nigeria-states-lgas"

interface AgentRegistrationFormProps {
  organizations?: Array<{ id: string; org_name: string }>
  currentUserOrgId?: string
  currentUserRole?: string
}

export function AgentRegistrationForm({
  organizations: initialOrganizations,
  currentUserOrgId,
  currentUserRole,
}: AgentRegistrationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Array<{ id: string; org_name: string }>>(
    initialOrganizations || [],
  )
  const supabase = createBrowserClient()

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    organization_id: currentUserOrgId || "",
    role: "field_agent",
    password: "",
    state: "",
    lga: "",
  })

  const [availableLGAs, setAvailableLGAs] = useState<string[]>([])

  const handleStateChange = (value: string) => {
    const lgas = getLGAsForState(value)
    setAvailableLGAs(lgas)
    setFormData({ ...formData, state: value, lga: "" })
  }

  useEffect(() => {
    if (!initialOrganizations) {
      const fetchOrganizations = async () => {
        const { data } = await supabase.from("organizations").select("id, org_name").eq("is_active", true)
        if (data) {
          setOrganizations(data)
        }
      }
      fetchOrganizations()
    }
  }, [initialOrganizations, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Submitting agent registration:", formData)

      const response = await fetch("/api/agents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      console.log("[v0] Agent registration response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to create agent")
      }

      toast({
        title: "Success",
        description: "Extension agent registered successfully",
      })

      router.push("/dashboard/agents")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Agent registration error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to register agent",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const canSelectOrganization = currentUserRole === "super_admin"

  return (
    <form onSubmit={handleSubmit}>
      <Card className="rounded-[25px] border-none shadow-sm max-w-2xl">
        <CardHeader>
          <CardTitle className="font-poppins text-xl">Agent Information</CardTitle>
          <CardDescription className="font-inter">Enter the details of the extension agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="font-inter text-sm">
                First Name *
              </Label>
              <Input
                id="first_name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="font-inter text-sm">
                Last Name *
              </Label>
              <Input
                id="last_name"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-inter text-sm">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-inter text-sm">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organization_id" className="font-inter text-sm">
                Organization *
              </Label>
              {canSelectOrganization ? (
                <Select
                  value={formData.organization_id}
                  onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
                  required
                >
                  <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.org_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={
                    organizations.find((org) => org.id === formData.organization_id)?.org_name || "Your Organization"
                  }
                  disabled
                  className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-gray-50"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="font-inter text-sm">
                Role *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                required
              >
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_agent">Extension Agent</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="state" className="font-inter text-sm">
                State *
              </Label>
              <Select value={formData.state} onValueChange={handleStateChange} required>
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
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
              <Label htmlFor="lga" className="font-inter text-sm">
                LGA *
              </Label>
              <Select
                value={formData.lga}
                onValueChange={(value) => setFormData({ ...formData, lga: value })}
                required
                disabled={!formData.state}
              >
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
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
            <Label htmlFor="password" className="font-inter text-sm">
              Temporary Password *
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              placeholder="Agent will be asked to change this on first login"
            />
            <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">
              Minimum 6 characters. The agent will be required to change this password on first login.
            </p>
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
              Register Agent
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
