import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FarmerProfileClient } from "@/components/farmer-profile-client"

export default async function FarmerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (id === "new") {
    redirect("/dashboard/farmers")
  }

  console.log("[v0] Fetching farmer details for ID:", id)
  console.log("[v0] Current user:", user.id)

  // Fetch farmer details
  const { data: farmer, error: farmerError } = await supabase.from("farmers").select("*").eq("id", id).single()

  console.log("[v0] Farmer data:", farmer)
  console.log("[v0] Farmer error:", farmerError)

  if (farmerError) {
    console.error("[v0] Error fetching farmer:", farmerError)
    // Don't redirect immediately, show error message instead
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Farmer</h1>
          <p className="text-muted-foreground mb-4">{farmerError.message || "Unable to load farmer details"}</p>
          <p className="text-sm text-muted-foreground">Error Code: {farmerError.code}</p>
        </div>
      </div>
    )
  }

  if (!farmer) {
    console.log("[v0] Farmer not found, redirecting")
    redirect("/dashboard/farmers")
  }

  const { data: farmerUser } = farmer.user_id
    ? await supabase.from("users").select("*").eq("id", farmer.user_id).single()
    : { data: null }

  // Fetch farmer's plots
  const { data: plots, error: plotsError } = await supabase
    .from("farm_plots")
    .select("*")
    .eq("farmer_id", id)
    .order("created_at", { ascending: false })

  if (plotsError) {
    console.error("[v0] Error fetching plots:", plotsError)
  }

  // Fetch farmer's activities
  const { data: activities, error: activitiesError } = await supabase
    .from("farm_activities")
    .select(`
      *,
      farm_plots (plot_code, plot_name)
    `)
    .eq("farmer_id", id)
    .order("activity_date", { ascending: false })
    .limit(20)

  if (activitiesError) {
    console.error("[v0] Error fetching activities:", activitiesError)
  }

  const { data: fieldVisits, error: visitsError } = await supabase
    .from("field_visits")
    .select("*")
    .eq("farmer_id", id)
    .order("visit_date", { ascending: false })

  if (visitsError) {
    console.error("[v0] Error fetching field visits:", visitsError)
  }

  const { data: financialSummary, error: financialError } = await supabase
    .from("farmer_financial_summary")
    .select("*")
    .eq("farmer_id", id)
    .single()

  if (financialError && financialError.code !== "PGRST116") {
    // PGRST116 is "not found" which is acceptable
    console.error("[v0] Error fetching financial summary:", financialError)
  }

  // Collect all photos from field visits and plots
  const allPhotos: string[] = []

  if (farmer.profile_photo_url) {
    allPhotos.push(farmer.profile_photo_url)
  }

  fieldVisits?.forEach((visit: any) => {
    if (visit.photos && Array.isArray(visit.photos)) {
      allPhotos.push(...visit.photos)
    }
  })

  plots?.forEach((plot: any) => {
    if (plot.satellite_image_url) {
      allPhotos.push(plot.satellite_image_url)
    }
  })

  console.log("[v0] Successfully loaded farmer profile data")

  return (
    <FarmerProfileClient
      farmer={farmer}
      farmerUser={farmerUser}
      plots={plots || []}
      activities={activities || []}
      allPhotos={allPhotos}
      financialSummary={financialSummary}
      farmerId={id}
    />
  )
}
