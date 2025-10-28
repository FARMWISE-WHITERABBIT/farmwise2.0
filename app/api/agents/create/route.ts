import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] Unauthorized: No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Agent creation request body:", body)

    const { first_name, last_name, email, phone, organization_id, role, password } = body

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !organization_id || !role || !password) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", user.id)
      .single()

    console.log("[v0] Current user:", currentUser)

    if (currentUser?.role === "super_admin") {
      console.log("[v0] Super admin creating agent")
    } else {
      const { data: orgUser } = await supabase
        .from("organization_users")
        .select("role")
        .eq("user_id", user.id)
        .eq("organization_id", organization_id)
        .eq("is_active", true)
        .single()

      console.log("[v0] Organization user:", orgUser)

      if (!orgUser || !["owner", "admin", "manager"].includes(orgUser.role)) {
        console.log("[v0] Insufficient permissions")
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    console.log("[v0] Creating auth user with service role...")

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error("[v0] Service role key not available")
      return NextResponse.json(
        {
          error: "Server configuration error: Unable to create user accounts",
        },
        { status: 500 },
      )
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role,
      },
    })

    if (authError) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      throw new Error("Failed to create auth user")
    }

    console.log("[v0] Auth user created:", authData.user.id)

    console.log("[v0] Creating user profile...")
    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      first_name,
      last_name,
      email,
      phone,
      organization_id,
      role,
      is_active: true,
      is_approved: true,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      email_verified: true,
    })

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    console.log("[v0] User profile created successfully")

    const { error: orgUserError } = await supabaseAdmin.from("organization_users").insert({
      user_id: authData.user.id,
      organization_id,
      role,
      is_active: true,
      joined_at: new Date().toISOString(),
    })

    if (orgUserError) {
      console.error("[v0] Organization user creation error:", orgUserError)
      // Continue anyway as this is not critical
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        first_name,
        last_name,
        role,
      },
    })
  } catch (error: any) {
    console.error("[v0] Agent creation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
