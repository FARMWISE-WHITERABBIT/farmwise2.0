import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user details
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!userData || !["admin", "super_admin"].includes(userData.role)) {
    redirect("/dashboard")
  }

  // Fetch crop yield data by region
  const { data: plots } = await supabase
    .from("farm_plots")
    .select(`
      *,
      farmers!inner(state, lga, organization_id)
    `)
    .eq("farmers.organization_id", userData.organization_id)

  // Fetch livestock data by region
  const { data: livestock } = await supabase
    .from("livestock")
    .select(`
      *,
      farmers!inner(state, lga, organization_id)
    `)
    .eq("farmers.organization_id", userData.organization_id)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">Comprehensive crop and livestock yield analysis by region</p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <AnalyticsDashboard plots={plots || []} livestock={livestock || []} />
    </div>
  )
}
