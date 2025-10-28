import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ContractRegistrationForm from "@/components/forms/contract-registration-form"

export default async function RegisterForContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ farmer_id?: string }>
}) {
  const { id } = await params
  const { farmer_id } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: userProfile } = await supabase.from("users").select("role, organization_id").eq("id", user.id).single()

  // Get contract details
  const { data: contract } = await supabase
    .from("contracts")
    .select(
      `
      *,
      buyer_organizations:organizations!contracts_buyer_organization_id_fkey(org_name),
      contract_eligibility_criteria(*)
    `,
    )
    .eq("id", id)
    .single()

  if (!contract) {
    redirect("/dashboard/contracts/available")
  }

  // Get farmer profile if user is a farmer or if farmer_id is provided
  let farmerProfile = null
  if (farmer_id) {
    const { data } = await supabase.from("farmers").select("*").eq("id", farmer_id).single()
    farmerProfile = data
  } else if (userProfile?.role === "farmer") {
    const { data } = await supabase.from("farmers").select("*").eq("user_id", user.id).single()
    farmerProfile = data
  }

  // Get all farmers if user is an extension agent (for selection)
  let allFarmers = null
  if (userProfile?.role === "extension_agent") {
    const { data } = await supabase.from("farmers").select("*").order("first_name")
    allFarmers = data
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/dashboard/contracts/available">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Available Contracts
            </Link>
          </Button>
          <h1 className="text-2xl font-poppins font-semibold text-[#000000]">
            {userProfile?.role === "farmer" ? "Apply for Contract" : "Register Farmer for Contract"}
          </h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            Complete the registration form to apply for this contract opportunity
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contract Details */}
          <Card className="rounded-[25px] border-none shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-poppins text-lg">Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Contract Title</p>
                <p className="font-medium text-sm text-[#000000] font-inter">{contract.title}</p>
              </div>
              <div>
                <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Contract Number</p>
                <p className="font-medium text-sm text-[#000000] font-inter">{contract.contract_number}</p>
              </div>
              <div>
                <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Crop Type</p>
                <p className="font-medium text-sm text-[#000000] font-inter">
                  {contract.crop_type}
                  {contract.variety && ` (${contract.variety})`}
                </p>
              </div>
              <div>
                <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Quantity Needed</p>
                <p className="font-medium text-sm text-[#000000] font-inter">
                  {contract.quantity_kg?.toLocaleString()} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Price per Unit</p>
                <p className="font-semibold text-sm text-[#39B54A] font-inter">
                  ₦{contract.price_per_unit?.toLocaleString()}/kg
                </p>
              </div>
              {contract.contract_eligibility_criteria && contract.contract_eligibility_criteria.length > 0 && (
                <div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-2">Eligibility Criteria</p>
                  <ul className="space-y-1">
                    {contract.contract_eligibility_criteria.map((criteria: any) => (
                      <li key={criteria.id} className="text-xs text-[#000000] font-inter flex items-start gap-1">
                        <span className="text-[#39B54A]">•</span>
                        <span>
                          {criteria.criteria_type.replace(/_/g, " ")}: {criteria.criteria_value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <ContractRegistrationForm
              contractId={id}
              contract={contract}
              farmerProfile={farmerProfile}
              allFarmers={allFarmers}
              userRole={userProfile?.role || ""}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
