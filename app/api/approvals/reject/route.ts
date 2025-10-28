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

    if (!id || !type || !notes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const table = type === "user" ? "users" : "organizations"

    // Mark as rejected by setting is_approved to false and adding notes
    const { error } = await supabase
      .from(table)
      .update({
        is_approved: false,
        requires_approval: false, // Remove from pending queue
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: notes,
      })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error rejecting:", error)
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 })
  }
}
