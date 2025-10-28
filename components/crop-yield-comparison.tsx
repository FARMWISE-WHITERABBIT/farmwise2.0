"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useMemo } from "react"

interface CropYieldComparisonProps {
  cropYields: Record<string, { total: number; count: number; batches: any[] }>
}

export default function CropYieldComparison({ cropYields }: CropYieldComparisonProps) {
  const chartData = useMemo(() => {
    return Object.entries(cropYields)
      .map(([crop, data]) => ({
        crop,
        totalYield: Math.round(data.total),
        avgYield: Math.round(data.total / data.count),
        harvests: data.count,
      }))
      .sort((a, b) => b.totalYield - a.totalYield)
  }, [cropYields])

  return (
    <>
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">Yield by Crop Type</CardTitle>
          <CardDescription className="font-inter">Total and average yields across different crops</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-12">
              No crop data available for comparison
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="crop" stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                <YAxis stroke="rgba(0,0,0,0.65)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "10px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Bar dataKey="totalYield" fill="#39B54A" name="Total Yield (kg)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="avgYield" fill="#2D5016" name="Avg Yield (kg)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Detailed Crop Statistics */}
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">Crop Performance Details</CardTitle>
          <CardDescription className="font-inter">Detailed statistics for each crop type</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">No crop data available</p>
          ) : (
            <div className="space-y-4">
              {chartData.map((crop) => (
                <div key={crop.crop} className="p-4 bg-[#F5F5F5] rounded-[15px]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-poppins font-semibold text-[#000000]">{crop.crop}</h4>
                    <span className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{crop.harvests} harvests</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Total Yield</p>
                      <p className="text-lg font-poppins font-semibold text-[#000000]">
                        {crop.totalYield.toLocaleString()} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Avg per Harvest</p>
                      <p className="text-lg font-poppins font-semibold text-[#39B54A]">
                        {crop.avgYield.toLocaleString()} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">In Tons</p>
                      <p className="text-lg font-poppins font-semibold text-[#000000]">
                        {(crop.totalYield / 1000).toFixed(2)} t
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
