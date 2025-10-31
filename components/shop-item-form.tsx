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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface ShopItemFormProps {
  organizationId: string
  userId: string
  initialData?: any
}

export function ShopItemForm({ organizationId, userId, initialData }: ShopItemFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "product",
    type: initialData?.type || "",
    price: initialData?.price || "",
    unit: initialData?.unit || "piece",
    track_inventory: initialData?.track_inventory || false,
    current_stock: initialData?.current_stock || 0,
    low_stock_threshold: initialData?.low_stock_threshold || 10,
    sku: initialData?.sku || "",
    brand: initialData?.brand || "",
    duration_unit: initialData?.duration_unit || "day",
    min_duration: initialData?.min_duration || 1,
    max_duration: initialData?.max_duration || "",
    is_active: initialData?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const itemData = {
        organization_id: organizationId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        price: Number.parseFloat(formData.price),
        unit: formData.unit,
        track_inventory: formData.track_inventory,
        current_stock: formData.track_inventory ? Number.parseInt(formData.current_stock.toString()) : 0,
        low_stock_threshold: formData.track_inventory ? Number.parseInt(formData.low_stock_threshold.toString()) : 10,
        sku: formData.sku || null,
        brand: formData.brand || null,
        duration_unit:
          formData.category === "service" || formData.category === "equipment_rental" ? formData.duration_unit : null,
        min_duration:
          formData.category === "service" || formData.category === "equipment_rental"
            ? Number.parseInt(formData.min_duration.toString())
            : null,
        max_duration:
          formData.category === "service" || (formData.category === "equipment_rental" && formData.max_duration)
            ? Number.parseInt(formData.max_duration.toString())
            : null,
        is_active: formData.is_active,
        created_by: userId,
      }

      if (initialData?.id) {
        const { error: updateError } = await supabase.from("shop_items").update(itemData).eq("id", initialData.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("shop_items").insert([itemData])

        if (insertError) throw insertError
      }

      router.push("/dashboard/shop")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="equipment_rental">Equipment Rental</SelectItem>
                  <SelectItem value="input">Farm Input</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type/Subcategory</Label>
              <Input
                id="type"
                placeholder="e.g., Seed, Fertilizer, Tractor"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                  <SelectItem value="bag">Bag</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="acre">Acre</SelectItem>
                  <SelectItem value="hectare">Hectare</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {(formData.category === "service" || formData.category === "equipment_rental") && (
        <Card>
          <CardHeader>
            <CardTitle>Service/Rental Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="duration_unit">Duration Unit</Label>
                <Select
                  value={formData.duration_unit}
                  onValueChange={(value) => setFormData({ ...formData, duration_unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_duration">Minimum Duration</Label>
                <Input
                  id="min_duration"
                  type="number"
                  min="1"
                  value={formData.min_duration}
                  onChange={(e) => setFormData({ ...formData, min_duration: Number.parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_duration">Maximum Duration (Optional)</Label>
                <Input
                  id="max_duration"
                  type="number"
                  min="1"
                  value={formData.max_duration}
                  onChange={(e) => setFormData({ ...formData, max_duration: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {formData.category === "product" && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="track_inventory"
                checked={formData.track_inventory}
                onCheckedChange={(checked) => setFormData({ ...formData, track_inventory: checked as boolean })}
              />
              <Label htmlFor="track_inventory" className="cursor-pointer">
                Track inventory for this product
              </Label>
            </div>

            {formData.track_inventory && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current_stock">Current Stock</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    min="0"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold">Low Stock Alert Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number.parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Item is active and available for purchase
        </Label>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Item" : "Create Item"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
