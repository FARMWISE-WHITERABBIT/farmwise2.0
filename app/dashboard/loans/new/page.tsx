import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Button from "@/components/ui/button"
import Link from "next/link"
import ArrowLeft from "@/components/icons/arrow-left"
import LoanApplicationForm from "@/components/forms/loan-application-form"

export default async function NewLoanPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: farmers } = await supabase
    .from("farmers")
    .select("id, farmer_id, first_name, last_name, primary_phone")
    .order("first_name", { ascending: true })

  const { data: loanProducts } = await supabase
    .from("loan_products")
    .select("*")
    .eq("is_active", true)
    .order("product_name", { ascending: true })

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
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
          <h1 className="text-2xl font-poppins font-semibold text-[#000000]">New Loan Application</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">Create a new loan application for a farmer</p>
        </div>

        <div className="max-w-3xl">
          <LoanApplicationForm farmers={farmers || []} loanProducts={loanProducts || []} />
        </div>
      </div>
    </div>
  )
}
