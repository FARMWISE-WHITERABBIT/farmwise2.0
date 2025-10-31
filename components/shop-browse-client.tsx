"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"
import { ShoppingCart, Package, Wrench, Tractor, Search, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface ShopItem {
  id: string
  name: string
  description: string
  category: string
  item_type: string
  price: number
  unit: string
  stock_quantity: number | null
  track_inventory: boolean
  is_active: boolean
  image_url: string | null
  service_duration: number | null
  rental_period: string | null
  specifications: any
}

interface ShopBrowseClientProps {
  items: ShopItem[]
  userId: string
  organizationId: string
}

export function ShopBrowseClient({ items, userId, organizationId }: ShopBrowseClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<"online" | "offline">("offline")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const categories = ["all", ...new Set(items.map((item) => item.category))]

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleOrderClick = (item: ShopItem) => {
    setSelectedItem(item)
    setQuantity(1)
    setPaymentMethod("offline")
    setDeliveryAddress("")
    setNotes("")
    setOrderDialogOpen(true)
  }

  const handleSubmitOrder = async () => {
    if (!selectedItem) return

    setIsSubmitting(true)
    const supabase = createBrowserClient()

    try {
      const totalAmount = selectedItem.price * quantity

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("shop_orders")
        .insert({
          organization_id: organizationId,
          farmer_id: userId,
          shop_item_id: selectedItem.id,
          quantity,
          unit_price: selectedItem.price,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "offline" ? "pending" : "pending",
          order_status: "pending",
          delivery_address: deliveryAddress,
          notes,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // If inventory is tracked, update stock
      if (selectedItem.track_inventory && selectedItem.stock_quantity !== null) {
        const { error: updateError } = await supabase
          .from("shop_items")
          .update({
            stock_quantity: selectedItem.stock_quantity - quantity,
          })
          .eq("id", selectedItem.id)

        if (updateError) throw updateError
      }

      setOrderDialogOpen(false)
      router.refresh()

      // Show success message
      alert(`Order placed successfully! Order #${order.order_number}`)
    } catch (error) {
      console.error("[v0] Error creating order:", error)
      alert("Failed to place order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package className="h-5 w-5" />
      case "service":
        return <Wrench className="h-5 w-5" />
      case "equipment_rental":
        return <Tractor className="h-5 w-5" />
      default:
        return <ShoppingCart className="h-5 w-5" />
    }
  }

  const formatPrice = (price: number, unit: string) => {
    return `₦${price.toLocaleString()}${unit ? `/${unit}` : ""}`
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products and services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No items found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try adjusting your search" : "No items available in the shop"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getItemIcon(item.item_type)}
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {item.category}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{item.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{formatPrice(item.price, item.unit)}</span>
                    {item.track_inventory && (
                      <Badge variant={item.stock_quantity && item.stock_quantity > 0 ? "default" : "destructive"}>
                        {item.stock_quantity && item.stock_quantity > 0
                          ? `${item.stock_quantity} in stock`
                          : "Out of stock"}
                      </Badge>
                    )}
                  </div>

                  {item.item_type === "service" && item.service_duration && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Duration: {item.service_duration} days</span>
                    </div>
                  )}

                  {item.item_type === "equipment_rental" && item.rental_period && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Rental: {item.rental_period}</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleOrderClick(item)}
                  disabled={item.track_inventory && (!item.stock_quantity || item.stock_quantity <= 0)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {item.item_type === "service"
                    ? "Book Service"
                    : item.item_type === "equipment_rental"
                      ? "Rent Equipment"
                      : "Order Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
            <DialogDescription>{selectedItem?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedItem?.track_inventory ? selectedItem.stock_quantity || 1 : undefined}
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offline" id="offline" />
                  <Label htmlFor="offline" className="font-normal">
                    Pay on Delivery
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="font-normal">
                    Pay Online
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or requirements"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Unit Price:</span>
                <span className="font-medium">₦{selectedItem?.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Quantity:</span>
                <span className="font-medium">{quantity}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold">₦{((selectedItem?.price || 0) * quantity).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitOrder} disabled={isSubmitting || !deliveryAddress}>
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
