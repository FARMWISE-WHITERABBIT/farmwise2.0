import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] Unauthorized: No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] User creation request body:", body)

    const { first_name, last_name, email, phone, organization_id, role, state, lga } = body

    if (!first_name || !last_name || !email || !phone || !organization_id || !role || !state || !lga) {
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
      console.log("[v0] Super admin creating user")
    } else if (currentUser?.role === "admin") {
      if (currentUser.organization_id !== organization_id) {
        console.log("[v0] Admin trying to create user in different organization")
        return NextResponse.json({ error: "Can only create users in your own organization" }, { status: 403 })
      }
      if (role === "super_admin") {
        console.log("[v0] Admin trying to create super_admin")
        return NextResponse.json({ error: "Cannot create super admin users" }, { status: 403 })
      }
      console.log("[v0] Admin creating user in their organization")
    } else {
      console.log("[v0] Insufficient permissions")
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingAuthUser?.users?.find((u) => u.email === email)

    if (userExists) {
      console.log("[v0] User with email already exists:", email)
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    console.log("[v0] Inviting user via email...")
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name,
        last_name,
        role,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
    })

    if (authError) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    console.log("[v0] User invited successfully:", authData.user.id)

    console.log("[v0] Creating user profile...")
    const { error: profileError } = await supabaseAdmin.from("users").upsert(
      {
        id: authData.user.id,
        first_name,
        last_name,
        email,
        phone,
        organization_id,
        role,
        state,
        lga,
        is_active: true,
      },
      {
        onConflict: "id",
      },
    )

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    console.log("[v0] User profile created successfully")
    console.log("[v0] Invite email sent automatically by Supabase")

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        first_name,
        last_name,
        role,
      },
      message: "User created successfully. An invitation email has been sent to set up their password.",
    })
  } catch (error: any) {
    console.error("[v0] User creation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
