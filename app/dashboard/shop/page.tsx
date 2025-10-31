import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShopItemsList } from "@/components/shop-items-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function ShopPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userData } = await supabase.from("users").select("role, organization_id").eq("id", user.id).single()

  if (!userData || !["admin", "super_admin"].includes(userData.role)) {
    redirect("/dashboard")
  }

  let shopItemsQuery = supabase.from("shop_items").select("*").order("created_at", { ascending: false })

  // Only filter by organization for regular admins, not super_admin
  if (userData.role !== "super_admin" && userData.organization_id) {
    shopItemsQuery = shopItemsQuery.eq("organization_id", userData.organization_id)
  }

  const { data: shopItems } = await shopItemsQuery

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Shop Management</h1>
          <p className="text-muted-foreground mt-1">Manage products and services available to farmers</p>
        </div>
        <Link href="/dashboard/shop/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      <ShopItemsList items={shopItems || []} />
    </div>
  )
}
