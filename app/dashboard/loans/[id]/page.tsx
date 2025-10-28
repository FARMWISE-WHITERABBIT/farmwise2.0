import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle, XCircle, Clock, User } from "lucide-react"
import Link from "next/link"

export default async function LoanDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch loan application details
  const { data: loan } = await supabase
    .from("loan_applications")
    .select(
      `
      *,
      farmers(
        id,
        farmer_id,
        first_name,
        last_name,
        primary_phone,
        email,
        credit_score,
        credit_rating,
        farm_size_hectares,
        primary_crop
      ),
      loan_products(product_name, interest_rate, max_amount, repayment_period_months),
      approved_by_user:users!loan_applications_approved_by_fkey(first_name, last_name),
      reviewed_by_user:users!loan_applications_reviewed_by_fkey(first_name, last_name)
    `,
    )
    .eq("id", params.id)
    .single()

  if (!loan) {
    redirect("/dashboard/loans")
  }

  // Fetch repayment schedule
  const { data: repayments } = await supabase
    .from("loan_repayments")
    .select("*")
    .eq("loan_application_id", params.id)
    .order("due_date", { ascending: true })

  // Fetch loan history
  const { data: history } = await supabase
    .from("loan_application_history")
    .select("*")
    .eq("loan_application_id", params.id)
    .order("changed_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "disbursed":
      case "completed":
        return "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
      case "pending":
      case "under_review":
        return "bg-yellow-100 text-yellow-700"
      case "rejected":
      case "defaulted":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const canApprove = loan.status === "pending" || loan.status === "under_review"

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            asChild
            variant="ghost"
            className="mb-4 text-[rgba(0,0,0,0.65)] hover:text-[#000000] hover:bg-[rgba(0,0,0,0.05)] rounded-[8px] font-inter"
          >
            <Link href="/dashboard/loans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Loans
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-poppins font-semibold text-[#000000]">
                  Loan Application #{loan.application_number}
                </h1>
                <Badge className={`rounded-full font-inter ${getStatusColor(loan.status)}`}>
                  {loan.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                Submitted on {new Date(loan.submitted_date).toLocaleDateString()}
              </p>
            </div>
            {canApprove && (
              <div className="flex gap-3">
                <form action={`/api/loans/${loan.id}/reject`} method="POST">
                  <Button
                    type="submit"
                    variant="outline"
                    className="rounded-[10px] border-red-300 text-red-600 hover:bg-red-50 font-inter bg-transparent"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </form>
                <form action={`/api/loans/${loan.id}/approve`} method="POST">
                  <Button
                    type="submit"
                    className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loan Details */}
            <Card className="rounded-[25px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Loan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter mb-1">Requested Amount</p>
                    <p className="text-xl font-poppins font-semibold text-[#000000]">
                      {formatCurrency(loan.requested_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter mb-1">Loan Product</p>
                    <p className="text-lg font-inter font-medium text-[#000000]">
                      {loan.loan_products?.product_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter mb-1">Interest Rate</p>
                    <p className="text-lg font-inter font-medium text-[#000000]">
                      {loan.loan_products?.interest_rate}% per annum
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter mb-1">Repayment Period</p>
                    <p className="text-lg font-inter font-medium text-[#000000]">
                      {loan.loan_products?.repayment_period_months} months
                    </p>
                  </div>
                </div>

                {loan.purpose && (
                  <div>
                    <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter mb-1">Purpose</p>
                    <p className="text-sm font-inter text-[#000000]">{loan.purpose}</p>
                  </div>
                )}

                {loan.collateral_description && (
                  <div>
                    <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter mb-1">Collateral</p>
                    <p className="text-sm font-inter text-[#000000]">{loan.collateral_description}</p>
                  </div>
                )}

                {loan.approved_amount && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter mb-1">Approved Amount</p>
                    <p className="text-2xl font-poppins font-semibold text-[#39B54A]">
                      {formatCurrency(loan.approved_amount)}
                    </p>
                    {loan.approved_date && (
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">
                        Approved on {new Date(loan.approved_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs for additional info */}
            <Tabs defaultValue="repayment" className="space-y-4">
              <TabsList className="bg-white rounded-[15px] p-1 shadow-sm">
                <TabsTrigger
                  value="repayment"
                  className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
                >
                  Repayment Schedule
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
                >
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="repayment">
                <Card className="rounded-[25px] border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-poppins text-lg">Repayment Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!repayments || repayments.length === 0 ? (
                      <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter text-center py-8">
                        No repayment schedule available yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {repayments.map((repayment: any, index: number) => (
                          <div
                            key={repayment.id}
                            className="flex items-center justify-between p-4 rounded-[15px] bg-[rgba(0,0,0,0.02)]"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                                <span className="font-poppins font-semibold text-[#39B54A]">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-inter font-medium text-[#000000]">
                                  {formatCurrency(repayment.amount_due)}
                                </p>
                                <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">
                                  Due: {new Date(repayment.due_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={`rounded-full font-inter text-xs ${
                                repayment.status === "paid"
                                  ? "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
                                  : repayment.status === "overdue"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {repayment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="rounded-[25px] border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-poppins text-lg">Application History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!history || history.length === 0 ? (
                      <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter text-center py-8">
                        No history available
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {history.map((entry: any) => (
                          <div key={entry.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                                <Clock className="h-4 w-4 text-[#39B54A]" />
                              </div>
                              <div className="w-px h-full bg-[rgba(0,0,0,0.12)] mt-2" />
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="font-inter font-medium text-[#000000]">{entry.status_change}</p>
                              <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-1">
                                {new Date(entry.changed_at).toLocaleString()}
                              </p>
                              {entry.notes && (
                                <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-2">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Farmer Info */}
            <Card className="rounded-[25px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Farmer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                    <User className="h-6 w-6 text-[#39B54A]" />
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-[#000000]">
                      {loan.farmers?.first_name} {loan.farmers?.last_name}
                    </p>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">ID: {loan.farmers?.farmer_id}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Phone</p>
                    <p className="text-sm font-inter text-[#000000]">{loan.farmers?.primary_phone}</p>
                  </div>
                  {loan.farmers?.email && (
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Email</p>
                      <p className="text-sm font-inter text-[#000000]">{loan.farmers?.email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Primary Crop</p>
                    <p className="text-sm font-inter text-[#000000]">{loan.farmers?.primary_crop || "N/A"}</p>
                  </div>
                  {loan.farmers?.farm_size_hectares && (
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Farm Size</p>
                      <p className="text-sm font-inter text-[#000000]">{loan.farmers.farm_size_hectares} hectares</p>
                    </div>
                  )}
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-transparent"
                >
                  <Link href={`/dashboard/farmers/${loan.farmers?.id}`}>View Full Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Credit Score */}
            {loan.farmers?.credit_score && (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Credit Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-[rgba(57,181,74,0.1)] mb-3">
                      <span className="text-3xl font-poppins font-bold text-[#39B54A]">
                        {loan.farmers.credit_score}
                      </span>
                    </div>
                    <p className="text-sm font-inter font-medium text-[#000000] capitalize">
                      {loan.farmers.credit_rating?.replace("_", " ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
