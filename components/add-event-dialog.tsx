"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

interface AddEventDialogProps {
  batchId: string
  userId: string
  organizationId: string
}

export function AddEventDialog({ batchId, userId, organizationId }: AddEventDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    event_type: "",
    event_date: new Date().toISOString().split("T")[0],
    description: "",
    location: "",
    quantity_affected_kg: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      await supabase.from("traceability_events").insert({
        batch_id: batchId,
        event_type: formData.event_type,
        event_date: formData.event_date,
        description: formData.description,
        location: formData.location || null,
        quantity_affected_kg: formData.quantity_affected_kg ? Number.parseFloat(formData.quantity_affected_kg) : null,
        performed_by: userId,
        organization_id: organizationId,
      })

      // Update batch status if needed
      if (formData.event_type === "storage") {
        await supabase.from("harvest_batches").update({ status: "in_storage" }).eq("id", batchId)
      } else if (formData.event_type === "transport") {
        await supabase.from("harvest_batches").update({ status: "in_transit" }).eq("id", batchId)
      } else if (formData.event_type === "delivery") {
        await supabase.from("harvest_batches").update({ status: "sold" }).eq("id", batchId)
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error adding event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-poppins">Add Traceability Event</DialogTitle>
          <DialogDescription className="font-inter">Record a new event in the batch timeline</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event_type" className="font-inter">
              Event Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              required
            >
              <SelectTrigger className="rounded-[10px] font-inter">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="quality_check">Quality Check</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
                <SelectItem value="issue">Issue/Problem</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date" className="font-inter">
              Event Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event_date"
              type="datetime-local"
              required
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="rounded-[10px] font-inter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-inter">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              required
              rows={3}
              placeholder="Describe what happened..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-[10px] font-inter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="font-inter">
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Warehouse A, Lagos"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="rounded-[10px] font-inter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity_affected_kg" className="font-inter">
              Quantity Affected (kg)
            </Label>
            <Input
              id="quantity_affected_kg"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.quantity_affected_kg}
              onChange={(e) => setFormData({ ...formData, quantity_affected_kg: e.target.value })}
              className="rounded-[10px] font-inter"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="rounded-[10px] font-inter"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
            >
              {isLoading ? "Adding..." : "Add Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
