"use server"

import { createClient } from "@supabase/supabase-js"

export async function deleteUserAccount(email: string) {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Starting account deletion for:", email)

    // 1. Find the auth user by email
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error("[v0] Error listing users:", listError)
      throw listError
    }

    const authUser = authUsers.users.find((u) => u.email === email)

    if (!authUser) {
      console.log("[v0] No auth user found with email:", email)
      return { success: true, message: "No user found with that email" }
    }

    console.log("[v0] Found auth user:", authUser.id)

    // 2. Find the user record in the database
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, organization_id")
      .eq("id", authUser.id)
      .single()

    if (userError && userError.code !== "PGRST116") {
      console.error("[v0] Error fetching user record:", userError)
    }

    // 3. If user has an organization, delete it
    if (userRecord?.organization_id) {
      console.log("[v0] Deleting organization:", userRecord.organization_id)

      const { error: orgError } = await supabaseAdmin
        .from("organizations")
        .delete()
        .eq("id", userRecord.organization_id)

      if (orgError) {
        console.error("[v0] Error deleting organization:", orgError)
      }
    }

    // 4. Delete the user record from the database
    if (userRecord) {
      console.log("[v0] Deleting user record:", userRecord.id)

      const { error: deleteUserError } = await supabaseAdmin.from("users").delete().eq("id", userRecord.id)

      if (deleteUserError) {
        console.error("[v0] Error deleting user record:", deleteUserError)
      }
    }

    // 5. Delete the auth user
    console.log("[v0] Deleting auth user:", authUser.id)

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id)

    if (deleteAuthError) {
      console.error("[v0] Error deleting auth user:", deleteAuthError)
      throw deleteAuthError
    }

    console.log("[v0] Successfully deleted account:", email)

    return {
      success: true,
      message: `Successfully deleted account for ${email}`,
    }
  } catch (error) {
    console.error("[v0] Delete account error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete account",
    }
  }
}
