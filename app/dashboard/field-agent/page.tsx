import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users } from "lucide-react"
import Link from "next/link"
import WeatherWidget from "@/components/weather-widget"

export const metadata = {
  title: "Extension Agent Dashboard | Farmwise",
  description: "Quick access to farmer registration and field activities",
}

export default async function FieldAgentDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user details including state and LGA for weather
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (userData?.role !== "field_agent") {
    redirect("/dashboard")
  }

  // Get agent's assigned farmers with full details
  const { data: farmers } = await supabase
    .from("farmers")
    .select(`
      *,
      organization:organizations(org_name),
      plots:farm_plots(id, plot_name, size_hectares)
    `)
    .eq("assigned_agent_id", user.id)
    .order("created_at", { ascending: false })

  const farmerCount = farmers?.length || 0

  const getCoordinatesForLocation = (state: string | null, lga: string | null) => {
    // Default to Abuja if no location data
    if (!state) return { lat: 9.082, lng: 8.6753, location: "Abuja, Nigeria" }

    // Add more state capitals as needed
    const stateCoordinates: Record<string, { lat: number; lng: number }> = {
      Abuja: { lat: 9.082, lng: 8.6753 },
      Lagos: { lat: 6.5244, lng: 3.3792 },
      Kano: { lat: 12.0022, lng: 8.592 },
      Kaduna: { lat: 10.5105, lng: 7.4165 },
      Oyo: { lat: 7.8451, lng: 3.947 },
      Rivers: { lat: 4.8156, lng: 7.0498 },
      Enugu: { lat: 6.5244, lng: 7.5106 },
    }

    const coords = stateCoordinates[state] || { lat: 9.082, lng: 8.6753 }
    return { ...coords, location: lga ? `${lga}, ${state}` : state }
  }

  const weatherLocation = getCoordinatesForLocation(userData?.state, userData?.lga)

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pb-24 md:pb-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-poppins font-semibold text-[rgba(0,0,0,0.87)]">
            Extension Agent Dashboard
          </h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
            {userData?.first_name}!
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            asChild
            className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter whitespace-nowrap"
          >
            <Link href="/dashboard/farmers/new">
              <Plus className="h-4 w-4 mr-2" />
              Register Farmer
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-[#39B54A] text-[#39B54A] hover:bg-[#39B54A] hover:text-white rounded-[10px] font-inter bg-transparent whitespace-nowrap"
          >
            <Link href="/dashboard/farmers">
              <Users className="h-4 w-4 mr-2" />
              Manage Farmers
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeatherWidget
            latitude={weatherLocation.lat}
            longitude={weatherLocation.lng}
            location={weatherLocation.location}
          />
        </div>

        <Card className="rounded-[20px] border-[rgba(0,0,0,0.12)] bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-inter text-[rgba(0,0,0,0.65)]">Total Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-poppins font-bold text-[#39B54A]">{farmerCount}</span>
              <span className="text-sm text-[rgba(0,0,0,0.65)] font-inter">assigned to you</span>
            </div>
            <Button asChild variant="link" className="text-[#39B54A] hover:text-[#2D5016] p-0 h-auto mt-3 font-inter">
              <Link href="/dashboard/farmers">View all farmers →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[20px] border-[rgba(0,0,0,0.12)] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-poppins text-lg text-[rgba(0,0,0,0.87)]">Your Farmers</CardTitle>
        </CardHeader>
        <CardContent>
          {!farmers || farmers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-[rgba(0,0,0,0.45)] mb-4" />
              <p className="text-[rgba(0,0,0,0.65)] font-inter mb-4">No farmers assigned yet</p>
              <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                <Link href="/dashboard/farmers/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Register Your First Farmer
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {farmers.map((farmer: any) => (
                <Link
                  key={farmer.id}
                  href={`/dashboard/farmers/${farmer.id}`}
                  className="flex items-center justify-between p-4 rounded-[15px] bg-[#F5F5F5] hover:bg-[rgba(57,181,74,0.1)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] text-[#39B54A] font-semibold">
                      {farmer.first_name?.[0]}
                      {farmer.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-poppins font-medium text-[rgba(0,0,0,0.87)]">
                        {farmer.first_name} {farmer.last_name}
                      </p>
                      <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter">
                        {farmer.plots?.length || 0} plot(s) • {farmer.primary_phone}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                  >
                    View
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
