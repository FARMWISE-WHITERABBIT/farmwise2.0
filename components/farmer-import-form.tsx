"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from "lucide-react"
import * as XLSX from "xlsx"

interface FarmerImportFormProps {
  userId: string
  organizationId: string
}

interface ImportResult {
  success: number
  failed: number
  merged: number
  errors: string[]
}

export function FarmerImportForm({ userId, organizationId }: FarmerImportFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)

  const downloadTemplate = () => {
    const template = [
      {
        first_name: "John",
        last_name: "Doe",
        phone: "08012345678",
        email: "john@example.com",
        gender: "male",
        date_of_birth: "1980-01-15",
        state: "Lagos",
        lga: "Ikeja",
        ward: "Ward 1",
        address: "123 Farm Road",
        farm_size_hectares: "5.5",
        farming_experience_years: "10",
        primary_crops: "Rice,Maize,Cassava",
        livestock_kept: "Cattle,Poultry",
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Farmers")
    XLSX.writeFile(wb, "farmer_import_template.xlsx")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]

      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
        setResult(null)
      } else {
        alert("Please upload a valid CSV or Excel file")
      }
    }
  }

  const validateRow = (row: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!row.first_name) errors.push("First name is required")
    if (!row.last_name) errors.push("Last name is required")
    if (!row.phone) errors.push("Phone number is required")
    if (!row.state) errors.push("State is required")
    if (!row.lga) errors.push("LGA is required")

    // Validate phone format
    if (row.phone && !/^[0-9]{11}$/.test(row.phone.replace(/\s/g, ""))) {
      errors.push("Invalid phone number format")
    }

    // Validate email if provided
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push("Invalid email format")
    }

    // Validate gender
    if (row.gender && !["male", "female", "other"].includes(row.gender.toLowerCase())) {
      errors.push("Gender must be male, female, or other")
    }

    return { valid: errors.length === 0, errors }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)
    setResult(null)

    try {
      // Read file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const results: ImportResult = {
        success: 0,
        failed: 0,
        merged: 0,
        errors: [],
      }

      // Process each row
      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i]
        setProgress(((i + 1) / jsonData.length) * 100)

        // Validate row
        const validation = validateRow(row)
        if (!validation.valid) {
          results.failed++
          results.errors.push(`Row ${i + 2}: ${validation.errors.join(", ")}`)
          continue
        }

        try {
          // Check for existing farmer by phone
          const { data: existing } = await supabase
            .from("farmers")
            .select("id")
            .eq("phone", row.phone)
            .eq("organization_id", organizationId)
            .single()

          // Parse arrays
          const primaryCrops = row.primary_crops ? row.primary_crops.split(",").map((c: string) => c.trim()) : []

          const livestockKept = row.livestock_kept ? row.livestock_kept.split(",").map((l: string) => l.trim()) : []

          const farmerData = {
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone,
            email: row.email || null,
            gender: row.gender?.toLowerCase() || null,
            date_of_birth: row.date_of_birth || null,
            state: row.state,
            lga: row.lga,
            ward: row.ward || null,
            address: row.address || null,
            farm_size_hectares: Number.parseFloat(row.farm_size_hectares) || null,
            farming_experience_years: Number.parseInt(row.farming_experience_years) || null,
            primary_crops: primaryCrops,
            livestock_kept: livestockKept,
            organization_id: organizationId,
            registered_by: userId,
            assigned_agent_id: userId,
            verification_status: "pending",
          }

          if (existing) {
            // Merge with existing record
            const { error } = await supabase.from("farmers").update(farmerData).eq("id", existing.id)

            if (error) throw error
            results.merged++
          } else {
            // Insert new record
            const { error } = await supabase.from("farmers").insert(farmerData)

            if (error) throw error
            results.success++
          }
        } catch (error: any) {
          results.failed++
          results.errors.push(`Row ${i + 2}: ${error.message}`)
        }
      }

      setResult(results)

      if (results.success > 0 || results.merged > 0) {
        setTimeout(() => router.push("/dashboard/farmers"), 2000)
      }
    } catch (error: any) {
      alert(`Import failed: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Download Template</CardTitle>
          <CardDescription>Start by downloading our template file with the correct format</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download Excel Template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Upload your CSV or Excel file with farmer data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
              className="cursor-pointer"
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">Importing... {Math.round(progress)}%</p>
            </div>
          )}

          <Button onClick={handleImport} disabled={!file || importing} className="w-full gap-2">
            <Upload className="h-4 w-4" />
            {importing ? "Importing..." : "Import Farmers"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Alert variant={result.failed > 0 ? "destructive" : "default"}>
          <div className="flex items-start gap-2">
            {result.failed > 0 ? (
              <AlertCircle className="h-4 w-4 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mt-0.5" />
            )}
            <div className="flex-1 space-y-2">
              <AlertDescription>
                <div className="font-semibold mb-2">Import Complete</div>
                <ul className="space-y-1 text-sm">
                  <li>✓ Successfully imported: {result.success}</li>
                  <li>↻ Merged with existing: {result.merged}</li>
                  <li>✗ Failed: {result.failed}</li>
                </ul>
                {result.errors.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-semibold">View Errors ({result.errors.length})</summary>
                    <ul className="mt-2 space-y-1 text-xs">
                      {result.errors.slice(0, 10).map((error, i) => (
                        <li key={i} className="text-destructive">
                          {error}
                        </li>
                      ))}
                      {result.errors.length > 10 && <li>... and {result.errors.length - 10} more errors</li>}
                    </ul>
                  </details>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Import Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Required fields: first_name, last_name, phone, state, lga</li>
            <li>• Phone numbers must be 11 digits</li>
            <li>• Gender must be: male, female, or other</li>
            <li>• Multiple crops/livestock should be comma-separated</li>
            <li>• Duplicate phone numbers will merge with existing records</li>
            <li>• Date format: YYYY-MM-DD</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
