import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShopItemForm } from "@/components/shop-item-form"

export default async function NewShopItemPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userData } = await supabase.from("users").select("role, organization_id").eq("id", user.id).single()

  if (!userData || !["admin", "super_admin"].includes(userData.role)) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Add Shop Item</h1>
        <p className="text-muted-foreground mt-1">Create a new product or service for your shop</p>
      </div>

      <ShopItemForm organizationId={userData.organization_id} userId={user.id} />
    </div>
  )
}
