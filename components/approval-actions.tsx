"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Check, X } from "lucide-react"
import { toast } from "sonner"

interface ApprovalActionsProps {
  userId: string
  type: "user" | "organization"
}

export function ApprovalActions({ userId, type }: ApprovalActionsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [notes, setNotes] = useState("")
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const response = await fetch("/api/approvals/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, type, notes }),
      })

      if (!response.ok) throw new Error("Failed to approve")

      toast.success(`${type === "user" ? "User" : "Organization"} approved successfully`)
      setShowApproveDialog(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to approve. Please try again.")
      console.error(error)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }

    setIsRejecting(true)
    try {
      const response = await fetch("/api/approvals/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, type, notes }),
      })

      if (!response.ok) throw new Error("Failed to reject")

      toast.success(`${type === "user" ? "User" : "Organization"} rejected`)
      setShowRejectDialog(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to reject. Please try again.")
      console.error(error)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogTrigger asChild>
          <Button size="sm" className="bg-[#39B54A] hover:bg-[#2d8f3a] text-white">
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {type === "user" ? "User" : "Organization"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this {type}? They will gain access to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approve-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={isApproving}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving} className="bg-[#39B54A] hover:bg-[#2d8f3a]">
              {isApproving ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent">
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {type === "user" ? "User" : "Organization"}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this {type}. This will be recorded in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes">Rejection Reason *</Label>
              <Textarea
                id="reject-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isRejecting}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !notes.trim()}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
