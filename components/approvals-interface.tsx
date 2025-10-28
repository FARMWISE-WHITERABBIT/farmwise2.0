"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Building2, Users2, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ApprovalsInterfaceProps {
  currentUser: any
  pendingOrganizations: any[]
  pendingUsers: any[]
}

export function ApprovalsInterface({ currentUser, pendingOrganizations, pendingUsers }: ApprovalsInterfaceProps) {
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [approvalNotes, setApprovalNotes] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject">("approve")
  const supabase = createBrowserClient()
  const router = useRouter()
  const { toast } = useToast()

  const handleApproval = async (item: any, type: "organization" | "user", action: "approve" | "reject") => {
    setLoading(true)
    try {
      const table = type === "organization" ? "organizations" : "users"
      const updateData: any = {
        is_approved: action === "approve",
        approved_by: currentUser.id,
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes || null,
      }

      // If rejecting, also set is_active to false
      if (action === "reject") {
        updateData.is_active = false
      }

      const { error } = await supabase.from(table).update(updateData).eq("id", item.id)

      if (error) throw error

      // Create notification for the user
      if (type === "user") {
        await supabase.from("notifications").insert([
          {
            user_id: item.id,
            title: action === "approve" ? "Account Approved" : "Account Rejected",
            message:
              action === "approve"
                ? "Your account has been approved. You can now access the platform."
                : `Your account registration was not approved. ${approvalNotes || ""}`,
            notification_type: action === "approve" ? "approval_granted" : "approval_denied",
            type: action === "approve" ? "approval_granted" : "approval_denied",
          },
        ])
      }

      toast({
        title: "Success",
        description: `${type === "organization" ? "Organization" : "User"} ${action === "approve" ? "approved" : "rejected"} successfully`,
      })

      setDialogOpen(false)
      setApprovalNotes("")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Approval error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process approval",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openApprovalDialog = (item: any, action: "approve" | "reject") => {
    setSelectedItem(item)
    setActionType(action)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={currentUser.role === "super_admin" ? "organizations" : "users"}>
        {currentUser.role === "super_admin" && (
          <TabsList className="bg-white rounded-[15px] p-1 shadow-sm">
            <TabsTrigger
              value="organizations"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Organizations ({pendingOrganizations.length})
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Users ({pendingUsers.length})
            </TabsTrigger>
          </TabsList>
        )}

        {currentUser.role === "super_admin" && (
          <TabsContent value="organizations" className="space-y-4 mt-6">
            {pendingOrganizations.length > 0 ? (
              pendingOrganizations.map((org) => (
                <Card key={org.id} className="rounded-[20px] border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-6 w-6 text-[#39B54A]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-inter font-semibold text-[#000000] mb-1">{org.org_name}</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm text-[rgba(0,0,0,0.65)] font-inter">
                            <div>
                              <span className="text-[rgba(0,0,0,0.45)]">Type:</span> {org.org_type}
                            </div>
                            <div>
                              <span className="text-[rgba(0,0,0,0.45)]">Email:</span> {org.contact_email}
                            </div>
                            <div>
                              <span className="text-[rgba(0,0,0,0.45)]">Phone:</span> {org.contact_phone}
                            </div>
                            <div>
                              <span className="text-[rgba(0,0,0,0.45)]">Location:</span> {org.state}, {org.country}
                            </div>
                          </div>
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-2">
                            Registered: {new Date(org.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Dialog open={dialogOpen && selectedItem?.id === org.id} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => openApprovalDialog(org, "approve")}
                              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{actionType === "approve" ? "Approve" : "Reject"} Organization</DialogTitle>
                              <DialogDescription>
                                {actionType === "approve"
                                  ? "This organization will be able to access the platform."
                                  : "This organization will not be able to access the platform."}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="notes" className="font-inter text-sm">
                                  Notes {actionType === "reject" && "(Required)"}
                                </Label>
                                <Textarea
                                  id="notes"
                                  value={approvalNotes}
                                  onChange={(e) => setApprovalNotes(e.target.value)}
                                  placeholder="Add any notes about this decision..."
                                  className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setDialogOpen(false)}
                                  className="rounded-[10px] font-inter"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleApproval(org, "organization", actionType)}
                                  disabled={loading}
                                  className={`rounded-[10px] font-inter ${
                                    actionType === "approve"
                                      ? "bg-[#39B54A] hover:bg-[#2D5016]"
                                      : "bg-red-500 hover:bg-red-600"
                                  } text-white`}
                                >
                                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Confirm {actionType === "approve" ? "Approval" : "Rejection"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          onClick={() => openApprovalDialog(org, "reject")}
                          variant="outline"
                          className="rounded-[10px] border-red-500 text-red-500 hover:bg-red-50 font-inter"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-16 text-center">
                  <Building2 className="h-12 w-12 text-[rgba(0,0,0,0.25)] mx-auto mb-3" />
                  <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter">No pending organization approvals</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        <TabsContent value="users" className="space-y-4 mt-6">
          {pendingUsers.length > 0 ? (
            pendingUsers.map((user) => (
              <Card key={user.id} className="rounded-[20px] border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center flex-shrink-0">
                        <Users2 className="h-6 w-6 text-[#39B54A]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-inter font-semibold text-[#000000] mb-1">
                          {user.first_name} {user.last_name}
                        </h3>
                        <Badge variant="outline" className="rounded-full font-inter mb-2 capitalize">
                          {user.role?.replace("_", " ")}
                        </Badge>
                        <div className="grid grid-cols-2 gap-2 text-sm text-[rgba(0,0,0,0.65)] font-inter">
                          <div>
                            <span className="text-[rgba(0,0,0,0.45)]">Email:</span> {user.email}
                          </div>
                          {user.phone && (
                            <div>
                              <span className="text-[rgba(0,0,0,0.45)]">Phone:</span> {user.phone}
                            </div>
                          )}
                          {user.organizations && (
                            <div>
                              <span className="text-[rgba(0,0,0,0.45)]">Organization:</span>{" "}
                              {user.organizations.org_name}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-2">
                          Registered: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Dialog open={dialogOpen && selectedItem?.id === user.id} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => openApprovalDialog(user, "approve")}
                            className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{actionType === "approve" ? "Approve" : "Reject"} User</DialogTitle>
                            <DialogDescription>
                              {actionType === "approve"
                                ? "This user will be able to access the platform."
                                : "This user will not be able to access the platform."}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="notes" className="font-inter text-sm">
                                Notes {actionType === "reject" && "(Required)"}
                              </Label>
                              <Textarea
                                id="notes"
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                placeholder="Add any notes about this decision..."
                                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                className="rounded-[10px] font-inter"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleApproval(user, "user", actionType)}
                                disabled={loading}
                                className={`rounded-[10px] font-inter ${
                                  actionType === "approve"
                                    ? "bg-[#39B54A] hover:bg-[#2D5016]"
                                    : "bg-red-500 hover:bg-red-600"
                                } text-white`}
                              >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm {actionType === "approve" ? "Approval" : "Rejection"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        onClick={() => openApprovalDialog(user, "reject")}
                        variant="outline"
                        className="rounded-[10px] border-red-500 text-red-500 hover:bg-red-50 font-inter"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="rounded-[25px] border-none shadow-sm">
              <CardContent className="py-16 text-center">
                <Users2 className="h-12 w-12 text-[rgba(0,0,0,0.25)] mx-auto mb-3" />
                <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter">No pending user approvals</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
