export type UserRole = "super_admin" | "admin" | "manager" | "field_agent" | "analyst" | "viewer" | "farmer"

export interface UserPermissions {
  all?: boolean
  manage_users?: boolean
  manage_organizations?: boolean
  view_all_data?: boolean
  export_data?: boolean
  system_settings?: boolean
  manage_farmers?: boolean
  manage_plots?: boolean
  manage_activities?: boolean
  manage_loans?: boolean
  manage_contracts?: boolean
  view_analytics?: boolean
}

export const rolePermissions: Record<UserRole, UserPermissions> = {
  super_admin: {
    all: true,
    manage_users: true,
    manage_organizations: true,
    view_all_data: true,
    export_data: true,
    system_settings: true,
    manage_farmers: true,
    manage_plots: true,
    manage_activities: true,
    manage_loans: true,
    manage_contracts: true,
    view_analytics: true,
  },
  admin: {
    manage_users: true,
    view_all_data: true,
    export_data: true,
    manage_farmers: true,
    manage_plots: true,
    manage_activities: true,
    manage_loans: true,
    manage_contracts: true,
    view_analytics: true,
  },
  manager: {
    view_all_data: true,
    export_data: true,
    manage_farmers: true,
    manage_plots: true,
    manage_activities: true,
    view_analytics: true,
  },
  field_agent: {
    manage_farmers: true,
    manage_plots: true,
    manage_activities: true,
  },
  analyst: {
    view_all_data: true,
    export_data: true,
    view_analytics: true,
  },
  viewer: {
    view_all_data: true,
  },
  farmer: {},
}

export function hasPermission(userRole: UserRole, permission: keyof UserPermissions): boolean {
  const permissions = rolePermissions[userRole]
  return permissions.all === true || permissions[permission] === true
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Super admin can access everything
  if (userRole === "super_admin") return true

  // Define route access by role
  const routeAccess: Record<string, UserRole[]> = {
    "/dashboard": ["super_admin", "admin", "manager", "field_agent", "analyst", "viewer"],
    "/dashboard/farmers": ["super_admin", "admin", "manager", "field_agent"],
    "/dashboard/farmers/new": ["super_admin", "admin", "manager", "field_agent"],
    "/dashboard/plots": ["super_admin", "admin", "manager", "field_agent"],
    "/dashboard/plots/new": ["super_admin", "admin", "manager", "field_agent"],
    "/dashboard/activities": ["super_admin", "admin", "manager", "field_agent"],
    "/dashboard/activities/new": ["super_admin", "admin", "manager", "field_agent"],
    "/dashboard/traceability": ["super_admin", "admin", "manager", "field_agent"],
    "/dashboard/traceability/new": ["super_admin", "admin", "manager", "field_agent"],
    "/dashboard/organizations": ["super_admin", "admin", "manager"],
    "/dashboard/organizations/new": ["super_admin", "admin"],
    "/dashboard/agents": ["super_admin", "admin", "manager"],
    "/dashboard/agents/new": ["super_admin", "admin"],
    "/dashboard/loans": ["super_admin", "admin", "manager"],
    "/dashboard/loans/new": ["super_admin", "admin", "manager"],
    "/dashboard/contracts": ["super_admin", "admin", "manager"],
    "/dashboard/contracts/new": ["super_admin", "admin"],
    "/dashboard/contracts/available": ["super_admin", "admin", "manager", "field_agent", "farmer"],
    "/dashboard/yield": ["super_admin", "admin", "manager", "analyst"],
    "/dashboard/reports": ["super_admin", "admin", "manager", "analyst"],
    "/dashboard/notifications": ["super_admin", "admin", "manager", "field_agent", "analyst", "viewer"],
    "/dashboard/analytics": ["super_admin", "admin", "manager", "analyst"],
    "/dashboard/users": ["super_admin", "admin"],
    "/dashboard/settings": ["super_admin", "admin"],
    "/dashboard/finance/credit-profiles": ["super_admin", "admin", "manager"],
    "/dashboard/finance/repayments": ["super_admin", "admin", "manager"],
    "/dashboard/finance/analytics": ["super_admin", "admin", "manager", "analyst"],
  }

  const allowedRoles = routeAccess[route] || []
  return allowedRoles.includes(userRole)
}

export function canPerformAction(userRole: UserRole | undefined, action: keyof UserPermissions): boolean {
  if (!userRole) return false
  return hasPermission(userRole, action)
}
