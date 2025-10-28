import type { SupabaseClient } from "@supabase/supabase-js"

export interface UserContext {
  userId: string
  role: string
  organizationId?: string
}

/**
 * Apply organization-based data isolation to queries
 * Super admins see all data, others see only their organization's data
 */
export function applyDataIsolation<T>(
  query: any,
  userContext: UserContext,
  organizationField = "organization_id",
): any {
  // Super admin can see all data
  if (userContext.role === "super_admin") {
    return query
  }

  // All other users see only their organization's data
  if (userContext.organizationId) {
    return query.eq(organizationField, userContext.organizationId)
  }

  return query
}

/**
 * Check if user can edit based on their role
 */
export function canEdit(role: string): boolean {
  return ["super_admin", "admin", "manager", "field_agent"].includes(role)
}

/**
 * Check if user can only view (no edit permissions)
 */
export function isViewOnly(role: string): boolean {
  return ["viewer", "analyst"].includes(role)
}

/**
 * Get user context from Supabase
 */
export async function getUserContext(supabase: SupabaseClient): Promise<UserContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userProfile } = await supabase.from("users").select("role, organization_id").eq("id", user.id).single()

  if (!userProfile) return null

  return {
    userId: user.id,
    role: userProfile.role,
    organizationId: userProfile.organization_id,
  }
}
