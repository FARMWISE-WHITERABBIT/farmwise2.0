"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TrendingUp, TrendingDown } from "lucide-react"

interface RegionalYieldMapProps {
  regionalYields: Record<string, { total: number; count: number; avgPerHa: number }>
  batches: any[]
}

export default function RegionalYieldMap({ regionalYields, batches }: RegionalYieldMapProps) {
  const sortedRegions = Object.entries(regionalYields)
    .map(([region, data]) => ({
      region,
      ...data,
    }))
    .sort((a, b) => b.avgPerHa - a.avgPerHa)

  const nationalAvg =
    sortedRegions.length > 0 ? sortedRegions.reduce((sum, r) => sum + r.avgPerHa, 0) / sortedRegions.length : 0

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">Regional Yield Performance</CardTitle>
          <CardDescription className="font-inter">Average yield per hectare by state/region</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedRegions.length === 0 ? (
            <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">No regional data available yet</p>
          ) : (
            <div className="space-y-4">
              {sortedRegions.map((region, index) => {
                const performanceVsNational = ((region.avgPerHa - nationalAvg) / nationalAvg) * 100
                return (
                  <div
                    key={region.region}
                    className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-[15px]"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                        <MapPin className="h-5 w-5 text-[#39B54A]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-poppins font-semibold text-[#000000]">{region.region}</p>
                          {index === 0 && (
                            <Badge className="rounded-full text-xs bg-[rgba(57,181,74,0.1)] text-[#39B54A]">
                              Top Performer
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{region.count} harvests recorded</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-poppins font-semibold text-[#39B54A]">{region.avgPerHa.toFixed(0)} kg/ha</p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {performanceVsNational >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-[#39B54A]" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <p
                          className={`text-xs font-inter ${performanceVsNational >= 0 ? "text-[#39B54A]" : "text-red-500"}`}
                        >
                          {Math.abs(performanceVsNational).toFixed(1)}% vs avg
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[25px] border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">Regional Insights</CardTitle>
          <CardDescription className="font-inter">Key findings from regional analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-[rgba(57,181,74,0.05)] rounded-[15px]">
            <p className="text-sm font-semibold text-[#000000] font-inter mb-2">National Average</p>
            <p className="text-3xl font-poppins font-semibold text-[#39B54A]">{nationalAvg.toFixed(0)} kg/ha</p>
          </div>

          {sortedRegions.length > 0 && (
            <>
              <div className="p-4 bg-blue-50 rounded-[15px]">
                <p className="text-sm font-semibold text-[#000000] font-inter mb-2">Best Performing Region</p>
                <p className="text-2xl font-poppins font-semibold text-blue-600">{sortedRegions[0].region}</p>
                <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
                  {sortedRegions[0].avgPerHa.toFixed(0)} kg/ha average yield
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-[15px]">
                <p className="text-sm font-semibold text-[#000000] font-inter mb-2">Improvement Opportunity</p>
                <p className="text-2xl font-poppins font-semibold text-yellow-700">
                  {sortedRegions[sortedRegions.length - 1].region}
                </p>
                <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
                  Potential to increase yield by{" "}
                  {(
                    ((sortedRegions[0].avgPerHa - sortedRegions[sortedRegions.length - 1].avgPerHa) /
                      sortedRegions[sortedRegions.length - 1].avgPerHa) *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
