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

interface IncomeRecordFormProps {
  farmerId: string | null
  organizationId: string | null
  onSuccess: () => void
}

export default function IncomeRecordForm({ farmerId, organizationId, onSuccess }: IncomeRecordFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    income_type: "",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    source_name: "",
    source_contact: "",
    crop_type: "",
    quantity_sold: "",
    price_per_unit: "",
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

      const incomeData = {
        farmer_id: farmerId,
        organization_id: organizationId,
        income_type: formData.income_type,
        amount: Number.parseFloat(formData.amount),
        transaction_date: formData.transaction_date,
        source_name: formData.source_name || null,
        source_contact: formData.source_contact || null,
        crop_type: formData.crop_type || null,
        quantity_sold: formData.quantity_sold ? Number.parseFloat(formData.quantity_sold) : null,
        price_per_unit: formData.price_per_unit ? Number.parseFloat(formData.price_per_unit) : null,
        unit_of_measure: formData.unit_of_measure || null,
        payment_method: formData.payment_method || null,
        payment_reference: formData.payment_reference || null,
        notes: formData.notes || null,
        recorded_by: user.id,
        verified: false,
        currency: "NGN",
      }

      const { error } = await supabase.from("farmer_income").insert(incomeData)

      if (error) throw error

      onSuccess()
    } catch (error) {
      console.error("[v0] Error recording income:", error)
      alert("Failed to record income. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Income Type *</Label>
          <Select
            value={formData.income_type}
            onValueChange={(value) => setFormData({ ...formData, income_type: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crop_sale">Crop Sale</SelectItem>
              <SelectItem value="livestock_sale">Livestock Sale</SelectItem>
              <SelectItem value="contract_payment">Contract Payment</SelectItem>
              <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
              <SelectItem value="grant">Grant/Subsidy</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
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
          <Label>Source/Buyer Name</Label>
          <Input
            value={formData.source_name}
            onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
          />
        </div>

        {formData.income_type === "crop_sale" && (
          <>
            <div>
              <Label>Crop Type</Label>
              <Input
                value={formData.crop_type}
                onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
              />
            </div>

            <div>
              <Label>Quantity Sold</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantity_sold}
                onChange={(e) => setFormData({ ...formData, quantity_sold: e.target.value })}
              />
            </div>

            <div>
              <Label>Price per Unit</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
              />
            </div>

            <div>
              <Label>Unit of Measure</Label>
              <Select
                value={formData.unit_of_measure}
                onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="ton">Tons</SelectItem>
                  <SelectItem value="bag">Bags</SelectItem>
                  <SelectItem value="basket">Baskets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

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
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Payment Reference</Label>
          <Input
            value={formData.payment_reference}
            onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
            placeholder="Transaction ID, receipt number, etc."
          />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional details about this income..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading} className="bg-[#39B54A] hover:bg-[#2d8f3a] text-white">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Income
        </Button>
      </div>
    </form>
  )
}
