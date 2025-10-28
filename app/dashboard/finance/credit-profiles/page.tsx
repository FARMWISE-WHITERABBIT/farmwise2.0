import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function CreditProfilesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch farmers with credit scores
  const { data: farmers } = await supabase
    .from("farmers")
    .select(
      `
      *,
      farmer_credit_history(*)
    `,
    )
    .order("credit_score", { ascending: false })

  const getCreditRatingColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
      case "good":
        return "bg-blue-100 text-blue-700"
      case "fair":
        return "bg-yellow-100 text-yellow-700"
      case "poor":
        return "bg-orange-100 text-orange-700"
      case "very_poor":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getCreditIcon = (score: number) => {
    if (score >= 650) return <TrendingUp className="h-4 w-4 text-[#39B54A]" />
    if (score >= 550) return <Minus className="h-4 w-4 text-yellow-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Credit Profiles</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            View and manage farmer credit scores and financial history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Excellent Credit</p>
              <p className="text-3xl font-poppins font-semibold text-[#39B54A] mt-2">
                {farmers?.filter((f) => f.credit_rating === "excellent").length || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Good Credit</p>
              <p className="text-3xl font-poppins font-semibold text-blue-600 mt-2">
                {farmers?.filter((f) => f.credit_rating === "good").length || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Fair Credit</p>
              <p className="text-3xl font-poppins font-semibold text-yellow-600 mt-2">
                {farmers?.filter((f) => f.credit_rating === "fair").length || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Poor/Unrated</p>
              <p className="text-3xl font-poppins font-semibold text-red-600 mt-2">
                {farmers?.filter(
                  (f) => f.credit_rating === "poor" || f.credit_rating === "very_poor" || f.credit_rating === "unrated",
                ).length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 rounded-[25px] border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.45)]" />
              <Input
                placeholder="Search by farmer name or ID..."
                className="pl-10 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </CardContent>
        </Card>

        {/* Farmers List */}
        <div className="grid gap-4">
          {!farmers || farmers.length === 0 ? (
            <Card className="rounded-[25px] border-none shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-[rgba(0,0,0,0.45)] font-inter">No credit profiles available</p>
              </CardContent>
            </Card>
          ) : (
            farmers.map((farmer: any) => (
              <Card key={farmer.id} className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-poppins font-semibold text-lg text-[#000000]">
                          {farmer.first_name} {farmer.last_name}
                        </h3>
                        <Badge
                          className={`rounded-full font-inter text-xs ${getCreditRatingColor(farmer.credit_rating)}`}
                        >
                          {farmer.credit_rating?.replace("_", " ") || "Unrated"}
                        </Badge>
                      </div>
                      <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">Farmer ID: {farmer.farmer_id}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter">
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Credit Score</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getCreditIcon(farmer.credit_score || 0)}
                            <p className="font-semibold text-[#000000]">{farmer.credit_score || "N/A"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Total Loans</p>
                          <p className="font-medium text-[#000000]">
                            {farmer.farmer_credit_history?.[0]?.total_loans_taken || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Repayment Rate</p>
                          <p className="font-medium text-[#39B54A]">
                            {farmer.farmer_credit_history?.[0]?.repayment_rate || 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Last Assessment</p>
                          <p className="font-medium text-[#000000]">
                            {farmer.last_credit_assessment_date
                              ? new Date(farmer.last_credit_assessment_date).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/farmers/${farmer.id}`}
                      className="text-[#39B54A] hover:text-[#2D5016] text-sm font-inter"
                    >
                      View Profile
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
