import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FarmersListClient } from "@/components/farmers-list-client"
import { getUserContext, applyDataIsolation } from "@/lib/auth/data-isolation"

export const metadata = {
  title: "Farmers | Farmwise",
  description: "Manage your farmer database",
}

export default async function FarmersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const userContext = await getUserContext(supabase)
  if (!userContext) {
    redirect("/auth/login")
  }

  // Build query based on filters
  let query = supabase.from("farmers").select("*", { count: "exact" })

  query = applyDataIsolation(query, userContext)

  // Apply filters
  const search = searchParams.search as string
  const organization = searchParams.organization as string
  const cropType = searchParams.cropType as string
  const state = searchParams.state as string
  const lga = searchParams.lga as string
  const verificationStatus = searchParams.verificationStatus as string
  const dateFrom = searchParams.dateFrom as string
  const dateTo = searchParams.dateTo as string

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,farmer_id.ilike.%${search}%,primary_phone.ilike.%${search}%`,
    )
  }

  if (organization && userContext.role === "super_admin") {
    query = query.eq("organization_id", organization)
  }

  if (cropType) {
    query = query.contains("primary_crops", [cropType])
  }

  if (state) {
    query = query.eq("state", state)
  }

  if (lga) {
    query = query.eq("lga", lga)
  }

  if (verificationStatus) {
    query = query.eq("verification_status", verificationStatus)
  }

  if (dateFrom) {
    query = query.gte("registration_date", dateFrom)
  }

  if (dateTo) {
    query = query.lte("registration_date", dateTo)
  }

  const { data: farmers, count } = await query.order("created_at", { ascending: false }).limit(50)

  let organizations: any[] = []
  if (userContext.role === "super_admin") {
    const { data: orgsData } = await supabase.from("organizations").select("id, org_name").order("org_name")
    organizations = orgsData || []
  }

  // Get unique states and LGAs from farmers
  let statesQuery = supabase.from("farmers").select("state").not("state", "is", null)
  statesQuery = applyDataIsolation(statesQuery, userContext)
  const { data: statesData } = await statesQuery

  const uniqueStates = [...new Set(statesData?.map((f) => f.state))].sort()

  return (
    <FarmersListClient
      farmers={farmers || []}
      totalCount={count || 0}
      organizations={organizations}
      states={uniqueStates}
      initialFilters={{
        search: search || "",
        organization: organization || "",
        cropType: cropType || "",
        state: state || "",
        lga: lga || "",
        verificationStatus: verificationStatus || "",
        dateFrom: dateFrom || "",
        dateTo: dateTo || "",
      }}
      userRole={userContext.role}
    />
  )
}
