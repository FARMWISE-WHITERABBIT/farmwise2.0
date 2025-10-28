import { createServerClient } from "@/lib/supabase/server"
import { getWeatherData, generateFarmingAdvice, getLocationFromAddress } from "@/lib/services/weather-service"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Starting weather notification generation...")

    // Get all active users (farmers and extension agents primarily)
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, role, organization_id")
      .eq("is_active", true)
      .in("role", ["farmer", "field_agent", "admin", "manager"])

    if (usersError) {
      console.error("[v0] Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    console.log(`[v0] Found ${users?.length || 0} active users`)

    let notificationsCreated = 0

    for (const user of users || []) {
      try {
        // Get user's location based on their profile or farmers they manage
        let location: { lat: number; lon: number } | null = null

        if (user.role === "farmer") {
          // Get farmer's location
          const { data: farmer } = await supabase
            .from("farmers")
            .select("state, lga, gps_coordinates, primary_crops")
            .eq("user_id", user.id)
            .maybeSingle()

          if (farmer) {
            if (farmer.gps_coordinates) {
              // Use GPS coordinates if available
              const coords = farmer.gps_coordinates as any
              location = { lat: coords.coordinates[1], lon: coords.coordinates[0] }
            } else if (farmer.state) {
              // Geocode from address
              location = await getLocationFromAddress(farmer.state, farmer.lga)
            }

            if (location) {
              const weather = await getWeatherData(location.lat, location.lon)
              if (weather) {
                const advice = generateFarmingAdvice(weather, farmer.primary_crops?.[0])

                // Create notifications for high and medium priority advice
                for (const item of advice.filter((a) => a.priority === "high" || a.priority === "medium")) {
                  await supabase.from("notifications").insert({
                    user_id: user.id,
                    title: item.title,
                    message: item.message,
                    notification_type: "weather_alert",
                    type: "weather_alert",
                    priority: item.priority,
                    delivery_methods: ["in_app", "sms"],
                  })
                  notificationsCreated++
                }
              }
            }
          }
        } else if (user.role === "field_agent") {
          // Get location from assigned farmers
          const { data: farmers } = await supabase
            .from("farmers")
            .select("state, lga, gps_coordinates, primary_crops")
            .eq("assigned_agent_id", user.id)
            .limit(1)

          if (farmers && farmers.length > 0) {
            const farmer = farmers[0]
            if (farmer.gps_coordinates) {
              const coords = farmer.gps_coordinates as any
              location = { lat: coords.coordinates[1], lon: coords.coordinates[0] }
            } else if (farmer.state) {
              location = await getLocationFromAddress(farmer.state, farmer.lga)
            }

            if (location) {
              const weather = await getWeatherData(location.lat, location.lon)
              if (weather) {
                const advice = generateFarmingAdvice(weather)

                for (const item of advice.filter((a) => a.priority === "high")) {
                  await supabase.from("notifications").insert({
                    user_id: user.id,
                    title: item.title,
                    message: item.message,
                    notification_type: "weather_alert",
                    type: "weather_alert",
                    priority: item.priority,
                    delivery_methods: ["in_app"],
                  })
                  notificationsCreated++
                }
              }
            }
          }
        } else if (user.organization_id) {
          // For admins/managers, get location from organization's farmers
          const { data: farmers } = await supabase
            .from("farmers")
            .select("state, lga, gps_coordinates")
            .eq("organization_id", user.organization_id)
            .limit(1)

          if (farmers && farmers.length > 0) {
            const farmer = farmers[0]
            if (farmer.state) {
              location = await getLocationFromAddress(farmer.state, farmer.lga)

              if (location) {
                const weather = await getWeatherData(location.lat, location.lon)
                if (weather) {
                  const advice = generateFarmingAdvice(weather)

                  for (const item of advice.filter((a) => a.priority === "high")) {
                    await supabase.from("notifications").insert({
                      user_id: user.id,
                      title: item.title,
                      message: item.message,
                      notification_type: "weather_alert",
                      type: "weather_alert",
                      priority: item.priority,
                      delivery_methods: ["in_app"],
                    })
                    notificationsCreated++
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`[v0] Error processing user ${user.id}:`, error)
        // Continue with next user
      }
    }

    console.log(`[v0] Created ${notificationsCreated} weather notifications`)

    return NextResponse.json({
      success: true,
      notificationsCreated,
      message: `Successfully generated ${notificationsCreated} weather notifications`,
    })
  } catch (error) {
    console.error("[v0] Error in weather notification generation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
