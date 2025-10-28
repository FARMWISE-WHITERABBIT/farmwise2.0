"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

interface CreateOrganizationParams {
  org_name: string
  org_type: string
  contact_email: string
  contact_phone: string
  address?: string
  state: string
  country: string
  subscription_tier?: string
  max_users?: number
}

export async function createOrganization(params: CreateOrganizationParams) {
  try {
    console.log("[v0] Starting organization creation...")

    // First, verify the user is authenticated and is a super_admin
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Auth error or no user:", authError)
      return {
        success: false,
        error: "You must be logged in to create an organization",
      }
    }

    console.log("[v0] User authenticated:", user.id)

    // Check if user is a super_admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.log("[v0] User lookup error:", userError)
      return {
        success: false,
        error: "Failed to verify user permissions",
      }
    }

    console.log("[v0] User role:", userData.role)

    // Only super_admins can create new organizations
    if (userData.role !== "super_admin") {
      return {
        success: false,
        error: "Only super administrators can create new organizations",
      }
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Creating organization with admin client...")

    // Create the organization using admin client (bypasses RLS)
    const { data: organization, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert([
        {
          org_name: params.org_name,
          org_type: params.org_type,
          contact_email: params.contact_email,
          contact_phone: params.contact_phone,
          address: params.address || "",
          state: params.state,
          country: params.country,
          subscription_tier: params.subscription_tier || "basic",
          max_users: params.max_users || 5,
          is_active: true,
        },
      ])
      .select()
      .single()

    if (orgError) {
      console.error("[v0] Organization creation error:", orgError)
      return {
        success: false,
        error: orgError.message || "Failed to create organization",
      }
    }

    console.log("[v0] Organization created successfully:", organization.id)
    // </CHANGE>

    // Revalidate the organizations page
    revalidatePath("/dashboard/organizations")

    return {
      success: true,
      data: organization,
    }
  } catch (error: any) {
    console.error("[v0] Create organization error:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}
