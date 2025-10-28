"use server"

import { createClient } from "@supabase/supabase-js"

interface CreateOrganizationAccountParams {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  orgName: string
  orgType: string
  orgAddress: string
  orgState: string
  orgPhone: string
  orgEmail: string
}

export async function createOrganizationAccount(params: CreateOrganizationAccountParams) {
  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find((u) => u.email === params.email)

    if (existingUser) {
      // Check if this is an incomplete registration (no user record in users table)
      const { data: userRecord } = await supabaseAdmin
        .from("users")
        .select("id, organization_id")
        .eq("id", existingUser.id)
        .single()

      if (!userRecord) {
        // Incomplete registration - clean up the auth user
        console.log("[v0] Cleaning up incomplete registration for:", params.email)
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
      } else {
        if (!existingUser.email_confirmed_at) {
          console.log("[v0] Confirming email for existing user:", params.email)
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            email_confirm: true,
          })

          // Update user record to mark email as verified
          await supabaseAdmin.from("users").update({ email_verified: true }).eq("id", existingUser.id)

          return {
            success: true,
            message: "Your email has been confirmed. You can now sign in.",
            userId: existingUser.id,
            organizationId: userRecord.organization_id,
          }
        }

        // Complete registration exists with confirmed email
        throw new Error("An account with this email already exists. Please sign in instead.")
      }
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        first_name: params.firstName,
        last_name: params.lastName,
        phone: params.phone,
        role: "admin",
        account_type: "organization",
      },
    })

    if (authError) {
      console.error("[v0] Auth error:", authError)
      throw new Error(authError.message)
    }
    if (!authData.user) {
      throw new Error("Failed to create user account")
    }

    // Step 2: Create organization
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        org_name: params.orgName,
        org_type: params.orgType,
        address: params.orgAddress,
        state: params.orgState,
        contact_phone: params.orgPhone,
        contact_email: params.orgEmail,
        is_active: true,
        requires_approval: true,
        is_approved: false,
      })
      .select()
      .single()

    if (orgError) {
      console.error("[v0] Organization creation error:", orgError)
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(orgError.message)
    }
    if (!orgData) {
      throw new Error("Failed to create organization")
    }

    // Step 3: Create user record in users table
    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      role: "admin",
      organization_id: orgData.id,
      is_active: true,
      requires_approval: true,
      is_approved: false,
      email_verified: true,
      phone_verified: false,
    })

    if (userError) {
      console.error("[v0] User record creation error:", userError)
      // Rollback: delete organization and auth user
      await supabaseAdmin.from("organizations").delete().eq("id", orgData.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(userError.message)
    }

    return {
      success: true,
      userId: authData.user.id,
      organizationId: orgData.id,
    }
  } catch (error) {
    console.error("[v0] Create organization account error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during registration",
    }
  }
}
