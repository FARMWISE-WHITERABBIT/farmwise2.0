"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase/client"
import { Calendar, DollarSign } from "lucide-react"

interface FinancialRecordsListProps {
  type: "income" | "expenses"
  farmerId: string | null
  organizationId: string | null
  refreshKey: number
}

export default function FinancialRecordsList({
  type,
  farmerId,
  organizationId,
  refreshKey,
}: FinancialRecordsListProps) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true)
      try {
        const supabase = createBrowserClient()

        const table = type === "income" ? "farmer_income" : "farmer_expenses"
        let query = supabase.from(table).select("*").order("transaction_date", { ascending: false })

        if (farmerId) {
          query = query.eq("farmer_id", farmerId)
        } else if (organizationId) {
          query = query.eq("organization_id", organizationId)
        }

        const { data, error } = await query

        if (error) throw error

        setRecords(data || [])
      } catch (error) {
        console.error(`[v0] Error fetching ${type}:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [type, farmerId, organizationId, refreshKey])

  if (loading) {
    return (
      <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
        <CardContent className="p-6">
          <p className="text-center text-[rgba(0,0,0,0.45)] font-inter">Loading records...</p>
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
        <CardContent className="p-6">
          <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">
            No {type} records yet. Click "Add {type === "income" ? "Income" : "Expense"}" to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-poppins">
          {type === "income" ? "Income" : "Expense"} Records ({records.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-[15px]">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-poppins font-semibold text-[#000000]">
                    {type === "income" ? record.income_type : record.expense_category}
                  </p>
                  {record.verified && <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-[rgba(0,0,0,0.65)] font-inter">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(record.transaction_date).toLocaleDateString()}</span>
                  </div>
                  {record.payment_method && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>{record.payment_method}</span>
                    </div>
                  )}
                  {type === "income" && record.crop_type && (
                    <Badge variant="outline" className="text-xs">
                      {record.crop_type}
                    </Badge>
                  )}
                </div>
                {record.notes && <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mt-2">{record.notes}</p>}
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-poppins font-semibold ${type === "income" ? "text-[#39B54A]" : "text-[#FF6B6B]"}`}
                >
                  ₦{Number(record.amount).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
