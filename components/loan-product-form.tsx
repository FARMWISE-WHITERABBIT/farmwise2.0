"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface LoanProductFormProps {
  userId: string
  organizationId?: string
  initialData?: any
}

export function LoanProductForm({ userId, organizationId, initialData }: LoanProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    productName: initialData?.product_name || "",
    description: initialData?.description || "",
    minAmount: initialData?.min_amount || "",
    maxAmount: initialData?.max_amount || "",
    interestRate: initialData?.interest_rate || "",
    repaymentPeriodMonths: initialData?.repayment_period_months || "",
    repaymentType: initialData?.repayment_type || "monthly",
    allowsInputFinancing: initialData?.allows_input_financing || false,
    allowsProduceBacking: initialData?.allows_produce_backing || false,
    targetCrops: initialData?.target_crops?.join(", ") || "",
    eligibilityCriteria: initialData?.eligibility_criteria || "",
    isActive: initialData?.is_active ?? true,
  })

  const supabase = createBrowserClient()

  function handleInputChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const targetCropsArray = formData.targetCrops
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c)

      const productData = {
        product_name: formData.productName,
        description: formData.description,
        min_amount: Number.parseFloat(formData.minAmount),
        max_amount: Number.parseFloat(formData.maxAmount),
        interest_rate: Number.parseFloat(formData.interestRate),
        repayment_period_months: Number.parseInt(formData.repaymentPeriodMonths),
        repayment_type: formData.repaymentType,
        allows_input_financing: formData.allowsInputFinancing,
        allows_produce_backing: formData.allowsProduceBacking,
        target_crops: targetCropsArray,
        eligibility_criteria: formData.eligibilityCriteria,
        is_active: formData.isActive,
        organization_id: organizationId,
        created_by: userId,
      }

      if (initialData?.id) {
        const { error } = await supabase.from("loan_products").update(productData).eq("id", initialData.id)

        if (error) throw error

        toast({
          title: "Loan product updated!",
          description: "The loan product has been successfully updated.",
        })
      } else {
        const { error } = await supabase.from("loan_products").insert(productData)

        if (error) throw error

        toast({
          title: "Loan product created!",
          description: "The loan product is now available for farmers to apply.",
        })
      }

      router.push("/dashboard/loan-products")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error saving loan product:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name *</Label>
          <Input
            id="productName"
            value={formData.productName}
            onChange={(e) => handleInputChange("productName", e.target.value)}
            placeholder="e.g., Seasonal Farming Loan"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe the loan product and its benefits..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minAmount">Minimum Amount (₦) *</Label>
            <Input
              id="minAmount"
              type="number"
              value={formData.minAmount}
              onChange={(e) => handleInputChange("minAmount", e.target.value)}
              placeholder="50000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAmount">Maximum Amount (₦) *</Label>
            <Input
              id="maxAmount"
              type="number"
              value={formData.maxAmount}
              onChange={(e) => handleInputChange("maxAmount", e.target.value)}
              placeholder="500000"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (% per annum) *</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              value={formData.interestRate}
              onChange={(e) => handleInputChange("interestRate", e.target.value)}
              placeholder="12.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repaymentPeriodMonths">Repayment Period (months) *</Label>
            <Input
              id="repaymentPeriodMonths"
              type="number"
              value={formData.repaymentPeriodMonths}
              onChange={(e) => handleInputChange("repaymentPeriodMonths", e.target.value)}
              placeholder="12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repaymentType">Repayment Type *</Label>
          <Select value={formData.repaymentType} onValueChange={(value) => handleInputChange("repaymentType", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="harvest">At Harvest</SelectItem>
              <SelectItem value="bullet">Bullet (End of Term)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Loan Features</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowsInputFinancing"
                checked={formData.allowsInputFinancing}
                onCheckedChange={(checked) => handleInputChange("allowsInputFinancing", checked)}
              />
              <Label htmlFor="allowsInputFinancing" className="font-normal">
                Allows input financing (seeds, fertilizer, etc.)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowsProduceBacking"
                checked={formData.allowsProduceBacking}
                onCheckedChange={(checked) => handleInputChange("allowsProduceBacking", checked)}
              />
              <Label htmlFor="allowsProduceBacking" className="font-normal">
                Allows produce-backed repayment
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetCrops">Target Crops (comma-separated)</Label>
          <Input
            id="targetCrops"
            value={formData.targetCrops}
            onChange={(e) => handleInputChange("targetCrops", e.target.value)}
            placeholder="cocoa, coffee, cassava"
          />
          <p className="text-xs text-muted-foreground">Leave empty if applicable to all crops</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="eligibilityCriteria">Eligibility Criteria</Label>
          <Textarea
            id="eligibilityCriteria"
            value={formData.eligibilityCriteria}
            onChange={(e) => handleInputChange("eligibilityCriteria", e.target.value)}
            placeholder="e.g., Minimum 2 years farming experience, minimum 1 hectare farm size..."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => handleInputChange("isActive", checked)}
          />
          <Label htmlFor="isActive" className="font-normal">
            Make this product active and available for applications
          </Label>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#39b54a] hover:bg-[#2d8f3a]">
          {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  )
}
