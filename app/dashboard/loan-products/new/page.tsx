import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoanProductForm } from "@/components/loan-product-form"
import { canPerformAction } from "@/lib/auth/roles"

export const metadata = {
  title: "Create Loan Product | Farmwise",
  description: "Create a new loan product for farmers",
}

export default async function NewLoanProductPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("role, organization_id").eq("id", user.id).single()

  if (!canPerformAction(userData?.role, "manage_loans")) {
    redirect("/dashboard/loan-products")
  }

  return (
    <div className="flex-1 bg-background">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Create Loan Product</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up a new loan opportunity for farmers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loan Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <LoanProductForm userId={user.id} organizationId={userData?.organization_id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
