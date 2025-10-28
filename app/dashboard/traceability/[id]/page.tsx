import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, QrCode, Download, User, Package, Thermometer } from "lucide-react"
import Link from "next/link"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { TraceabilityTimeline } from "@/components/traceability-timeline"
import { AddEventDialog } from "@/components/add-event-dialog"
import { QualityCheckDialog } from "@/components/quality-check-dialog"

export const metadata = {
  title: "Batch Details | Farmwise",
  description: "View harvest batch traceability timeline",
}

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch batch details
  const { data: batch } = await supabase
    .from("harvest_batches")
    .select(
      `
      *,
      farmers(first_name, last_name, farmer_id, primary_phone, state, lga),
      farm_plots(plot_name, plot_code, size_hectares)
    `,
    )
    .eq("id", params.id)
    .single()

  if (!batch) {
    redirect("/dashboard/traceability")
  }

  // Fetch traceability events
  const { data: events } = await supabase
    .from("traceability_events")
    .select(
      `
      *,
      users(first_name, last_name)
    `,
    )
    .eq("batch_id", params.id)
    .order("event_date", { ascending: false })

  // Fetch quality checks
  const { data: qualityChecks } = await supabase
    .from("quality_checks")
    .select(
      `
      *,
      users(first_name, last_name)
    `,
    )
    .eq("batch_id", params.id)
    .order("check_date", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "harvested":
        return "bg-green-100 text-green-700"
      case "in_storage":
        return "bg-blue-100 text-blue-700"
      case "in_transit":
        return "bg-yellow-100 text-yellow-700"
      case "sold":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
    }
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <Link href="/dashboard/traceability">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-poppins font-semibold text-[#000000]">{batch.batch_number}</h1>
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">Harvest Batch Traceability</p>
            </div>
          </div>
          <div className="flex gap-3">
            <QualityCheckDialog batchId={batch.id} userId={user.id} />
            <AddEventDialog batchId={batch.id} userId={user.id} organizationId={batch.organization_id} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Batch Info & QR Code */}
          <div className="space-y-6">
            {/* Batch Overview */}
            <Card className="rounded-[20px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg flex items-center justify-between">
                  Batch Overview
                  <Badge className={`rounded-full font-inter text-xs ${getStatusColor(batch.status)}`}>
                    {batch.status.replace("_", " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Crop Type</p>
                  <p className="font-semibold text-[#000000] font-inter">{batch.crop_type}</p>
                  {batch.variety && <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{batch.variety}</p>}
                </div>

                <div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Quantity</p>
                  <p className="font-semibold text-[#000000] font-inter">
                    {batch.quantity_kg} {batch.unit_of_measure}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Harvest Date</p>
                  <p className="font-medium text-[#000000] font-inter">
                    {new Date(batch.harvest_date).toLocaleDateString()}
                  </p>
                </div>

                {batch.quality_grade && (
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Quality Grade</p>
                    <p className="font-medium text-[#000000] font-inter">Grade {batch.quality_grade}</p>
                  </div>
                )}

                {batch.is_organic && (
                  <Badge className="rounded-full font-inter text-xs bg-green-100 text-green-700">
                    Organic Certified
                  </Badge>
                )}

                {batch.certifications && batch.certifications.length > 0 && (
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {batch.certifications.map((cert: string, i: number) => (
                        <Badge key={i} variant="secondary" className="rounded-full font-inter text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card className="rounded-[20px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-[#39B54A]" />
                  QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <QRCodeGenerator value={batch.qr_code} size={200} />
                <div className="text-center">
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Batch Code</p>
                  <p className="font-mono text-sm font-medium text-[#000000]">{batch.qr_code}</p>
                </div>
                <Button variant="outline" className="w-full rounded-[10px] font-inter bg-transparent" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </CardContent>
            </Card>

            {/* Farmer & Location Info */}
            <Card className="rounded-[20px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-[#39B54A]" />
                  Farmer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Name</p>
                  <p className="font-medium text-[#000000] font-inter">
                    {batch.farmers.first_name} {batch.farmers.last_name}
                  </p>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">ID: {batch.farmers.farmer_id}</p>
                </div>

                <div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Contact</p>
                  <p className="font-medium text-[#000000] font-inter">{batch.farmers.primary_phone}</p>
                </div>

                <div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Location</p>
                  <p className="font-medium text-[#000000] font-inter">
                    {batch.farmers.lga}, {batch.farmers.state}
                  </p>
                </div>

                {batch.farm_plots && (
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Farm Plot</p>
                    <p className="font-medium text-[#000000] font-inter">{batch.farm_plots.plot_name}</p>
                    <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                      {batch.farm_plots.plot_code} • {batch.farm_plots.size_hectares} ha
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Storage Info */}
            {batch.storage_location && (
              <Card className="rounded-[20px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#39B54A]" />
                    Storage Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Location</p>
                    <p className="font-medium text-[#000000] font-inter">{batch.storage_location}</p>
                  </div>

                  {batch.storage_temperature_celsius && (
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Temperature</p>
                      <p className="font-medium text-[#000000] font-inter flex items-center gap-1">
                        <Thermometer className="h-4 w-4" />
                        {batch.storage_temperature_celsius}°C
                      </p>
                    </div>
                  )}

                  {batch.storage_conditions && (
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Conditions</p>
                      <p className="font-medium text-[#000000] font-inter">{batch.storage_conditions}</p>
                    </div>
                  )}

                  {batch.expected_shelf_life_days && (
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Expected Shelf Life</p>
                      <p className="font-medium text-[#000000] font-inter">{batch.expected_shelf_life_days} days</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Timeline & Quality Checks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Traceability Timeline */}
            <Card className="rounded-[20px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Traceability Timeline</CardTitle>
                <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                  Complete history of this batch from harvest to delivery
                </p>
              </CardHeader>
              <CardContent>
                <TraceabilityTimeline events={events || []} />
              </CardContent>
            </Card>

            {/* Quality Checks */}
            {qualityChecks && qualityChecks.length > 0 && (
              <Card className="rounded-[20px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Quality Checks</CardTitle>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                    Quality inspections performed on this batch
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {qualityChecks.map((check: any) => (
                      <div key={check.id} className="border-l-4 border-[#39B54A] pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-[#000000] font-inter">{check.check_type}</p>
                            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
                              Result: <span className="font-medium">{check.result}</span>
                            </p>
                            {check.notes && (
                              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">{check.notes}</p>
                            )}
                            <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-2">
                              {new Date(check.check_date).toLocaleString()} • {check.users?.first_name}{" "}
                              {check.users?.last_name}
                            </p>
                          </div>
                          <Badge
                            className={`rounded-full font-inter text-xs ${
                              check.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {check.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
