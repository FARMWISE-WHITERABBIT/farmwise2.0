"use client"
import { AgentRegistrationForm } from "@/components/agent-registration-form"
import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface NewAgentClientPageProps {
  userData: {
    organization_id: string
    role: string
  }
  organizations: Array<{ id: string; org_name: string }>
  hasAccess: boolean
}

export default function NewAgentClientPage({ userData, organizations, hasAccess }: NewAgentClientPageProps) {
  if (!hasAccess) {
    return (
      <div className="flex-1 bg-[#F5F5F5]">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Add New Extension Agent</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              Register a new extension agent to manage farmers
            </p>
          </div>

          <div className="max-w-3xl">
            <Card className="rounded-[25px] border-none shadow-sm border-red-200 bg-red-50">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-poppins text-xl font-semibold mb-2 text-red-900">Access Denied</h3>
                <p className="text-red-700 font-inter">
                  Only Administrators and Managers can create extension agents. Please contact your system administrator
                  if you need access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-xl font-poppins font-semibold text-[#000000]">Add New Extension Agent</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            Register a new extension agent to manage farmers
          </p>
        </div>

        <AgentRegistrationForm
          organizations={organizations}
          currentUserOrgId={userData.organization_id}
          currentUserRole={userData.role}
        />
      </div>
    </div>
  )
}
