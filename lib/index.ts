// Auth
export { hasPermission, canAccessRoute, canPerformAction, rolePermissions } from "./auth/roles"
export { applyDataIsolation, canEdit, isViewOnly, getUserContext } from "./auth/data-isolation"
export type { UserRole, UserPermissions } from "./auth/roles"
export type { UserContext } from "./auth/data-isolation"

// Supabase
export { createClient as createBrowserClient } from "./supabase/client"
export { createClient as createServerClient, getAuthUser } from "./supabase/server"
export { checkSupabaseConnection } from "./supabase/health-check"

// Types
export type { Organization, User, Farmer, FarmPlot, FarmActivity, Notification } from "./types/database"

// Utils
export { cn } from "./utils"
export { formatDate, formatCurrency, formatNumber, formatFileSize } from "./utils/format"
export { isValidEmail, isValidPhone, isValidCoordinates, sanitizeInput } from "./utils/validation"
export { calculatePolygonArea, formatCoordinates, calculateDistance } from "./utils/geo"

// Constants
export { CROP_CATEGORIES, getAllCrops, getCropsByCategory } from "./constants/crops"
export type { CropCategory } from "./constants/crops"
export {
  NIGERIAN_STATES_AND_LGAS,
  NIGERIA_STATES_LGAS,
  NIGERIA_STATES,
  getLGAsForState,
} from "./data/nigeria-states-lgas"
export type { NigeriaState, NigeriaLGA } from "./data/nigeria-states-lgas"

// Weather
export { getWeatherData, getWeatherIcon } from "./weather"
export type { WeatherData } from "./weather"

// Services
export {
  checkFinancialPermission,
  grantFinancialPermission,
  revokeFinancialPermission,
  getAgentPermissions,
} from "./services/financial-permissions"

// Offline
export { offlineDB } from "./offline/db"
export { syncManager } from "./offline/sync-manager"
export type { OfflineRecord } from "./offline/db"
