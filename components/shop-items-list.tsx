"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Package, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ShopItem {
  id: string
  name: string
  description: string
  category: string
  type: string
  price: number
  unit: string
  track_inventory: boolean
  current_stock: number
  low_stock_threshold: number
  is_active: boolean
  image_url: string
}

export function ShopItemsList({ items }: { items: ShopItem[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const router = useRouter()
  const supabase = createBrowserClient()

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    const { error } = await supabase.from("shop_items").delete().eq("id", id)

    if (error) {
      alert("Error deleting item: " + error.message)
    } else {
      router.refresh()
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("shop_items").update({ is_active: !currentStatus }).eq("id", id)

    if (error) {
      alert("Error updating item: " + error.message)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="service">Services</SelectItem>
            <SelectItem value="equipment_rental">Equipment Rental</SelectItem>
            <SelectItem value="input">Farm Inputs</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <Card key={item.id} className={!item.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{item.category}</Badge>
                    {!item.is_active && <Badge variant="destructive">Inactive</Badge>}
                    {item.track_inventory && item.current_stock <= item.low_stock_threshold && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">₦{item.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">per {item.unit}</p>
                </div>

                {item.track_inventory && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{item.current_stock}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">in stock</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Link href={`/dashboard/shop/${item.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => toggleActive(item.id, item.is_active)}>
                  {item.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No items found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Add your first product or service to get started"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
