import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, User, Package, Award } from "lucide-react"
import { notFound } from "next/navigation"

export default async function PublicTracePage({ params }: { params: { batchCode: string } }) {
  const supabase = await createClient()

  const { data: batch } = await supabase
    .from("harvest_batches")
    .select(
      `
      *,
      farmers(full_name, profile_photo_url, location),
      farm_plots(plot_name, location)
    `,
    )
    .eq("batch_code", params.batchCode)
    .single()

  if (!batch) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="bg-[#39b54a] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Track Your Food Journey</h1>
          <p className="text-xl opacity-90">Complete transparency from farm to your table</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Product Info */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">{batch.crop_type}</h2>
              <p className="text-muted-foreground">Batch Code: {batch.batch_code}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Package className="h-8 w-8 mx-auto mb-2 text-[#39b54a]" />
                <p className="font-semibold">
                  {batch.quantity} {batch.unit}
                </p>
                <p className="text-sm text-muted-foreground">Quantity</p>
              </div>
              <div>
                <Calendar className="h-8 w-8 mx-auto mb-2 text-[#39b54a]" />
                <p className="font-semibold">{new Date(batch.harvest_date).toLocaleDateString()}</p>
                <p className="text-sm text-muted-foreground">Harvest Date</p>
              </div>
              <div>
                <MapPin className="h-8 w-8 mx-auto mb-2 text-[#39b54a]" />
                <p className="font-semibold">{batch.farm_plots?.location || "Nigeria"}</p>
                <p className="text-sm text-muted-foreground">Origin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meet Your Farmer */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meet Your Farmer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {batch.farmers?.profile_photo_url && (
                <img
                  src={batch.farmers.profile_photo_url || "/placeholder.svg"}
                  alt={batch.farmers.full_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-xl font-semibold">{batch.farmers?.full_name}</h3>
                <p className="text-muted-foreground">{batch.farmers?.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journey Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Journey Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xl">🌾</span>
                  </div>
                  <div className="w-0.5 h-full bg-green-200 mt-2" />
                </div>
                <div className="flex-1 pb-8">
                  <h4 className="font-semibold">Harvested</h4>
                  <p className="text-sm text-muted-foreground">{new Date(batch.harvest_date).toLocaleDateString()}</p>
                  <p className="text-sm mt-1">Fresh harvest from {batch.farm_plots?.plot_name}</p>
                </div>
              </div>

              {batch.status !== "harvested" && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl">📦</span>
                    </div>
                    {batch.status !== "in_storage" && <div className="w-0.5 h-full bg-blue-200 mt-2" />}
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold">In Storage</h4>
                    <p className="text-sm text-muted-foreground">Quality maintained</p>
                  </div>
                </div>
              )}

              {(batch.status === "in_transit" || batch.status === "delivered") && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-xl">🚚</span>
                    </div>
                    {batch.status !== "delivered" && <div className="w-0.5 h-full bg-yellow-200 mt-2" />}
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold">In Transit</h4>
                    <p className="text-sm text-muted-foreground">On the way to destination</p>
                  </div>
                </div>
              )}

              {batch.status === "delivered" && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xl">✓</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Delivered</h4>
                    <p className="text-sm text-muted-foreground">Successfully delivered</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quality Assurance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Quality Assurance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-green-100 text-green-700">Quality Grade: {batch.quality_grade}</Badge>
              {batch.organic_certified && <Badge className="bg-green-100 text-green-700">Organic Certified</Badge>}
              {batch.quality_inspection && <Badge className="bg-blue-100 text-blue-700">Quality Inspected ✓</Badge>}
            </div>
            {batch.quality_score && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Quality Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${batch.quality_score}%` }} />
                  </div>
                  <span className="font-semibold">{batch.quality_score}/100</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          <p className="text-sm">Powered by Farmwise Traceability System</p>
          <p className="text-xs mt-1">Verified and transparent from farm to table</p>
        </div>
      </div>
    </div>
  )
}
