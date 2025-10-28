import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get user email
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", params.id)
      .single()

    if (userError || !user) {
      console.error("[v0] User fetch error:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error("[v0] Password reset error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Password reset link generated for:", user.email)

    return NextResponse.json({
      success: true,
      message: "Password reset link generated successfully",
      recoveryLink: data.properties.action_link, // Return the link
    })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
