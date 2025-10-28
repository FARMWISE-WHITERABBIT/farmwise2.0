import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Contract Management | Farmwise",
  description: "Manage offtake agreements and supply contracts",
}

export default async function ContractsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch all contracts
  const { data: allContracts } = await supabase
    .from("contracts")
    .select(
      `
      *,
      farmers(first_name, last_name, farmer_id),
      buyer_organizations:organizations!contracts_buyer_organization_id_fkey(org_name)
    `,
    )
    .order("created_at", { ascending: false })

  // Group by status
  const activeContracts = allContracts?.filter((c) => c.status === "active") || []
  const draftContracts = allContracts?.filter((c) => c.status === "draft" || c.status === "pending_approval") || []
  const completedContracts = allContracts?.filter((c) => c.status === "fulfilled") || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
      case "fulfilled":
        return "bg-blue-100 text-blue-700"
      case "draft":
      case "pending_approval":
        return "bg-yellow-100 text-yellow-700"
      case "breached":
      case "terminated":
        return "bg-red-100 text-red-700"
      case "expired":
        return "bg-gray-100 text-gray-700"
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
            <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Contract Management</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              Manage offtake agreements and supply contracts
            </p>
          </div>
          <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
            <Link href="/dashboard/contracts/new">
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Total Contracts</p>
                  <p className="text-3xl font-poppins font-semibold text-[#000000] mt-2">{allContracts?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Active</p>
                  <p className="text-3xl font-poppins font-semibold text-[#39B54A] mt-2">{activeContracts.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-[#39B54A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Pending</p>
                  <p className="text-3xl font-poppins font-semibold text-yellow-600 mt-2">{draftContracts.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Completed</p>
                  <p className="text-3xl font-poppins font-semibold text-blue-600 mt-2">{completedContracts.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
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
                  placeholder="Search by contract number, farmer name, or crop type..."
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
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white rounded-[15px] p-1 shadow-sm">
            <TabsTrigger
              value="all"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              All ({allContracts?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Active ({activeContracts.length})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Pending ({draftContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {!allContracts || allContracts.length === 0 ? (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                    <FileText className="h-8 w-8 text-[#39B54A]" />
                  </div>
                  <h3 className="font-poppins text-xl font-semibold mb-2">No contracts yet</h3>
                  <p className="text-[rgba(0,0,0,0.65)] font-inter mb-6">
                    Start by creating your first contract agreement
                  </p>
                  <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                    <Link href="/dashboard/contracts/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Contract
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {allContracts.map((contract: any) => (
                  <Card
                    key={contract.id}
                    className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-poppins font-semibold text-lg text-[#000000]">{contract.title}</h3>
                            <Badge className={`rounded-full font-inter text-xs ${getStatusColor(contract.status)}`}>
                              {contract.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">
                            Contract #{contract.contract_number}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter">
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Farmer</p>
                              <p className="font-medium text-[#000000]">
                                {contract.farmers?.first_name} {contract.farmers?.last_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Crop</p>
                              <p className="font-medium text-[#000000]">{contract.crop_type || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Contract Value</p>
                              <p className="font-semibold text-[#39B54A]">
                                {formatCurrency(contract.total_contract_value)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">End Date</p>
                              <p className="font-medium text-[#000000]">
                                {new Date(contract.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {contract.fulfillment_percentage > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-[rgba(0,0,0,0.65)] mb-1">
                                <span>Fulfillment Progress</span>
                                <span>{contract.fulfillment_percentage}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#39B54A] transition-all"
                                  style={{ width: `${contract.fulfillment_percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                        >
                          <Link href={`/dashboard/contracts/${contract.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeContracts.length === 0 ? (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-[rgba(0,0,0,0.45)] font-inter">No active contracts</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeContracts.map((contract: any) => (
                  <Card
                    key={contract.id}
                    className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-poppins font-semibold text-lg text-[#000000]">{contract.title}</h3>
                            <Badge className="rounded-full font-inter text-xs bg-[rgba(57,181,74,0.1)] text-[#39B54A]">
                              Active
                            </Badge>
                          </div>
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">
                            Contract #{contract.contract_number}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter">
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Farmer</p>
                              <p className="font-medium text-[#000000]">
                                {contract.farmers?.first_name} {contract.farmers?.last_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Crop</p>
                              <p className="font-medium text-[#000000]">{contract.crop_type || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Contract Value</p>
                              <p className="font-semibold text-[#39B54A]">
                                {formatCurrency(contract.total_contract_value)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">End Date</p>
                              <p className="font-medium text-[#000000]">
                                {new Date(contract.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {contract.fulfillment_percentage > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-[rgba(0,0,0,0.65)] mb-1">
                                <span>Fulfillment Progress</span>
                                <span>{contract.fulfillment_percentage}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#39B54A] transition-all"
                                  style={{ width: `${contract.fulfillment_percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                        >
                          <Link href={`/dashboard/contracts/${contract.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {draftContracts.length === 0 ? (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-[rgba(0,0,0,0.45)] font-inter">No pending contracts</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {draftContracts.map((contract: any) => (
                  <Card
                    key={contract.id}
                    className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-poppins font-semibold text-lg text-[#000000]">{contract.title}</h3>
                            <Badge className="rounded-full font-inter text-xs bg-yellow-100 text-yellow-700">
                              {contract.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">
                            Contract #{contract.contract_number}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter">
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Farmer</p>
                              <p className="font-medium text-[#000000]">
                                {contract.farmers?.first_name} {contract.farmers?.last_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Crop</p>
                              <p className="font-medium text-[#000000]">{contract.crop_type || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">Contract Value</p>
                              <p className="font-semibold text-[#000000]">
                                {formatCurrency(contract.total_contract_value)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[rgba(0,0,0,0.45)] text-xs">End Date</p>
                              <p className="font-medium text-[#000000]">
                                {new Date(contract.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                        >
                          <Link href={`/dashboard/contracts/${contract.id}`}>Review</Link>
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
