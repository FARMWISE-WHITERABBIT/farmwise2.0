"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface ExpenseRecordFormProps {
  farmerId: string | null
  organizationId: string | null
  onSuccess: () => void
}

export default function ExpenseRecordForm({ farmerId, organizationId, onSuccess }: ExpenseRecordFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    expense_category: "",
    expense_type: "",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    vendor_name: "",
    vendor_contact: "",
    item_description: "",
    quantity: "",
    unit_price: "",
    unit_of_measure: "",
    payment_method: "",
    payment_reference: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const expenseData = {
        farmer_id: farmerId,
        organization_id: organizationId,
        expense_category: formData.expense_category,
        expense_type: formData.expense_type,
        amount: Number.parseFloat(formData.amount),
        transaction_date: formData.transaction_date,
        vendor_name: formData.vendor_name || null,
        vendor_contact: formData.vendor_contact || null,
        item_description: formData.item_description || null,
        quantity: formData.quantity ? Number.parseFloat(formData.quantity) : null,
        unit_price: formData.unit_price ? Number.parseFloat(formData.unit_price) : null,
        unit_of_measure: formData.unit_of_measure || null,
        payment_method: formData.payment_method || null,
        payment_reference: formData.payment_reference || null,
        notes: formData.notes || null,
        recorded_by: user.id,
        verified: false,
        currency: "NGN",
      }

      const { error } = await supabase.from("farmer_expenses").insert(expenseData)

      if (error) throw error

      onSuccess()
    } catch (error) {
      console.error("[v0] Error recording expense:", error)
      alert("Failed to record expense. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Expense Category *</Label>
          <Select
            value={formData.expense_category}
            onValueChange={(value) => setFormData({ ...formData, expense_category: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inputs">Farm Inputs</SelectItem>
              <SelectItem value="labor">Labor</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="loan_repayment">Loan Repayment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Expense Type *</Label>
          <Input
            value={formData.expense_type}
            onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
            placeholder="e.g., Fertilizer, Seeds, Fuel"
            required
          />
        </div>

        <div>
          <Label>Amount (₦) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>Transaction Date *</Label>
          <Input
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>Vendor/Supplier Name</Label>
          <Input
            value={formData.vendor_name}
            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
          />
        </div>

        <div>
          <Label>Vendor Contact</Label>
          <Input
            value={formData.vendor_contact}
            onChange={(e) => setFormData({ ...formData, vendor_contact: e.target.value })}
            placeholder="Phone or email"
          />
        </div>

        <div>
          <Label>Item Description</Label>
          <Input
            value={formData.item_description}
            onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
            placeholder="Details about the purchase"
          />
        </div>

        <div>
          <Label>Quantity</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>

        <div>
          <Label>Unit Price</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
          />
        </div>

        <div>
          <Label>Unit of Measure</Label>
          <Input
            value={formData.unit_of_measure}
            onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
            placeholder="kg, liters, bags, etc."
          />
        </div>

        <div>
          <Label>Payment Method</Label>
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
              <SelectItem value="credit">Credit/Loan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Payment Reference</Label>
          <Input
            value={formData.payment_reference}
            onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
            placeholder="Receipt number, transaction ID"
          />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional details about this expense..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading} className="bg-[#39B54A] hover:bg-[#2d8f3a] text-white">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Expense
        </Button>
      </div>
    </form>
  )
}
