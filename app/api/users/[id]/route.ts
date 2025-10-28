import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Create admin client with service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Update user profile
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        organization_id: body.organization_id,
        state: body.state,
        lga: body.lga,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Update error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Delete user from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(params.id)

    if (authError) {
      console.error("[v0] Auth delete error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Delete user profile (should cascade automatically, but we'll do it explicitly)
    const { error: profileError } = await supabaseAdmin.from("users").delete().eq("id", params.id)

    if (profileError) {
      console.error("[v0] Profile delete error:", profileError)
      // Don't fail if profile is already deleted
    }

    console.log("[v0] User deleted successfully:", params.id)

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
