import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShopBrowseClient } from "@/components/shop-browse-client"

export default async function ShopBrowsePage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch user profile to get organization
  const { data: profile } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single()

  if (!profile?.organization_id) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">You must be part of an organization to access the shop.</p>
        </div>
      </div>
    )
  }

  // Fetch shop items for this organization
  const { data: shopItems, error: itemsError } = await supabase
    .from("shop_items")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (itemsError) {
    console.error("[v0] Error fetching shop items:", itemsError)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
          <p className="text-muted-foreground">Browse and order products and services</p>
        </div>
      </div>

      <ShopBrowseClient items={shopItems || []} userId={user.id} organizationId={profile.organization_id} />
    </div>
  )
}
