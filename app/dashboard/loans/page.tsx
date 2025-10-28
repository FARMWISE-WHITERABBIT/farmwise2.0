import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, DollarSign } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = {
  title: "Loan Management | Farmwise",
  description: "Manage farmer loan applications and repayments",
}

export default async function LoansPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch all loan applications
  const { data: allLoans } = await supabase
    .from("loan_applications")
    .select(
      `
      *,
      farmers(first_name, last_name, farmer_id, primary_phone),
      loan_products(product_name)
    `,
    )
    .order("created_at", { ascending: false })

  // Group by status
  const pendingLoans = allLoans?.filter((loan) => loan.status === "pending") || []
  const approvedLoans = allLoans?.filter((loan) => loan.status === "approved" || loan.status === "disbursed") || []
  const rejectedLoans = allLoans?.filter((loan) => loan.status === "rejected") || []

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

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Loan Management</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              Manage farmer loan applications and repayments
            </p>
          </div>
          <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
            <Link href="/dashboard/loans/new">
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Total Applications</p>
                  <p className="text-3xl font-poppins font-semibold text-[#000000] mt-2">{allLoans?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Pending</p>
                  <p className="text-3xl font-poppins font-semibold text-yellow-600 mt-2">{pendingLoans.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Approved</p>
                  <p className="text-3xl font-poppins font-semibold text-[#39B54A] mt-2">{approvedLoans.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Rejected</p>
                  <p className="text-3xl font-poppins font-semibold text-red-600 mt-2">{rejectedLoans.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 rounded-[25px] border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.45)]" />
                <Input
                  placeholder="Search by farmer name, application number..."
                  className="pl-10 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                />
              </div>
              <Button variant="outline" className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-transparent">
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loans List */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white rounded-[15px] p-1 shadow-sm">
            <TabsTrigger
              value="all"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              All ({allLoans?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Pending ({pendingLoans.length})
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Approved ({approvedLoans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {!allLoans || allLoans.length === 0 ? (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                    <DollarSign className="h-8 w-8 text-[#39B54A]" />
                  </div>
                  <h3 className="font-poppins text-xl font-semibold mb-2">No loan applications yet</h3>
                  <p className="text-[rgba(0,0,0,0.65)] font-inter mb-6">Start by creating a new loan application</p>
                  <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                    <Link href="/dashboard/loans/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Application
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {allLoans.map((loan: any) => (
                  <Card
                    key={loan.id}
                    className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-poppins font-semibold text-lg text-[#000000]">
                              {loan.farmers?.first_name} {loan.farmers?.last_name}
                            </h3>
                            <Badge className={`rounded-full font-inter text-xs ${getStatusColor(loan.status)}`}>
                              {loan.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">
                            Application #{loan.application_number}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter">
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Requested Amount</p>
                              <p className="font-semibold text-[#000000]">{formatCurrency(loan.requested_amount)}</p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Product</p>
                              <p className="font-medium text-[#000000]">{loan.loan_products?.product_name || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Submitted</p>
                              <p className="font-medium text-[#000000]">
                                {new Date(loan.submitted_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Farmer ID</p>
                              <p className="font-medium text-[#000000]">{loan.farmers?.farmer_id}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                        >
                          <Link href={`/dashboard/loans/${loan.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingLoans.length === 0 ? (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-[rgba(0,0,0,0.45)] font-inter">No pending applications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingLoans.map((loan: any) => (
                  <Card
                    key={loan.id}
                    className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-poppins font-semibold text-lg text-[#000000]">
                              {loan.farmers?.first_name} {loan.farmers?.last_name}
                            </h3>
                            <Badge className="rounded-full font-inter text-xs bg-yellow-100 text-yellow-700">
                              {loan.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">
                            Application #{loan.application_number}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter">
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Requested Amount</p>
                              <p className="font-semibold text-[#000000]">{formatCurrency(loan.requested_amount)}</p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Product</p>
                              <p className="font-medium text-[#000000]">{loan.loan_products?.product_name || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Submitted</p>
                              <p className="font-medium text-[#000000]">
                                {new Date(loan.submitted_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Farmer ID</p>
                              <p className="font-medium text-[#000000]">{loan.farmers?.farmer_id}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                        >
                          <Link href={`/dashboard/loans/${loan.id}`}>Review</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedLoans.length === 0 ? (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-[rgba(0,0,0,0.45)] font-inter">No approved applications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {approvedLoans.map((loan: any) => (
                  <Card
                    key={loan.id}
                    className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-poppins font-semibold text-lg text-[#000000]">
                              {loan.farmers?.first_name} {loan.farmers?.last_name}
                            </h3>
                            <Badge className="rounded-full font-inter text-xs bg-[rgba(57,181,74,0.1)] text-[#39B54A]">
                              {loan.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">
                            Application #{loan.application_number}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter">
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Approved Amount</p>
                              <p className="font-semibold text-[#39B54A]">
                                {formatCurrency(loan.approved_amount || loan.requested_amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Product</p>
                              <p className="font-medium text-[#000000]">{loan.loan_products?.product_name || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Approved Date</p>
                              <p className="font-medium text-[#000000]">
                                {loan.approved_date ? new Date(loan.approved_date).toLocaleDateString() : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Farmer ID</p>
                              <p className="font-medium text-[#000000]">{loan.farmers?.farmer_id}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                        >
                          <Link href={`/dashboard/loans/${loan.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
