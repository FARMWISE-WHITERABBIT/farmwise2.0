"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { NIGERIAN_STATES_AND_LGAS } from "@/lib/data/nigeria-states-lgas"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Mail, UserX, UserCheck, Trash2, Copy, Check } from "lucide-react"

interface ExtensionAgentEditFormProps {
  agent: any
  organizations: Array<{ id: string; org_name: string }>
}

export function ExtensionAgentEditForm({ agent, organizations }: ExtensionAgentEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedState, setSelectedState] = useState(agent.state || "")
  const [isActive, setIsActive] = useState(agent.is_active)
  const [recoveryLink, setRecoveryLink] = useState("")
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      organization_id: formData.get("organization_id"),
      state: formData.get("state"),
      lga: formData.get("lga"),
      is_active: isActive,
    }

    try {
      const response = await fetch(`/api/users/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update agent")
      }

      toast({
        title: "Success",
        description: "Extension agent updated successfully",
      })

      router.push(`/dashboard/extension-agents/${agent.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    try {
      const response = await fetch(`/api/users/${agent.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate password reset link")
      }

      setRecoveryLink(result.recoveryLink)
      setShowRecoveryDialog(true)

      toast({
        title: "Success",
        description: "Password reset link generated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(recoveryLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied",
      description: "Password reset link copied to clipboard",
    })
  }

  const handleToggleActive = async () => {
    const newStatus = !isActive
    try {
      const response = await fetch(`/api/users/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update account status")
      }

      setIsActive(newStatus)
      toast({
        title: "Success",
        description: `Account ${newStatus ? "activated" : "deactivated"} successfully`,
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`/api/users/${agent.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account")
      }

      toast({
        title: "Success",
        description: "Account deleted successfully",
      })

      router.push("/dashboard/extension-agents")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Password Reset Link</AlertDialogTitle>
            <AlertDialogDescription>
              Copy this link and send it to the user securely. The link expires in 1 hour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={recoveryLink} readOnly className="font-mono text-sm" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowRecoveryDialog(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="rounded-[25px] border-none shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">Account Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePasswordReset}
              className="rounded-[10px] font-inter bg-transparent"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Password Reset
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleToggleActive}
              className="rounded-[10px] font-inter bg-transparent"
            >
              {isActive ? (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate Account
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate Account
                </>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="rounded-[10px] font-inter">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the extension agent account and remove
                    all associated data from the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="rounded-[25px] border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="font-poppins text-lg">Agent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="font-inter">
                  First Name *
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  defaultValue={agent.first_name}
                  required
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="font-inter">
                  Last Name *
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  defaultValue={agent.last_name}
                  required
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-inter">
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={agent.email}
                  required
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-inter">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={agent.phone || ""}
                  className="rounded-[10px] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization_id" className="font-inter">
                  Organization *
                </Label>
                <Select name="organization_id" defaultValue={agent.organization_id} required>
                  <SelectTrigger className="rounded-[10px] font-inter">
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

              <div className="space-y-2">
                <Label htmlFor="is_active" className="font-inter">
                  Status *
                </Label>
                <Select name="is_active" defaultValue={agent.is_active ? "true" : "false"} required>
                  <SelectTrigger className="rounded-[10px] font-inter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="font-inter">
                  State *
                </Label>
                <Select name="state" value={selectedState} onValueChange={setSelectedState} required>
                  <SelectTrigger className="rounded-[10px] font-inter">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(NIGERIAN_STATES_AND_LGAS).map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lga" className="font-inter">
                  LGA *
                </Label>
                <Select name="lga" defaultValue={agent.lga || ""} required disabled={!selectedState}>
                  <SelectTrigger className="rounded-[10px] font-inter">
                    <SelectValue placeholder={selectedState ? "Select LGA" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedState &&
                      NIGERIAN_STATES_AND_LGAS[selectedState]?.map((lga) => (
                        <SelectItem key={lga} value={lga}>
                          {lga}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-[10px] font-inter"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
