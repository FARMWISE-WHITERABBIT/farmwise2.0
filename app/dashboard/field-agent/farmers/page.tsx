import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Phone, MapPin } from "lucide-react"
import Link from "next/link"

export default async function FieldAgentFarmersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get farmers assigned to this agent
  const { data: farmers } = await supabase
    .from("farmers")
    .select("*")
    .eq("assigned_agent_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Farmers</h1>
          <p className="text-gray-600 mt-1">{farmers?.length || 0} farmers assigned to you</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Search farmers by name, phone, or ID..." className="pl-10" />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200">
            All Farmers
          </Button>
          <Button variant="outline" size="sm">
            Nearby
          </Button>
          <Button variant="outline" size="sm">
            Visited Today
          </Button>
        </div>

        {/* Farmers List */}
        <div className="space-y-3">
          {!farmers || farmers.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-600 mb-4">No farmers assigned yet</p>
              <Button asChild>
                <Link href="/dashboard/farmers/new">Register First Farmer</Link>
              </Button>
            </Card>
          ) : (
            farmers.map((farmer) => (
              <Card key={farmer.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold flex-shrink-0">
                    {farmer.first_name?.[0]}
                    {farmer.last_name?.[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {farmer.first_name} {farmer.last_name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {farmer.primary_phone}
                      </span>
                      {farmer.city_town && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {farmer.city_town}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button asChild size="sm" className="flex-shrink-0">
                    <Link href={`/dashboard/farmers/${farmer.id}`}>Visit</Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
