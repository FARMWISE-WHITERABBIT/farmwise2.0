import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, DollarSign, Percent, Calendar } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { canPerformAction } from "@/lib/auth/roles"

export const metadata = {
  title: "Loan Products | Farmwise",
  description: "Manage loan products and opportunities for farmers",
}

export default async function LoanProductsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("role, organization_id").eq("id", user.id).single()

  const canManageLoans = canPerformAction(userData?.role, "manage_loans")

  let query = supabase.from("loan_products").select("*, organizations(name)").order("created_at", { ascending: false })

  if (userData?.role !== "super_admin" && userData?.organization_id) {
    query = query.eq("organization_id", userData.organization_id)
  }

  const { data: loanProducts } = await query

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  return (
    <div className="flex-1 bg-background">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Loan Products</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage loan opportunities for farmers</p>
          </div>
          {canManageLoans && (
            <Button asChild className="bg-[#39b54a] hover:bg-[#2d8f3a]">
              <Link href="/dashboard/loan-products/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Loan Product
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-3xl font-semibold mt-2">{loanProducts?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Products</p>
                  <p className="text-3xl font-semibold mt-2">
                    {loanProducts?.filter((p: any) => p.is_active).length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Interest Rate</p>
                  <p className="text-3xl font-semibold mt-2">
                    {loanProducts && loanProducts.length > 0
                      ? (
                          loanProducts.reduce((sum: number, p: any) => sum + (p.interest_rate || 0), 0) /
                          loanProducts.length
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-3xl font-semibold mt-2">
                    {loanProducts && loanProducts.length > 0
                      ? Math.round(
                          loanProducts.reduce((sum: number, p: any) => sum + (p.repayment_period_months || 0), 0) /
                            loanProducts.length,
                        )
                      : 0}{" "}
                    mo
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loan Products List */}
        {!loanProducts || loanProducts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No loan products yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first loan product to start offering loans to farmers
              </p>
              {canManageLoans && (
                <Button asChild className="bg-[#39b54a] hover:bg-[#2d8f3a]">
                  <Link href="/dashboard/loan-products/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Product
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {loanProducts.map((product: any) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.product_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{product.organizations?.name}</p>
                    </div>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                      className="bg-green-100 text-green-700"
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{product.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Min Amount</p>
                      <p className="font-semibold">{formatCurrency(product.min_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max Amount</p>
                      <p className="font-semibold">{formatCurrency(product.max_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Interest Rate</p>
                      <p className="font-semibold">{product.interest_rate}% per annum</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-semibold">{product.repayment_period_months} months</p>
                    </div>
                  </div>

                  {product.target_crops && product.target_crops.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Target Crops</p>
                      <div className="flex flex-wrap gap-1">
                        {product.target_crops.map((crop: string) => (
                          <Badge key={crop} variant="outline" className="text-xs">
                            {crop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {canManageLoans && (
                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Link href={`/dashboard/loan-products/${product.id}/edit`}>Edit</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="flex-1 text-[#39b54a] hover:text-[#2d8f3a]">
                        <Link href={`/dashboard/loan-products/${product.id}`}>View Details</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
