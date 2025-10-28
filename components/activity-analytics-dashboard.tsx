"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { TrendingUp, TrendingDown, Activity, Users, MapPin, DollarSign, Download } from "lucide-react"

interface ActivityAnalyticsDashboardProps {
  userId: string
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

export function ActivityAnalyticsDashboard({ userId }: ActivityAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(true)

  // Mock data - replace with actual API calls
  const summaryStats = [
    {
      label: "Total Activities",
      value: "248",
      change: "+12%",
      trend: "up",
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Farmers Engaged",
      value: "42",
      change: "+8%",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Plots Covered",
      value: "68",
      change: "+15%",
      trend: "up",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Total Cost",
      value: "₦2.4M",
      change: "-5%",
      trend: "down",
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  const activitiesOverTime = [
    { date: "Week 1", planting: 12, irrigation: 8, fertilization: 6, pest_control: 4, harvesting: 2 },
    { date: "Week 2", planting: 15, irrigation: 10, fertilization: 8, pest_control: 5, harvesting: 3 },
    { date: "Week 3", planting: 18, irrigation: 12, fertilization: 10, pest_control: 7, harvesting: 5 },
    { date: "Week 4", planting: 20, irrigation: 15, fertilization: 12, pest_control: 8, harvesting: 7 },
  ]

  const activitiesByType = [
    { name: "Planting", value: 65, color: "#10b981" },
    { name: "Irrigation", value: 45, color: "#3b82f6" },
    { name: "Fertilization", value: 36, color: "#f59e0b" },
    { name: "Pest Control", value: 24, color: "#ef4444" },
    { name: "Weeding", value: 32, color: "#8b5cf6" },
    { name: "Pruning", value: 18, color: "#ec4899" },
    { name: "Harvesting", value: 28, color: "#14b8a6" },
  ]

  const costDistribution = [
    { category: "Labor", amount: 850000 },
    { category: "Inputs", amount: 1200000 },
    { category: "Equipment", amount: 350000 },
  ]

  const farmerActivityLeaderboard = [
    { name: "John Doe", activities: 45, plots: 8, lastActivity: "2 hours ago" },
    { name: "Jane Smith", activities: 38, plots: 6, lastActivity: "5 hours ago" },
    { name: "Mike Johnson", activities: 32, plots: 5, lastActivity: "1 day ago" },
    { name: "Sarah Williams", activities: 28, plots: 4, lastActivity: "2 days ago" },
    { name: "David Brown", activities: 24, plots: 4, lastActivity: "3 days ago" },
  ]

  const cropPerformance = [
    { crop: "Maize", activities: 85, avgYield: 4.2, status: "Good" },
    { crop: "Rice", activities: 62, avgYield: 3.8, status: "Excellent" },
    { crop: "Cassava", activities: 48, avgYield: 12.5, status: "Good" },
    { crop: "Yam", activities: 35, avgYield: 8.3, status: "Fair" },
    { crop: "Beans", activities: 18, avgYield: 1.5, status: "Good" },
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [timeRange])

  const exportReport = () => {
    // Implement PDF/Excel export
    console.log("Exporting report...")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into farm activities and performance</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                >
                  <TrendIcon className="w-4 h-4" />
                  <span className="font-medium">{stat.change}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="farmers">Farmers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Activities Over Time */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activities Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activitiesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="planting" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="irrigation" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="fertilization" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="pest_control" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="harvesting" stroke="#14b8a6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activities by Type */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Activities by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activitiesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {activitiesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Cost Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cost Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₦${(value as number).toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          {/* Crop Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Crop Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Crop</th>
                    <th className="text-right py-3 px-4">Activities</th>
                    <th className="text-right py-3 px-4">Avg Yield (tons/ha)</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cropPerformance.map((crop, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{crop.crop}</td>
                      <td className="text-right py-3 px-4">{crop.activities}</td>
                      <td className="text-right py-3 px-4">{crop.avgYield}</td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            crop.status === "Excellent"
                              ? "bg-green-100 text-green-700"
                              : crop.status === "Good"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {crop.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
            <div className="space-y-4">
              {costDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-sm text-gray-600">
                      {((item.amount / costDistribution.reduce((sum, i) => sum + i.amount, 0)) * 100).toFixed(1)}% of
                      total
                    </p>
                  </div>
                  <p className="text-xl font-bold">₦{item.amount.toLocaleString()}</p>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">Total Cost</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{costDistribution.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="farmers">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Farmer Activity Leaderboard</h3>
            <div className="space-y-3">
              {farmerActivityLeaderboard.map((farmer, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-700 rounded-full font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{farmer.name}</p>
                    <p className="text-sm text-gray-600">
                      {farmer.activities} activities • {farmer.plots} plots
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Last activity</p>
                    <p className="text-sm font-medium">{farmer.lastActivity}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
