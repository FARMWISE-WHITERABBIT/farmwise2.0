import { createClient } from "@supabase/supabase-js"

/**
 * Cleanup script to completely remove a user account
 * Usage: Provide the email address of the account to delete
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function cleanupUser(email: string) {
  console.log(`[v0] Starting cleanup for email: ${email}`)

  try {
    // 1. Find the auth user
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error("[v0] Error listing users:", listError)
      return
    }

    const authUser = authUsers.users.find((u) => u.email === email)

    if (!authUser) {
      console.log("[v0] No auth user found with this email")
      return
    }

    console.log(`[v0] Found auth user: ${authUser.id}`)

    // 2. Find and delete user record from users table
    const { data: userRecord, error: userFetchError } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("email", email)
      .single()

    if (userRecord) {
      console.log(`[v0] Found user record: ${userRecord.id}`)

      // 3. Delete organization if it exists and user is the only member
      if (userRecord.organization_id) {
        const { data: orgUsers, error: orgUsersError } = await supabase
          .from("users")
          .select("id")
          .eq("organization_id", userRecord.organization_id)

        if (!orgUsersError && orgUsers && orgUsers.length === 1) {
          console.log(`[v0] Deleting organization: ${userRecord.organization_id}`)
          const { error: orgDeleteError } = await supabase
            .from("organizations")
            .delete()
            .eq("id", userRecord.organization_id)

          if (orgDeleteError) {
            console.error("[v0] Error deleting organization:", orgDeleteError)
          } else {
            console.log("[v0] Organization deleted successfully")
          }
        }
      }

      // 4. Delete user record
      console.log("[v0] Deleting user record...")
      const { error: userDeleteError } = await supabase.from("users").delete().eq("id", userRecord.id)

      if (userDeleteError) {
        console.error("[v0] Error deleting user record:", userDeleteError)
      } else {
        console.log("[v0] User record deleted successfully")
      }
    }

    // 5. Delete auth user
    console.log("[v0] Deleting auth user...")
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUser.id)

    if (authDeleteError) {
      console.error("[v0] Error deleting auth user:", authDeleteError)
    } else {
      console.log("[v0] Auth user deleted successfully")
    }

    console.log("[v0] Cleanup completed! You can now sign up with this email again.")
  } catch (error) {
    console.error("[v0] Cleanup error:", error)
  }
}

// Get email from command line argument or use a default for testing
const emailToCleanup = process.argv[2]

if (!emailToCleanup) {
  console.error("Usage: node cleanup-user.ts <email>")
  console.error("Example: node cleanup-user.ts user@example.com")
  process.exit(1)
}

cleanupUser(emailToCleanup)
