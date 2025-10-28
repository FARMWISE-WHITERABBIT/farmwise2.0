// Database types for Farmwise platform

export interface Organization {
  id: string
  org_name: string
  org_type?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  state?: string
  country?: string
  logo_url?: string
  primary_color?: string
  subscription_tier?: string
  subscription_start_date?: string
  subscription_end_date?: string
  max_users?: number
  max_farmers?: number
  features_enabled?: Record<string, boolean>
  settings?: Record<string, any>
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface User {
  id: string
  organization_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  role: "super_admin" | "admin" | "manager" | "field_agent" | "analyst" | "viewer" | "farmer"
  permissions?: Record<string, any>
  is_active?: boolean
  email_verified?: boolean
  phone_verified?: boolean
  last_login?: string
  preferred_language?: string
  timezone?: string
  notifications_enabled?: boolean
  created_at?: string
  updated_at?: string
}

export interface Farmer {
  id: string
  farmer_id: string
  organization_id?: string
  user_id?: string
  title?: string
  first_name: string
  middle_name?: string
  last_name: string
  maiden_name?: string
  date_of_birth?: string
  gender?: string
  marital_status?: string
  primary_phone: string
  alternate_phone?: string
  email?: string
  whatsapp_number?: string
  residential_address?: string
  city_town?: string
  lga: string
  state: string
  country?: string
  nearest_landmark?: string
  gps_coordinates?: any
  bvn?: string
  nin?: string
  voters_card?: string
  drivers_license?: string
  id_card_photo_url?: string
  education_level?: string
  farming_experience_years?: number
  primary_occupation?: string
  farming_as?: string
  bank_name?: string
  account_number?: string
  account_name?: string
  bank_verification_status?: string
  spouse_name?: string
  spouse_phone?: string
  number_of_dependents?: number
  household_size?: number
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_phone?: string
  is_cooperative_member?: boolean
  cooperative_name?: string
  cooperative_id?: string
  member_number?: string
  leadership_position?: string
  total_farm_area_hectares?: number
  land_ownership_type?: string
  land_title_available?: boolean
  primary_crops?: string[]
  secondary_crops?: string[]
  livestock_kept?: string[]
  farming_method?: string
  irrigation_available?: boolean
  has_smartphone?: boolean
  internet_access?: string
  digital_literacy?: string
  estimated_annual_income?: number
  has_active_loan?: boolean
  credit_score?: number
  profile_photo_url?: string
  farmer_story?: string
  verification_status?: string
  verification_date?: string
  verified_by?: string
  account_status?: string
  last_activity_date?: string
  activity_score?: number
  registration_date?: string
  registration_source?: string
  registered_by?: string
  registration_location?: string
  preferred_language?: string
  preferred_contact_method?: string
  sms_notifications_enabled?: boolean
  notes?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
  deleted_at?: string
}

export interface FarmPlot {
  id: string
  farmer_id: string
  plot_name: string
  plot_code?: string
  size_hectares: number
  size_acres?: number
  boundaries?: any
  boundary_coordinates?: any
  center_point?: any
  elevation_meters?: number
  soil_type?: string
  soil_ph?: number
  irrigation_type?: string
  irrigation_coverage_percent?: number
  slope_degree?: number
  current_crop?: string
  planting_date?: string
  expected_harvest_date?: string
  crop_health_status?: string
  last_inspection_date?: string
  satellite_image_url?: string
  notes?: string
  status?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface FarmActivity {
  id: string
  farmer_id?: string
  plot_id?: string
  activity_type: string
  activity_date: string
  start_time?: string
  end_time?: string
  status?: string
  crop_type?: string
  crop_variety?: string
  crop_stage?: string
  seed_quantity?: number
  seed_unit?: string
  plant_spacing_cm?: number
  row_spacing_cm?: number
  planting_method?: string
  water_source?: string
  irrigation_duration_minutes?: number
  water_volume_liters?: number
  irrigation_method?: string
  pest_identified?: string
  pest_severity?: string
  pesticide_name?: string
  pesticide_dosage?: number
  pesticide_unit?: string
  application_method?: string
  fertilizer_type?: string
  fertilizer_name?: string
  fertilizer_quantity?: number
  fertilizer_unit?: string
  npk_ratio?: string
  quantity_harvested?: number
  harvest_unit?: string
  quality_grade?: string
  harvest_method?: string
  storage_location?: string
  labor_workers?: number
  labor_hours?: number
  labor_cost?: number
  equipment_used?: string[]
  total_cost?: number
  weather_condition?: string
  temperature_celsius?: number
  humidity_percent?: number
  rainfall_mm?: number
  photos?: string[]
  videos?: string[]
  voice_notes?: string[]
  notes?: string
  gps_coordinates?: any
  recorded_by?: string
  verified_by?: string
  verification_date?: string
  created_at?: string
  updated_at?: string
}

export interface Notification {
  id: string
  user_id: string
  farmer_id?: string
  notification_type: string
  type?: string
  reference_id?: string
  reference_type?: string
  title: string
  message: string
  priority?: string
  action_url?: string
  action_label?: string
  related_entity_type?: string
  related_entity_id?: string
  delivery_methods?: string[]
  email_sent?: boolean
  sms_sent?: boolean
  push_sent?: boolean
  is_read?: boolean
  read_at?: string
  is_dismissed?: boolean
  created_at?: string
  expires_at?: string
}

export type { Organization, User, Farmer, FarmPlot, FarmActivity }
