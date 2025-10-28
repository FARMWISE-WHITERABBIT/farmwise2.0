"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { grantFinancialPermission, revokeFinancialPermission } from "@/lib/services/financial-permissions"
import { UserPlus, Loader2 } from "lucide-react"

interface Agent {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Permission {
  id: string
  agent_id: string
  can_edit_income: boolean
  can_edit_expenses: boolean
}

interface FinancialPermissionsManagerProps {
  farmerId: string
  currentPermissions: Permission[]
  availableAgents: Agent[]
}

export default function FinancialPermissionsManager({
  farmerId,
  currentPermissions,
  availableAgents,
}: FinancialPermissionsManagerProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [canEditIncome, setCanEditIncome] = useState(true)
  const [canEditExpenses, setCanEditExpenses] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleGrantPermission = async () => {
    if (!selectedAgent) return

    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const result = await grantFinancialPermission(
        supabase,
        farmerId,
        selectedAgent,
        user.id,
        canEditIncome,
        canEditExpenses,
      )

      if (result.success) {
        alert("Permission granted successfully!")
        window.location.reload()
      } else {
        alert(`Failed to grant permission: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Error granting permission:", error)
      alert("Failed to grant permission. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRevokePermission = async (agentId: string) => {
    if (!confirm("Are you sure you want to revoke this permission?")) return

    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const result = await revokeFinancialPermission(supabase, farmerId, agentId, user.id)

      if (result.success) {
        alert("Permission revoked successfully!")
        window.location.reload()
      } else {
        alert(`Failed to revoke permission: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Error revoking permission:", error)
      alert("Failed to revoke permission. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Filter out agents who already have permissions
  const agentsWithoutPermission = availableAgents.filter(
    (agent) => !currentPermissions.some((p) => p.agent_id === agent.id),
  )

  return (
    <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-poppins">Grant New Permission</CardTitle>
        <CardDescription className="font-inter">
          Allow an extension agent to help manage your financial records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {agentsWithoutPermission.length === 0 ? (
          <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-4">
            All available extension agents already have permissions
          </p>
        ) : (
          <>
            <div>
              <Label>Select Extension Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agentsWithoutPermission.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name} ({agent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="income"
                  checked={canEditIncome}
                  onCheckedChange={(checked) => setCanEditIncome(!!checked)}
                />
                <label htmlFor="income" className="text-sm font-inter text-[rgba(0,0,0,0.87)] cursor-pointer">
                  Can add and edit income records
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="expenses"
                  checked={canEditExpenses}
                  onCheckedChange={(checked) => setCanEditExpenses(!!checked)}
                />
                <label htmlFor="expenses" className="text-sm font-inter text-[rgba(0,0,0,0.87)] cursor-pointer">
                  Can add and edit expense records
                </label>
              </div>
            </div>

            <Button
              onClick={handleGrantPermission}
              disabled={!selectedAgent || loading || (!canEditIncome && !canEditExpenses)}
              className="w-full bg-[#39B54A] hover:bg-[#2d8f3a] text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserPlus className="mr-2 h-4 w-4" />
              Grant Permission
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
