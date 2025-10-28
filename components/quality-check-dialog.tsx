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
import { Checkbox } from "@/components/ui/checkbox"
import { ClipboardCheck } from "lucide-react"

interface QualityCheckDialogProps {
  batchId: string
  userId: string
}

export function QualityCheckDialog({ batchId, userId }: QualityCheckDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    check_type: "",
    check_date: new Date().toISOString().split("T")[0],
    result: "",
    passed: true,
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      await supabase.from("quality_checks").insert({
        batch_id: batchId,
        check_type: formData.check_type,
        check_date: formData.check_date,
        result: formData.result,
        passed: formData.passed,
        notes: formData.notes || null,
        checked_by: userId,
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error adding quality check:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-white">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Quality Check
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-poppins">Add Quality Check</DialogTitle>
          <DialogDescription className="font-inter">Record a quality inspection for this batch</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="check_type" className="font-inter">
              Check Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.check_type}
              onValueChange={(value) => setFormData({ ...formData, check_type: value })}
              required
            >
              <SelectTrigger className="rounded-[10px] font-inter">
                <SelectValue placeholder="Select check type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visual_inspection">Visual Inspection</SelectItem>
                <SelectItem value="weight_verification">Weight Verification</SelectItem>
                <SelectItem value="moisture_test">Moisture Test</SelectItem>
                <SelectItem value="contamination_check">Contamination Check</SelectItem>
                <SelectItem value="pesticide_residue">Pesticide Residue Test</SelectItem>
                <SelectItem value="grading">Grading</SelectItem>
                <SelectItem value="temperature_check">Temperature Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="check_date" className="font-inter">
              Check Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="check_date"
              type="datetime-local"
              required
              value={formData.check_date}
              onChange={(e) => setFormData({ ...formData, check_date: e.target.value })}
              className="rounded-[10px] font-inter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="result" className="font-inter">
              Result <span className="text-red-500">*</span>
            </Label>
            <Input
              id="result"
              required
              placeholder="e.g., Grade A, 12% moisture, No contamination"
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              className="rounded-[10px] font-inter"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="passed"
              checked={formData.passed}
              onCheckedChange={(checked) => setFormData({ ...formData, passed: checked as boolean })}
            />
            <Label htmlFor="passed" className="cursor-pointer font-inter">
              Passed Quality Check
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="font-inter">
              Notes
            </Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Additional observations..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {isLoading ? "Saving..." : "Save Check"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
