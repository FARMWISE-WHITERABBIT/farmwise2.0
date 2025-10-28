import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Calendar, Package, DollarSign, CheckCircle2, XCircle, Clock } from "lucide-react"
import Link from "next/link"

export default async function AvailableContractsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile to check role
  const { data: userProfile } = await supabase.from("users").select("role, organization_id").eq("id", user.id).single()

  // Get farmer profile if user is a farmer
  let farmerProfile = null
  if (userProfile?.role === "farmer") {
    const { data } = await supabase.from("farmers").select("*").eq("user_id", user.id).single()
    farmerProfile = data
  }

  // Fetch active contracts that are open for registration
  const { data: availableContracts } = await supabase
    .from("contracts")
    .select(
      `
      *,
      buyer_organizations:organizations!contracts_buyer_organization_id_fkey(org_name),
      contract_eligibility_criteria(*),
      contract_registrations(id, status, farmer_id)
    `,
    )
    .in("status", ["active", "pending_approval"])
    .order("created_at", { ascending: false })

  // Get farmer's existing registrations if they're a farmer
  let myRegistrations: any[] = []
  if (farmerProfile) {
    const { data } = await supabase
      .from("contract_registrations")
      .select("contract_id, status")
      .eq("farmer_id", farmerProfile.id)
    myRegistrations = data || []
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const getRegistrationStatus = (contractId: string) => {
    return myRegistrations.find((r) => r.contract_id === contractId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="rounded-full font-inter text-xs bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        )
      case "approved":
        return (
          <Badge className="rounded-full font-inter text-xs bg-[rgba(57,181,74,0.1)] text-[#39B54A]">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="rounded-full font-inter text-xs bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case "under_review":
        return (
          <Badge className="rounded-full font-inter text-xs bg-blue-100 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Available Contracts</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            {userProfile?.role === "farmer"
              ? "Browse and apply for contract farming opportunities"
              : "View available contracts and register farmers"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Available Contracts</p>
                  <p className="text-3xl font-poppins font-semibold text-[#000000] mt-2">
                    {availableContracts?.length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {farmerProfile && (
            <>
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">My Applications</p>
                      <p className="text-3xl font-poppins font-semibold text-[#39B54A] mt-2">
                        {myRegistrations.length}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-[#39B54A]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Approved</p>
                      <p className="text-3xl font-poppins font-semibold text-blue-600 mt-2">
                        {myRegistrations.filter((r) => r.status === "approved").length}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Search */}
        <Card className="mb-6 rounded-[25px] border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.45)]" />
                <Input
                  placeholder="Search by crop type, location, or buyer organization..."
                  className="pl-10 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                />
              </div>
              <Button variant="outline" className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-transparent">
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        {!availableContracts || availableContracts.length === 0 ? (
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                <FileText className="h-8 w-8 text-[#39B54A]" />
              </div>
              <h3 className="font-poppins text-xl font-semibold mb-2">No contracts available</h3>
              <p className="text-[rgba(0,0,0,0.65)] font-inter">Check back later for new contract opportunities</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {availableContracts.map((contract: any) => {
              const registration = getRegistrationStatus(contract.id)
              const hasApplied = !!registration

              return (
                <Card
                  key={contract.id}
                  className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-poppins font-semibold text-lg text-[#000000]">{contract.title}</h3>
                          {hasApplied && getStatusBadge(registration.status)}
                        </div>
                        <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-1">
                          Contract #{contract.contract_number}
                        </p>
                        {contract.buyer_organizations && (
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                            Buyer: {contract.buyer_organizations.org_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-[#39B54A] mt-0.5" />
                        <div>
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Crop Type</p>
                          <p className="font-medium text-sm text-[#000000] font-inter">{contract.crop_type}</p>
                          {contract.variety && (
                            <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter">{contract.variety}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-[#39B54A] mt-0.5" />
                        <div>
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Quantity Needed</p>
                          <p className="font-medium text-sm text-[#000000] font-inter">
                            {contract.quantity_kg?.toLocaleString()} kg
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-[#39B54A] mt-0.5" />
                        <div>
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Price per Unit</p>
                          <p className="font-semibold text-sm text-[#39B54A] font-inter">
                            {formatCurrency(contract.price_per_unit)}/kg
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-[#39B54A] mt-0.5" />
                        <div>
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Delivery Date</p>
                          <p className="font-medium text-sm text-[#000000] font-inter">
                            {new Date(contract.delivery_date || contract.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {contract.description && (
                      <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-4 line-clamp-2">
                        {contract.description}
                      </p>
                    )}

                    {contract.contract_eligibility_criteria && contract.contract_eligibility_criteria.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-[rgba(0,0,0,0.65)] font-inter mb-2">
                          Eligibility Criteria:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {contract.contract_eligibility_criteria.map((criteria: any) => (
                            <Badge
                              key={criteria.id}
                              variant="outline"
                              className="rounded-full font-inter text-xs border-[#39B54A] text-[#39B54A]"
                            >
                              {criteria.criteria_type.replace(/_/g, " ")}: {criteria.criteria_value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-[rgba(0,0,0,0.08)]">
                      <div className="text-sm font-inter">
                        <span className="text-[rgba(0,0,0,0.45)]">Total Value: </span>
                        <span className="font-semibold text-[#39B54A]">
                          {formatCurrency(contract.total_contract_value)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-[8px] border-[rgba(0,0,0,0.12)] font-inter bg-transparent"
                        >
                          <Link href={`/dashboard/contracts/${contract.id}`}>View Details</Link>
                        </Button>
                        {!hasApplied ? (
                          <Button
                            asChild
                            size="sm"
                            className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[8px] font-inter"
                          >
                            <Link
                              href={`/dashboard/contracts/available/${contract.id}/register${farmerProfile ? `?farmer_id=${farmerProfile.id}` : ""}`}
                            >
                              {userProfile?.role === "farmer" ? "Apply Now" : "Register Farmer"}
                            </Link>
                          </Button>
                        ) : registration.status === "rejected" ? (
                          <Button
                            asChild
                            size="sm"
                            className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[8px] font-inter"
                          >
                            <Link
                              href={`/dashboard/contracts/available/${contract.id}/register${farmerProfile ? `?farmer_id=${farmerProfile.id}` : ""}`}
                            >
                              Reapply
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled
                            className="bg-gray-300 text-gray-600 rounded-[8px] font-inter cursor-not-allowed"
                          >
                            {registration.status === "approved" ? "Approved" : "Applied"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
