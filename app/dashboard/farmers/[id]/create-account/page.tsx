import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import CreateFarmerAccountForm from "@/components/forms/create-farmer-account-form"

export default async function CreateFarmerAccountPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check user role - only field agents and admins can create farmer accounts
  const { data: currentUser } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!currentUser || !["super_admin", "admin", "manager", "field_agent"].includes(currentUser.role)) {
    redirect("/dashboard/farmers")
  }

  // Fetch farmer details
  const { data: farmer } = await supabase.from("farmers").select("*").eq("id", params.id).single()

  if (!farmer) {
    redirect("/dashboard/farmers")
  }

  // Check if farmer already has an account
  if (farmer.user_id) {
    redirect(`/dashboard/farmers/${params.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href={`/dashboard/farmers/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-[32px] font-semibold font-poppins text-[rgba(0,0,0,0.87)]">Create Farmer Account</h1>
          <p className="text-sm font-inter text-[rgba(0,0,0,0.65)]">
            Create a user account for {farmer.first_name} {farmer.last_name}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-[#39B54A] bg-[rgba(57,181,74,0.05)] rounded-[20px]">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">About Farmer Accounts</CardTitle>
          <CardDescription className="font-inter">
            Creating a user account allows farmers to access the platform with limited functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm font-inter text-[rgba(0,0,0,0.65)]">
          <p>✓ View their own farm plots and activities</p>
          <p>✓ Browse and apply for available contracts</p>
          <p>✓ View their loan applications and status</p>
          <p>✓ Update their contact information</p>
          <p>✓ Receive notifications about their farming activities</p>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">Account Details</CardTitle>
          <CardDescription className="font-inter">
            Enter the login credentials for this farmer's account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateFarmerAccountForm farmer={farmer} />
        </CardContent>
      </Card>
    </div>
  )
}
