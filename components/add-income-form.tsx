"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AddIncomeFormProps {
  farmerId: string
  onSuccess?: () => void
}

export function AddIncomeForm({ farmerId, onSuccess }: AddIncomeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    income_type: "",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    payment_method: "",
    source_name: "",
    crop_type: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("farmer_income").insert({
        farmer_id: farmerId,
        ...formData,
        amount: Number.parseFloat(formData.amount),
      })

      if (error) throw error

      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error("Error adding income:", error)
      alert("Failed to add income. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="income_type">Income Type *</Label>
          <Select
            value={formData.income_type}
            onValueChange={(value) => setFormData({ ...formData, income_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crop_sale">Crop Sale</SelectItem>
              <SelectItem value="livestock_sale">Livestock Sale</SelectItem>
              <SelectItem value="off_farm_income">Off-Farm Income</SelectItem>
              <SelectItem value="government_subsidy">Government Subsidy</SelectItem>
              <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₦) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction_date">Transaction Date *</Label>
          <Input
            id="transaction_date"
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source_name">Source/Buyer Name</Label>
          <Input
            id="source_name"
            value={formData.source_name}
            onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="crop_type">Crop Type (if applicable)</Label>
          <Input
            id="crop_type"
            value={formData.crop_type}
            onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Income"}
        </Button>
      </div>
    </form>
  )
}
