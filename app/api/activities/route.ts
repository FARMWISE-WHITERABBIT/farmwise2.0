import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("farm_activities").insert([body]).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get("farmer_id")
    const plotId = searchParams.get("plot_id")
    const activityType = searchParams.get("activity_type")

    let query = supabase.from("farm_activities").select("*").order("activity_date", { ascending: false })

    if (farmerId) query = query.eq("farmer_id", farmerId)
    if (plotId) query = query.eq("plot_id", plotId)
    if (activityType) query = query.eq("activity_type", activityType)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
