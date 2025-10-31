"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, Sprout, Beef } from "lucide-react"

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

interface AnalyticsDashboardProps {
  plots: any[]
  livestock: any[]
}

export function AnalyticsDashboard({ plots, livestock }: AnalyticsDashboardProps) {
  const [selectedState, setSelectedState] = useState<string>("all")

  // Process crop yield data by LGA
  const cropYieldByLGA = useMemo(() => {
    const filtered = selectedState === "all" ? plots : plots.filter((p) => p.farmers.state === selectedState)

    const lgaData: Record<string, { totalArea: number; crops: Record<string, number> }> = {}

    filtered.forEach((plot) => {
      const lga = plot.farmers.lga
      if (!lgaData[lga]) {
        lgaData[lga] = { totalArea: 0, crops: {} }
      }
      lgaData[lga].totalArea += plot.size_hectares || 0

      // Process crops
      if (plot.current_crops && Array.isArray(plot.current_crops)) {
        plot.current_crops.forEach((crop: any) => {
          const cropName = crop.crop || crop.name || "Unknown"
          const hectares = crop.hectares || 0
          lgaData[lga].crops[cropName] = (lgaData[lga].crops[cropName] || 0) + hectares
        })
      }
    })

    return Object.entries(lgaData).map(([lga, data]) => ({
      lga,
      totalArea: data.totalArea,
      ...data.crops,
    }))
  }, [plots, selectedState])

  // Process crop distribution pie chart data
  const cropDistribution = useMemo(() => {
    const filtered = selectedState === "all" ? plots : plots.filter((p) => p.farmers.state === selectedState)

    const cropTotals: Record<string, number> = {}

    filtered.forEach((plot) => {
      if (plot.current_crops && Array.isArray(plot.current_crops)) {
        plot.current_crops.forEach((crop: any) => {
          const cropName = crop.crop || crop.name || "Unknown"
          const hectares = crop.hectares || 0
          cropTotals[cropName] = (cropTotals[cropName] || 0) + hectares
        })
      }
    })

    return Object.entries(cropTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 crops
  }, [plots, selectedState])

  // Process livestock data by LGA
  const livestockByLGA = useMemo(() => {
    const filtered = selectedState === "all" ? livestock : livestock.filter((l) => l.farmers.state === selectedState)

    const lgaData: Record<string, Record<string, number>> = {}

    filtered.forEach((animal) => {
      const lga = animal.farmers.lga
      const type = animal.livestock_type
      const quantity = animal.quantity || 0

      if (!lgaData[lga]) {
        lgaData[lga] = {}
      }
      lgaData[lga][type] = (lgaData[lga][type] || 0) + quantity
    })

    return Object.entries(lgaData).map(([lga, types]) => ({
      lga,
      ...types,
    }))
  }, [livestock, selectedState])

  // Process livestock distribution
  const livestockDistribution = useMemo(() => {
    const filtered = selectedState === "all" ? livestock : livestock.filter((l) => l.farmers.state === selectedState)

    const typeTotals: Record<string, number> = {}

    filtered.forEach((animal) => {
      const type = animal.livestock_type
      const quantity = animal.quantity || 0
      typeTotals[type] = (typeTotals[type] || 0) + quantity
    })

    return Object.entries(typeTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [livestock, selectedState])

  // Get unique states
  const states = useMemo(() => {
    const stateSet = new Set<string>()
    plots.forEach((p) => stateSet.add(p.farmers.state))
    livestock.forEach((l) => stateSet.add(l.farmers.state))
    return Array.from(stateSet).sort()
  }, [plots, livestock])

  // Calculate summary statistics
  const totalCropArea = useMemo(() => {
    return plots.reduce((sum, plot) => sum + (plot.size_hectares || 0), 0)
  }, [plots])

  const totalLivestock = useMemo(() => {
    return livestock.reduce((sum, animal) => sum + (animal.quantity || 0), 0)
  }, [livestock])

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Region</CardTitle>
          <CardDescription>Select a state to view regional analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Crop Area</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCropArea.toFixed(2)} ha</div>
            <p className="text-xs text-muted-foreground">Across {plots.length} plots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Livestock</CardTitle>
            <Beef className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLivestock}</div>
            <p className="text-xs text-muted-foreground">Across {livestock.length} records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crop Types</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cropDistribution.length}</div>
            <p className="text-xs text-muted-foreground">Different crops cultivated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livestock Types</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{livestockDistribution.length}</div>
            <p className="text-xs text-muted-foreground">Different livestock types</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="crops" className="space-y-4">
        <TabsList>
          <TabsTrigger value="crops">Crop Analytics</TabsTrigger>
          <TabsTrigger value="livestock">Livestock Analytics</TabsTrigger>
          <TabsTrigger value="combined">Combined View</TabsTrigger>
        </TabsList>

        <TabsContent value="crops" className="space-y-4">
          {/* Crop Yield by LGA Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Crop Area by Local Government Area</CardTitle>
              <CardDescription>Total cultivated area (hectares) across different LGAs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cropYieldByLGA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lga" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalArea" fill="#10b981" name="Total Area (ha)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Crop Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Crop Distribution by Area</CardTitle>
              <CardDescription>Percentage distribution of cultivated crops</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={cropDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cropDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Crop Breakdown by LGA */}
          <Card>
            <CardHeader>
              <CardTitle>Crop Breakdown by LGA</CardTitle>
              <CardDescription>Detailed view of crop types across regions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={cropYieldByLGA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="lga" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  {cropDistribution.slice(0, 5).map((crop, index) => (
                    <Bar key={crop.name} dataKey={crop.name} fill={COLORS[index % COLORS.length]} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="livestock" className="space-y-4">
          {/* Livestock by LGA Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Livestock Count by Local Government Area</CardTitle>
              <CardDescription>Total livestock population across different LGAs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={livestockByLGA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lga" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {livestockDistribution.map((type, index) => (
                    <Bar key={type.name} dataKey={type.name} fill={COLORS[index % COLORS.length]} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Livestock Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Livestock Distribution by Type</CardTitle>
              <CardDescription>Percentage distribution of livestock types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={livestockDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {livestockDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Livestock Health Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Livestock Health Status Overview</CardTitle>
              <CardDescription>Distribution of livestock by health status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Healthy",
                        value: livestock.filter((l) => l.health_status === "healthy").length,
                      },
                      { name: "Sick", value: livestock.filter((l) => l.health_status === "sick").length },
                      {
                        name: "Under Treatment",
                        value: livestock.filter((l) => l.health_status === "under_treatment").length,
                      },
                      {
                        name: "Quarantined",
                        value: livestock.filter((l) => l.health_status === "quarantined").length,
                      },
                    ].filter((item) => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Healthy", color: "#10b981" },
                      { name: "Sick", color: "#ef4444" },
                      { name: "Under Treatment", color: "#f59e0b" },
                      { name: "Quarantined", color: "#8b5cf6" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Combined View Tab */}
        <TabsContent value="combined" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agricultural Production Overview</CardTitle>
                <CardDescription>Crops vs Livestock by LGA</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={cropYieldByLGA.map((crop) => {
                      const livestockData = livestockByLGA.find((l) => l.lga === crop.lga)
                      const totalLivestock = livestockData
                        ? Object.entries(livestockData)
                            .filter(([key]) => key !== "lga")
                            .reduce((sum, [, value]) => sum + (value as number), 0)
                        : 0
                      return {
                        lga: crop.lga,
                        cropArea: crop.totalArea,
                        livestockCount: totalLivestock,
                      }
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lga" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" orientation="left" stroke="#10b981" />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="cropArea" fill="#10b981" name="Crop Area (ha)" />
                    <Bar yAxisId="right" dataKey="livestockCount" fill="#3b82f6" name="Livestock Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Production Diversity Index</CardTitle>
                <CardDescription>Variety of crops and livestock by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={cropYieldByLGA.map((crop) => {
                      const cropTypes = Object.keys(crop).filter((key) => key !== "lga" && key !== "totalArea").length
                      const livestockData = livestockByLGA.find((l) => l.lga === crop.lga)
                      const livestockTypes = livestockData
                        ? Object.keys(livestockData).filter((key) => key !== "lga").length
                        : 0
                      return {
                        lga: crop.lga,
                        cropTypes,
                        livestockTypes,
                        total: cropTypes + livestockTypes,
                      }
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lga" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cropTypes" fill="#10b981" name="Crop Types" stackId="a" />
                    <Bar dataKey="livestockTypes" fill="#3b82f6" name="Livestock Types" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
