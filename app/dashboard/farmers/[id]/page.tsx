import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FarmerProfileClient } from "@/components/farmer-profile-client"

export default async function FarmerDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (params.id === "new") {
    redirect("/dashboard/farmers")
  }

  // Fetch farmer details
  const { data: farmer } = await supabase.from("farmers").select("*").eq("id", params.id).single()

  if (!farmer) {
    redirect("/dashboard/farmers")
  }

  const { data: farmerUser } = farmer.user_id
    ? await supabase.from("users").select("*").eq("id", farmer.user_id).single()
    : { data: null }

  // Fetch farmer's plots
  const { data: plots } = await supabase
    .from("farm_plots")
    .select("*")
    .eq("farmer_id", params.id)
    .order("created_at", { ascending: false })

  // Fetch farmer's activities
  const { data: activities } = await supabase
    .from("farm_activities")
    .select(`
      *,
      farm_plots (plot_code, plot_name)
    `)
    .eq("farmer_id", params.id)
    .order("activity_date", { ascending: false })
    .limit(20)

  const { data: fieldVisits } = await supabase
    .from("field_visits")
    .select("*")
    .eq("farmer_id", params.id)
    .order("visit_date", { ascending: false })

  const { data: financialSummary } = await supabase
    .from("farmer_financial_summary")
    .select("*")
    .eq("farmer_id", params.id)
    .single()

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

  return (
    <FarmerProfileClient
      farmer={farmer}
      farmerUser={farmerUser}
      plots={plots || []}
      activities={activities || []}
      allPhotos={allPhotos}
      financialSummary={financialSummary}
      farmerId={params.id}
    />
  )
}
