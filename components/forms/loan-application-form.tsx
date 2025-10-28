"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface LoanApplicationFormProps {
  farmers: any[]
  loanProducts: any[]
}

export default function LoanApplicationForm({ farmers, loanProducts }: LoanApplicationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    farmer_id: "",
    loan_product_id: "",
    requested_amount: "",
    purpose: "",
    collateral_description: "",
    farm_size_hectares: "",
    expected_yield_kg: "",
    expected_revenue: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("loan_applications").insert({
        farmer_id: formData.farmer_id,
        loan_product_id: formData.loan_product_id,
        requested_amount: Number.parseFloat(formData.requested_amount),
        purpose: formData.purpose,
        collateral_description: formData.collateral_description,
        farm_size_hectares: formData.farm_size_hectares ? Number.parseFloat(formData.farm_size_hectares) : null,
        expected_yield_kg: formData.expected_yield_kg ? Number.parseFloat(formData.expected_yield_kg) : null,
        expected_revenue: formData.expected_revenue ? Number.parseFloat(formData.expected_revenue) : null,
        status: "pending",
        submitted_date: new Date().toISOString(),
      })

      if (error) throw error

      router.push("/dashboard/loans")
      router.refresh()
    } catch (error) {
      console.error("Error creating loan application:", error)
      alert("Failed to create loan application. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="farmer_id" className="font-inter font-medium">
              Select Farmer *
            </Label>
            <Select
              value={formData.farmer_id}
              onValueChange={(value) => setFormData({ ...formData, farmer_id: value })}
              required
            >
              <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                <SelectValue placeholder="Choose a farmer" />
              </SelectTrigger>
              <SelectContent>
                {farmers.map((farmer) => (
                  <SelectItem key={farmer.id} value={farmer.id}>
                    {farmer.first_name} {farmer.last_name} ({farmer.farmer_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan_product_id" className="font-inter font-medium">
              Loan Product *
            </Label>
            <Select
              value={formData.loan_product_id}
              onValueChange={(value) => setFormData({ ...formData, loan_product_id: value })}
              required
            >
              <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                <SelectValue placeholder="Choose a loan product" />
              </SelectTrigger>
              <SelectContent>
                {loanProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.product_name} - {product.interest_rate}% ({product.repayment_period_months} months)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requested_amount" className="font-inter font-medium">
              Requested Amount (₦) *
            </Label>
            <Input
              id="requested_amount"
              type="number"
              step="0.01"
              value={formData.requested_amount}
              onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose" className="font-inter font-medium">
              Purpose of Loan *
            </Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter min-h-[100px]"
              placeholder="Describe how the loan will be used"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collateral_description" className="font-inter font-medium">
              Collateral Description
            </Label>
            <Textarea
              id="collateral_description"
              value={formData.collateral_description}
              onChange={(e) => setFormData({ ...formData, collateral_description: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter min-h-[80px]"
              placeholder="Describe any collateral offered"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farm_size_hectares" className="font-inter font-medium">
                Farm Size (hectares)
              </Label>
              <Input
                id="farm_size_hectares"
                type="number"
                step="0.01"
                value={formData.farm_size_hectares}
                onChange={(e) => setFormData({ ...formData, farm_size_hectares: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_yield_kg" className="font-inter font-medium">
                Expected Yield (kg)
              </Label>
              <Input
                id="expected_yield_kg"
                type="number"
                step="0.01"
                value={formData.expected_yield_kg}
                onChange={(e) => setFormData({ ...formData, expected_yield_kg: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_revenue" className="font-inter font-medium">
                Expected Revenue (₦)
              </Label>
              <Input
                id="expected_revenue"
                type="number"
                step="0.01"
                value={formData.expected_revenue}
                onChange={(e) => setFormData({ ...formData, expected_revenue: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
