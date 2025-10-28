"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ExtensionAgentFormProps {
  currentUser: any
  organizations: Array<{ id: string; org_name: string }>
}

export function ExtensionAgentForm({ currentUser, organizations }: ExtensionAgentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    location: "",
    organization_id: currentUser.role === "super_admin" ? "" : currentUser.organization_id,
    role: "field_agent",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Creating extension agent:", formData)

      const response = await fetch("/api/agents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      console.log("[v0] Extension agent creation response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to create extension agent")
      }

      toast({
        title: "Success",
        description: "Extension agent registered successfully",
      })

      router.push("/dashboard/extension-agents")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Extension agent registration error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to register extension agent",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="rounded-[25px] border-0 shadow-sm max-w-3xl">
        <CardHeader>
          <CardTitle className="font-poppins text-xl">Agent Information</CardTitle>
          <CardDescription className="font-inter">Enter the details of the extension agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentUser.role === "super_admin" && (
            <div className="space-y-2">
              <Label htmlFor="organization_id" className="font-inter text-sm">
                Organization *
              </Label>
              <Select
                required
                value={formData.organization_id}
                onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
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
            </div>
          )}

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
                placeholder="Agent will change on first login"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-inter text-sm">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="font-inter text-sm">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                placeholder="City, State"
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
              Register Agent
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
