import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react"
import FinancialRecordsClient from "@/components/financial-records-client"

export const dynamic = "force-dynamic"

export default async function FinancesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("id, role, organization_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!userProfile) {
    redirect("/auth/login")
  }

  // Get farmer ID if user is a farmer
  let farmerId: string | null = null
  if (userProfile.role === "farmer") {
    const { data: farmer } = await supabase.from("farmers").select("id").eq("user_id", user.id).maybeSingle()

    farmerId = farmer?.id || null
  }

  // Fetch financial summary
  let incomeQuery = supabase.from("farmer_income").select("amount, transaction_date, income_type")
  let expensesQuery = supabase.from("farmer_expenses").select("amount, transaction_date, expense_category")

  if (userProfile.role === "farmer" && farmerId) {
    incomeQuery = incomeQuery.eq("farmer_id", farmerId)
    expensesQuery = expensesQuery.eq("farmer_id", farmerId)
  } else if (userProfile.organization_id) {
    incomeQuery = incomeQuery.eq("organization_id", userProfile.organization_id)
    expensesQuery = expensesQuery.eq("organization_id", userProfile.organization_id)
  }

  const { data: income } = await incomeQuery
  const { data: expenses } = await expensesQuery

  const totalIncome = income?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
  const totalExpenses = expenses?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
  const netPosition = totalIncome - totalExpenses

  // Calculate last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentIncome =
    income
      ?.filter((item) => new Date(item.transaction_date) >= thirtyDaysAgo)
      .reduce((sum, item) => sum + Number(item.amount), 0) || 0

  const recentExpenses =
    expenses
      ?.filter((item) => new Date(item.transaction_date) >= thirtyDaysAgo)
      .reduce((sum, item) => sum + Number(item.amount), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-poppins font-semibold text-[#000000]">Financial Records</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            Track income, expenses, and build your financial history
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Total Income</CardTitle>
            <div className="h-10 w-10 rounded-full bg-[rgba(57,181,74,0.2)] flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-[#39B54A]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-[28px] font-bold font-poppins text-[#39B54A]">₦{totalIncome.toLocaleString()}</div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">
              ₦{recentIncome.toLocaleString()} last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Total Expenses</CardTitle>
            <div className="h-10 w-10 rounded-full bg-[rgba(255,107,107,0.2)] flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-[#FF6B6B]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-[28px] font-bold font-poppins text-[#FF6B6B]">₦{totalExpenses.toLocaleString()}</div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">
              ₦{recentExpenses.toLocaleString()} last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Net Position</CardTitle>
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${netPosition >= 0 ? "bg-[rgba(57,181,74,0.2)]" : "bg-[rgba(255,107,107,0.2)]"}`}
            >
              <DollarSign className={`h-5 w-5 ${netPosition >= 0 ? "text-[#39B54A]" : "text-[#FF6B6B]"}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-[28px] font-bold font-poppins ${netPosition >= 0 ? "text-[#39B54A]" : "text-[#FF6B6B]"}`}
            >
              ₦{Math.abs(netPosition).toLocaleString()}
            </div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">{netPosition >= 0 ? "Profit" : "Loss"}</p>
          </CardContent>
        </Card>

        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-inter text-[rgba(0,0,0,0.65)]">Transactions</CardTitle>
            <div className="h-10 w-10 rounded-full bg-[rgba(100,149,237,0.2)] flex items-center justify-center">
              <Receipt className="h-5 w-5 text-[#6495ED]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-[28px] font-bold font-poppins text-[rgba(0,0,0,0.87)]">
              {(income?.length || 0) + (expenses?.length || 0)}
            </div>
            <p className="text-xs font-inter text-[rgba(0,0,0,0.45)] mt-2">Total records</p>
          </CardContent>
        </Card>
      </div>

      <FinancialRecordsClient
        userRole={userProfile.role}
        farmerId={farmerId}
        organizationId={userProfile.organization_id}
      />
    </div>
  )
}
