import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, QrCode, Package } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Food Traceability | Farmwise",
  description: "Track harvest batches from farm to consumer",
}

export default async function TraceabilityPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch harvest batches
  const { data: batches } = await supabase
    .from("harvest_batches")
    .select(
      `
      *,
      farmers(first_name, last_name, farmer_id),
      farm_plots(plot_name, plot_code)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50)

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

  const totalBatches = batches?.length || 0
  const inTransit = batches?.filter((b: any) => b.status === "in_transit").length || 0
  const deliveredThisMonth =
    batches?.filter((b: any) => {
      const deliveryDate = new Date(b.delivery_date)
      const now = new Date()
      return (
        b.status === "delivered" &&
        deliveryDate.getMonth() === now.getMonth() &&
        deliveryDate.getFullYear() === now.getFullYear()
      )
    }).length || 0
  const qualityIssues = batches?.filter((b: any) => b.has_quality_issues).length || 0

  const stageCounts = {
    harvested: batches?.filter((b: any) => b.status === "harvested").length || 0,
    collected: batches?.filter((b: any) => b.status === "collected").length || 0,
    stored: batches?.filter((b: any) => b.status === "in_storage").length || 0,
    processed: batches?.filter((b: any) => b.status === "processed").length || 0,
    delivered: batches?.filter((b: any) => b.status === "delivered").length || 0,
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Food Traceability System</h1>
              <p className="text-sm text-muted-foreground mt-1">Complete transparency from farm to market</p>
            </div>
            <Button asChild className="bg-[#39b54a] hover:bg-[#2d8f3a]">
              <Link href="/dashboard/traceability/new">
                <Plus className="h-4 w-4 mr-2" />
                Create New Batch
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter Batch Code or Scan QR Code..." className="pl-10" />
                </div>
                <Button variant="outline" size="icon">
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Batches Created</p>
                  <p className="text-3xl font-semibold mt-2">{totalBatches}</p>
                  <p className="text-xs text-green-600 mt-1">↑ Growth trend</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Batches In Transit</p>
                  <p className="text-3xl font-semibold mt-2">{inTransit}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-xs text-blue-600">Active</p>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delivered This Month</p>
                  <p className="text-3xl font-semibold mt-2">{deliveredThisMonth}</p>
                  <p className="text-xs text-green-600 mt-1">✓ Completed</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quality Issues</p>
                  <p className="text-3xl font-semibold mt-2">{qualityIssues}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {qualityIssues === 0 ? "All clear ✓" : "Needs attention"}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${qualityIssues > 0 ? "bg-red-100" : "bg-green-100"}`}
                >
                  <Package className={`h-6 w-6 ${qualityIssues > 0 ? "text-red-600" : "text-green-600"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Journey Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              {[
                { icon: "🌾", name: "Harvested", count: stageCounts.harvested, color: "bg-green-100 text-green-700" },
                { icon: "🚚", name: "Collected", count: stageCounts.collected, color: "bg-blue-100 text-blue-700" },
                { icon: "🏭", name: "Stored", count: stageCounts.stored, color: "bg-orange-100 text-orange-700" },
                { icon: "⚙️", name: "Processed", count: stageCounts.processed, color: "bg-purple-100 text-purple-700" },
                { icon: "📦", name: "Delivered", count: stageCounts.delivered, color: "bg-green-100 text-green-700" },
              ].map((stage, index) => (
                <div key={stage.name} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${stage.color}`}>
                      {stage.icon}
                    </div>
                    <p className="text-sm font-medium mt-2">{stage.name}</p>
                    <p className="text-2xl font-semibold mt-1">{stage.count}</p>
                    <p className="text-xs text-muted-foreground">
                      {totalBatches > 0 ? Math.round((stage.count / totalBatches) * 100) : 0}%
                    </p>
                  </div>
                  {index < 4 && <div className="h-0.5 w-8 bg-gradient-to-r from-gray-300 to-gray-200" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Batches List */}
        {!batches || batches.length === 0 ? (
          <Card className="rounded-[25px] border-none shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                <Package className="h-8 w-8 text-[#39B54A]" />
              </div>
              <h3 className="font-poppins text-xl font-semibold mb-2">No harvest batches yet</h3>
              <p className="text-[rgba(0,0,0,0.65)] font-inter mb-6">
                Start tracking your harvest by creating a new batch
              </p>
              <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                <Link href="/dashboard/traceability/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Batch
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {batches.map((batch: any) => (
              <Card key={batch.id} className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-poppins font-semibold text-lg text-[#000000]">{batch.batch_number}</h3>
                        <Badge className={`rounded-full font-inter text-xs ${getStatusColor(batch.status)}`}>
                          {batch.status.replace("_", " ")}
                        </Badge>
                        {batch.is_organic && (
                          <Badge className="rounded-full font-inter text-xs bg-green-100 text-green-700">Organic</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter mt-3">
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Crop</p>
                          <p className="font-semibold text-[#000000]">{batch.crop_type}</p>
                        </div>
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Quantity</p>
                          <p className="font-medium text-[#000000]">
                            {batch.quantity_kg} {batch.unit_of_measure}
                          </p>
                        </div>
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Farmer</p>
                          <p className="font-medium text-[#000000]">
                            {batch.farmers?.first_name} {batch.farmers?.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-[rgba(0,0,0,0.45)] text-xs">Harvest Date</p>
                          <p className="font-medium text-[#000000]">
                            {new Date(batch.harvest_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <QrCode className="h-4 w-4 text-[rgba(0,0,0,0.45)]" />
                        <span className="text-sm text-[rgba(0,0,0,0.65)] font-inter font-mono">{batch.qr_code}</span>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                    >
                      <Link href={`/dashboard/traceability/${batch.id}`}>View Timeline</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
