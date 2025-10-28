import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, type, notes } = await request.json()

    if (!id || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const table = type === "user" ? "users" : "organizations"

    const { error } = await supabase
      .from(table)
      .update({
        is_approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: notes || null,
      })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error approving:", error)
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 })
  }
}
