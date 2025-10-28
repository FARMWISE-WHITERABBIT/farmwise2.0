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
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface UserCreationFormProps {
  organizations: Array<{ id: string; org_name: string }>
  currentUserOrgId: string
  currentUserRole: string
  preselectedOrgId?: string
  hasAccess: boolean
}

export function UserCreationForm({
  organizations,
  currentUserOrgId,
  currentUserRole,
  preselectedOrgId,
  hasAccess,
}: UserCreationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    organization_id: preselectedOrgId || currentUserOrgId,
    role: "field_agent",
    password: "",
  })

  if (!hasAccess) {
    return (
      <Card className="rounded-[25px] border-0 shadow-sm border-red-200 bg-red-50 max-w-2xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="font-poppins text-xl font-semibold mb-2 text-red-900">Access Denied</h3>
          <p className="text-red-700 font-inter">
            Only Administrators and Managers can create users. Please contact your system administrator if you need
            access.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user")
      }

      toast({
        title: "Success",
        description: "User created successfully",
      })

      if (preselectedOrgId) {
        router.push(`/dashboard/organizations/${preselectedOrgId}`)
      } else {
        router.push("/dashboard/users")
      }
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const canSelectOrganization = currentUserRole === "super_admin"

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <Button type="button" asChild variant="ghost" className="text-muted-foreground hover:text-foreground -ml-2">
          <Link href={preselectedOrgId ? `/dashboard/organizations/${preselectedOrgId}` : "/dashboard/users"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card className="rounded-[25px] border-0 shadow-sm max-w-2xl">
        <CardHeader>
          <CardTitle className="font-poppins text-xl">User Information</CardTitle>
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
                className="rounded-[10px] border-border font-inter"
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
                className="rounded-[10px] border-border font-inter"
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
                className="rounded-[10px] border-border font-inter"
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
                className="rounded-[10px] border-border font-inter"
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
                  <SelectTrigger className="rounded-[10px] border-border font-inter">
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
                  className="rounded-[10px] border-border font-inter bg-muted"
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
                <SelectTrigger className="rounded-[10px] border-border font-inter">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_agent">Field Agent</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {currentUserRole === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
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
              className="rounded-[10px] border-border font-inter"
              placeholder="User will be asked to change this on first login"
            />
            <p className="text-xs text-muted-foreground font-inter">
              Minimum 6 characters. The user will be required to change this password on first login.
            </p>
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
              Create User
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
