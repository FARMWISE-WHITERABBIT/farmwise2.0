"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, FileText, Download, BarChart3 } from "lucide-react"

interface ReportGeneratorProps {
  currentUser: any
  organizations: Array<{ id: string; org_name: string }>
}

export function ReportGenerator({ currentUser, organizations }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const [filters, setFilters] = useState({
    reportType: "farmers",
    organizationId: currentUser.role === "super_admin" ? "all" : currentUser.organization_id,
    startDate: "",
    endDate: "",
    crop: "",
    status: "",
  })

  const reportTypes = [
    { value: "farmers", label: "Farmer Registration Report", icon: FileText },
    { value: "yield", label: "Crop Yield Report", icon: BarChart3 },
    { value: "financial", label: "Financial Summary Report", icon: FileText },
    { value: "loans", label: "Loan Applications Report", icon: FileText },
    { value: "activities", label: "Farm Activities Report", icon: FileText },
    { value: "traceability", label: "Traceability Report", icon: FileText },
    { value: "agents", label: "Extension Agent Performance", icon: BarChart3 },
  ]

  const generateReport = async () => {
    if (!filters.reportType) {
      toast({
        title: "Error",
        description: "Please select a report type",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Generating report:", filters)

      let data: any = {}

      switch (filters.reportType) {
        case "farmers":
          data = await generateFarmersReport()
          break
        case "yield":
          data = await generateYieldReport()
          break
        case "financial":
          data = await generateFinancialReport()
          break
        case "loans":
          data = await generateLoansReport()
          break
        case "activities":
          data = await generateActivitiesReport()
          break
        case "traceability":
          data = await generateTraceabilityReport()
          break
        case "agents":
          data = await generateAgentsReport()
          break
      }

      setReportData(data)
      toast({
        title: "Success",
        description: "Report generated successfully",
      })
    } catch (error: any) {
      console.error("[v0] Report generation error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateFarmersReport = async () => {
    let query = supabase.from("farmers").select("*, organizations(org_name)").order("created_at", { ascending: false })

    if (filters.organizationId && filters.organizationId !== "all") {
      query = query.eq("organization_id", filters.organizationId)
    }
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      type: "farmers",
      title: "Farmer Registration Report",
      totalCount: data?.length || 0,
      data: data || [],
      summary: {
        male: data?.filter((f: any) => f.gender === "male").length || 0,
        female: data?.filter((f: any) => f.gender === "female").length || 0,
        byState: groupBy(data || [], "state"),
      },
    }
  }

  const generateYieldReport = async () => {
    let query = supabase
      .from("harvest_batches")
      .select("*, farmers(first_name, last_name)")
      .order("harvest_date", { ascending: false })

    if (filters.organizationId && filters.organizationId !== "all") {
      query = query.eq("organization_id", filters.organizationId)
    }
    if (filters.crop) {
      query = query.eq("crop_type", filters.crop)
    }
    if (filters.startDate) {
      query = query.gte("harvest_date", filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte("harvest_date", filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const totalYield = data?.reduce((sum: number, batch: any) => sum + (batch.quantity_kg || 0), 0) || 0

    return {
      type: "yield",
      title: "Crop Yield Report",
      totalCount: data?.length || 0,
      data: data || [],
      summary: {
        totalYield: totalYield.toFixed(2),
        averageYield: data?.length ? (totalYield / data.length).toFixed(2) : 0,
        byCrop: groupBy(data || [], "crop_type"),
      },
    }
  }

  const generateFinancialReport = async () => {
    let incomeQuery = supabase.from("farmer_income").select("*").order("date", { ascending: false })

    let expenseQuery = supabase.from("farmer_expenses").select("*").order("date", { ascending: false })

    if (filters.organizationId && filters.organizationId !== "all") {
      incomeQuery = incomeQuery.eq("organization_id", filters.organizationId)
      expenseQuery = expenseQuery.eq("organization_id", filters.organizationId)
    }
    if (filters.startDate) {
      incomeQuery = incomeQuery.gte("date", filters.startDate)
      expenseQuery = expenseQuery.gte("date", filters.startDate)
    }
    if (filters.endDate) {
      incomeQuery = incomeQuery.lte("date", filters.endDate)
      expenseQuery = expenseQuery.lte("date", filters.endDate)
    }

    const [{ data: income }, { data: expenses }] = await Promise.all([incomeQuery, expenseQuery])

    const totalIncome = income?.reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
    const totalExpenses = expenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0

    return {
      type: "financial",
      title: "Financial Summary Report",
      data: { income: income || [], expenses: expenses || [] },
      summary: {
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netPosition: (totalIncome - totalExpenses).toFixed(2),
        incomeCount: income?.length || 0,
        expenseCount: expenses?.length || 0,
      },
    }
  }

  const generateLoansReport = async () => {
    let query = supabase
      .from("loan_applications")
      .select("*, farmers(first_name, last_name), loan_products(product_name)")
      .order("created_at", { ascending: false })

    if (filters.organizationId && filters.organizationId !== "all") {
      query = query.eq("organization_id", filters.organizationId)
    }
    if (filters.status) {
      query = query.eq("status", filters.status)
    }
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const totalAmount = data?.reduce((sum: number, loan: any) => sum + (loan.amount_requested || 0), 0) || 0

    return {
      type: "loans",
      title: "Loan Applications Report",
      totalCount: data?.length || 0,
      data: data || [],
      summary: {
        totalAmount: totalAmount.toFixed(2),
        approved: data?.filter((l: any) => l.status === "approved").length || 0,
        pending: data?.filter((l: any) => l.status === "pending").length || 0,
        rejected: data?.filter((l: any) => l.status === "rejected").length || 0,
      },
    }
  }

  const generateActivitiesReport = async () => {
    let query = supabase
      .from("farm_activities")
      .select("*, farmers(first_name, last_name)")
      .order("activity_date", { ascending: false })

    if (filters.organizationId && filters.organizationId !== "all") {
      query = query.eq("organization_id", filters.organizationId)
    }
    if (filters.startDate) {
      query = query.gte("activity_date", filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte("activity_date", filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      type: "activities",
      title: "Farm Activities Report",
      totalCount: data?.length || 0,
      data: data || [],
      summary: {
        byType: groupBy(data || [], "activity_type"),
        byCrop: groupBy(data || [], "crop_type"),
      },
    }
  }

  const generateTraceabilityReport = async () => {
    let query = supabase
      .from("harvest_batches")
      .select("*")
      .not("batch_code", "is", null)
      .order("harvest_date", { ascending: false })

    if (filters.organizationId && filters.organizationId !== "all") {
      query = query.eq("organization_id", filters.organizationId)
    }
    if (filters.startDate) {
      query = query.gte("harvest_date", filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte("harvest_date", filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      type: "traceability",
      title: "Traceability Report",
      totalCount: data?.length || 0,
      data: data || [],
      summary: {
        certified: data?.filter((b: any) => b.certifications && b.certifications.length > 0).length || 0,
        byCrop: groupBy(data || [], "crop_type"),
      },
    }
  }

  const generateAgentsReport = async () => {
    let query = supabase
      .from("users")
      .select("*, organizations(org_name)")
      .eq("role", "field_agent")
      .order("created_at", { ascending: false })

    if (filters.organizationId && filters.organizationId !== "all") {
      query = query.eq("organization_id", filters.organizationId)
    }

    const { data: agents, error } = await query

    if (error) throw error

    // Get farmer counts for each agent
    const agentsWithStats = await Promise.all(
      (agents || []).map(async (agent: any) => {
        const { data: farmers } = await supabase.from("farmers").select("id").eq("assigned_agent_id", agent.id)

        return {
          ...agent,
          farmerCount: farmers?.length || 0,
        }
      }),
    )

    return {
      type: "agents",
      title: "Extension Agent Performance Report",
      totalCount: agentsWithStats.length,
      data: agentsWithStats,
      summary: {
        totalAgents: agentsWithStats.length,
        totalFarmers: agentsWithStats.reduce((sum: number, a: any) => sum + a.farmerCount, 0),
        averageFarmersPerAgent:
          agentsWithStats.length > 0
            ? (
                agentsWithStats.reduce((sum: number, a: any) => sum + a.farmerCount, 0) / agentsWithStats.length
              ).toFixed(1)
            : 0,
      },
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    let csvContent = ""
    const filename = `${reportData.type}_report_${new Date().toISOString().split("T")[0]}.csv`

    // Generate CSV based on report type
    switch (reportData.type) {
      case "farmers":
        csvContent = generateFarmersCSV(reportData.data)
        break
      case "yield":
        csvContent = generateYieldCSV(reportData.data)
        break
      case "financial":
        csvContent = generateFinancialCSV(reportData.data)
        break
      case "loans":
        csvContent = generateLoansCSV(reportData.data)
        break
      case "activities":
        csvContent = generateActivitiesCSV(reportData.data)
        break
      case "traceability":
        csvContent = generateTraceabilityCSV(reportData.data)
        break
      case "agents":
        csvContent = generateAgentsCSV(reportData.data)
        break
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()

    toast({
      title: "Success",
      description: "Report exported successfully",
    })
  }

  const generateFarmersCSV = (data: any[]) => {
    const headers = ["Name", "Phone", "Gender", "State", "LGA", "Organization", "Registration Date"]
    const rows = data.map((f) => [
      `${f.first_name} ${f.last_name}`,
      f.phone || "",
      f.gender || "",
      f.state || "",
      f.lga || "",
      f.organizations?.org_name || "",
      new Date(f.created_at).toLocaleDateString(),
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  const generateYieldCSV = (data: any[]) => {
    const headers = ["Farmer", "Crop", "Quantity (kg)", "Harvest Date", "Batch Code"]
    const rows = data.map((h) => [
      h.farmers ? `${h.farmers.first_name} ${h.farmers.last_name}` : "",
      h.crop_type || "",
      h.quantity_kg || 0,
      new Date(h.harvest_date).toLocaleDateString(),
      h.batch_code || "",
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  const generateFinancialCSV = (data: any) => {
    const incomeHeaders = ["Type", "Amount", "Source", "Date"]
    const incomeRows = data.income.map((i: any) => [
      "Income",
      i.amount || 0,
      i.source || "",
      new Date(i.date).toLocaleDateString(),
    ])

    const expenseHeaders = ["Type", "Amount", "Category", "Date"]
    const expenseRows = data.expenses.map((e: any) => [
      "Expense",
      e.amount || 0,
      e.category || "",
      new Date(e.date).toLocaleDateString(),
    ])

    return [incomeHeaders, ...incomeRows, [""], expenseHeaders, ...expenseRows].map((row) => row.join(",")).join("\n")
  }

  const generateLoansCSV = (data: any[]) => {
    const headers = ["Farmer", "Product", "Amount", "Status", "Application Date"]
    const rows = data.map((l) => [
      l.farmers ? `${l.farmers.first_name} ${l.farmers.last_name}` : "",
      l.loan_products?.product_name || "",
      l.amount_requested || 0,
      l.status || "",
      new Date(l.created_at).toLocaleDateString(),
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  const generateActivitiesCSV = (data: any[]) => {
    const headers = ["Farmer", "Activity Type", "Crop", "Date", "Notes"]
    const rows = data.map((a) => [
      a.farmers ? `${a.farmers.first_name} ${a.farmers.last_name}` : "",
      a.activity_type || "",
      a.crop_type || "",
      new Date(a.activity_date).toLocaleDateString(),
      a.notes || "",
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  const generateTraceabilityCSV = (data: any[]) => {
    const headers = ["Batch Code", "Crop", "Quantity (kg)", "Harvest Date", "Certifications"]
    const rows = data.map((b) => [
      b.batch_code || "",
      b.crop_type || "",
      b.quantity_kg || 0,
      new Date(b.harvest_date).toLocaleDateString(),
      b.certifications ? b.certifications.join("; ") : "",
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  const generateAgentsCSV = (data: any[]) => {
    const headers = ["Name", "Email", "Phone", "Organization", "Assigned Farmers", "Join Date"]
    const rows = data.map((a) => [
      `${a.first_name} ${a.last_name}`,
      a.email || "",
      a.phone || "",
      a.organizations?.org_name || "",
      a.farmerCount || 0,
      new Date(a.created_at).toLocaleDateString(),
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[25px] border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-poppins text-xl">Report Configuration</CardTitle>
          <CardDescription className="font-inter">Select report type and filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reportType" className="font-inter text-sm">
                Report Type *
              </Label>
              <Select
                value={filters.reportType}
                onValueChange={(value) => setFilters({ ...filters, reportType: value })}
              >
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentUser.role === "super_admin" && (
              <div className="space-y-2">
                <Label htmlFor="organizationId" className="font-inter text-sm">
                  Organization
                </Label>
                <Select
                  value={filters.organizationId}
                  onValueChange={(value) => setFilters({ ...filters, organizationId: value })}
                >
                  <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                    <SelectValue placeholder="All organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.org_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="font-inter text-sm">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="font-inter text-sm">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={generateReport}
              disabled={loading}
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>

            {reportData && (
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-transparent"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card className="rounded-[25px] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-poppins text-xl">{reportData.title}</CardTitle>
            <CardDescription className="font-inter">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {Object.entries(reportData.summary).map(([key, value]: [string, any]) => (
                <div key={key} className="p-4 bg-[rgba(57,181,74,0.05)] rounded-[15px]">
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-2xl font-poppins font-semibold text-[#39B54A]">
                    {typeof value === "object" ? Object.keys(value).length : value}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
              <p>
                Total Records:{" "}
                {reportData.totalCount || reportData.data?.income?.length + reportData.data?.expenses?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function groupBy(array: any[], key: string) {
  return array.reduce((result, item) => {
    const group = item[key] || "Unknown"
    result[group] = (result[group] || 0) + 1
    return result
  }, {})
}
