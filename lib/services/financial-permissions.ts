import type { SupabaseClient } from "@supabase/supabase-js"

export async function checkFinancialPermission(
  supabase: SupabaseClient,
  agentId: string,
  farmerId: string,
  permissionType: "income" | "expenses",
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("farmer_financial_permissions")
      .select("can_edit_income, can_edit_expenses, is_active")
      .eq("farmer_id", farmerId)
      .eq("agent_id", agentId)
      .eq("is_active", true)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error checking financial permission:", error)
      return false
    }

    if (!data) return false

    return permissionType === "income" ? data.can_edit_income : data.can_edit_expenses
  } catch (error) {
    console.error("[v0] Error in checkFinancialPermission:", error)
    return false
  }
}

export async function grantFinancialPermission(
  supabase: SupabaseClient,
  farmerId: string,
  agentId: string,
  grantedBy: string,
  canEditIncome = true,
  canEditExpenses = true,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("farmer_financial_permissions").upsert(
      {
        farmer_id: farmerId,
        agent_id: agentId,
        can_edit_income: canEditIncome,
        can_edit_expenses: canEditExpenses,
        granted_by: grantedBy,
        granted_at: new Date().toISOString(),
        is_active: true,
        notes: notes || "Permission granted by farmer",
      },
      {
        onConflict: "farmer_id,agent_id",
      },
    )

    if (error) {
      console.error("[v0] Error granting permission:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in grantFinancialPermission:", error)
    return { success: false, error: "Failed to grant permission" }
  }
}

export async function revokeFinancialPermission(
  supabase: SupabaseClient,
  farmerId: string,
  agentId: string,
  revokedBy: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("farmer_financial_permissions")
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
      })
      .eq("farmer_id", farmerId)
      .eq("agent_id", agentId)

    if (error) {
      console.error("[v0] Error revoking permission:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in revokeFinancialPermission:", error)
    return { success: false, error: "Failed to revoke permission" }
  }
}

export async function getAgentPermissions(
  supabase: SupabaseClient,
  agentId: string,
): Promise<
  Array<{
    farmer_id: string
    farmer_name: string
    can_edit_income: boolean
    can_edit_expenses: boolean
    granted_at: string
  }>
> {
  try {
    const { data, error } = await supabase
      .from("farmer_financial_permissions")
      .select(
        `
        farmer_id,
        can_edit_income,
        can_edit_expenses,
        granted_at,
        farmers (
          first_name,
          last_name
        )
      `,
      )
      .eq("agent_id", agentId)
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Error fetching agent permissions:", error)
      return []
    }

    return (
      data?.map((p: any) => ({
        farmer_id: p.farmer_id,
        farmer_name: `${p.farmers.first_name} ${p.farmers.last_name}`,
        can_edit_income: p.can_edit_income,
        can_edit_expenses: p.can_edit_expenses,
        granted_at: p.granted_at,
      })) || []
    )
  } catch (error) {
    console.error("[v0] Error in getAgentPermissions:", error)
    return []
  }
}
