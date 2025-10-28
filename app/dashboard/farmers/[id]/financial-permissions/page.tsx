import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, UserCheck, Clock } from "lucide-react"
import FinancialPermissionsManager from "@/components/financial-permissions-manager"

export default async function FarmerFinancialPermissionsPage({ params }: { params: { id: string } }) {
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

  // Get farmer details
  const { data: farmer } = await supabase
    .from("farmers")
    .select("id, first_name, last_name, user_id, registered_by, organization_id")
    .eq("id", params.id)
    .maybeSingle()

  if (!farmer) {
    redirect("/dashboard/farmers")
  }

  // Check if current user is the farmer
  const isFarmer = farmer.user_id === user.id

  // Only farmers can manage their permissions
  if (!isFarmer && userProfile.role !== "super_admin") {
    redirect("/dashboard/farmers")
  }

  // Get current permissions
  const { data: permissions } = await supabase
    .from("farmer_financial_permissions")
    .select(
      `
      *,
      users!farmer_financial_permissions_agent_id_fkey (
        id,
        first_name,
        last_name,
        email
      )
    `,
    )
    .eq("farmer_id", params.id)
    .eq("is_active", true)

  // Get available agents from the same organization
  const { data: availableAgents } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("role", "field_agent")
    .eq("organization_id", farmer.organization_id)
    .eq("is_active", true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-poppins font-semibold text-[#000000]">Financial Record Permissions</h1>
        <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
          Manage which extension agents can edit your financial records
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-blue-50 border-blue-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-poppins font-semibold text-blue-900 mb-2">About Financial Permissions</p>
              <ul className="text-sm text-blue-800 font-inter space-y-1">
                <li>
                  • Extension agents who created your account automatically have permission to help manage your
                  financial records
                </li>
                <li>• You can grant or revoke permission to other extension agents at any time</li>
                <li>• Agents with permission can add income and expense records on your behalf</li>
                <li>• You maintain full control and can view all changes made by agents</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Permissions */}
      <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-poppins">Active Permissions</CardTitle>
          <CardDescription className="font-inter">
            Extension agents who can currently edit your financial records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!permissions || permissions.length === 0 ? (
            <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">
              No active permissions. Grant access to extension agents below.
            </p>
          ) : (
            <div className="space-y-3">
              {permissions.map((permission: any) => (
                <div key={permission.id} className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-[15px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[rgba(57,181,74,0.2)] flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-[#39B54A]" />
                    </div>
                    <div>
                      <p className="font-poppins font-semibold text-[#000000]">
                        {permission.users.first_name} {permission.users.last_name}
                      </p>
                      <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{permission.users.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex gap-2 mb-1">
                        {permission.can_edit_income && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Income</Badge>
                        )}
                        {permission.can_edit_expenses && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Expenses</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[rgba(0,0,0,0.45)] font-inter">
                        <Clock className="h-3 w-3" />
                        <span>Since {new Date(permission.granted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Manager */}
      <FinancialPermissionsManager
        farmerId={params.id}
        currentPermissions={permissions || []}
        availableAgents={availableAgents || []}
      />
    </div>
  )
}
