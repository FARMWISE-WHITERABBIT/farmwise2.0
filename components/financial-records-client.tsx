"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import IncomeRecordForm from "@/components/income-record-form"
import ExpenseRecordForm from "@/components/expense-record-form"
import FinancialRecordsList from "@/components/financial-records-list"

interface FinancialRecordsClientProps {
  userRole: string
  farmerId: string | null
  organizationId: string | null
}

export default function FinancialRecordsClient({ userRole, farmerId, organizationId }: FinancialRecordsClientProps) {
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRecordAdded = () => {
    setRefreshKey((prev) => prev + 1)
    setIncomeDialogOpen(false)
    setExpenseDialogOpen(false)
  }

  return (
    <Tabs defaultValue="income" className="space-y-6">
      <div className="flex items-center justify-between">
        <TabsList className="bg-white rounded-[15px] p-1 shadow-sm">
          <TabsTrigger
            value="income"
            className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
          >
            Income
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
          >
            Expenses
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
          >
            Summary
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-2">
          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#39B54A] hover:bg-[#2d8f3a] text-white rounded-[12px] font-inter">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-poppins">Record Income</DialogTitle>
              </DialogHeader>
              <IncomeRecordForm farmerId={farmerId} organizationId={organizationId} onSuccess={handleRecordAdded} />
            </DialogContent>
          </Dialog>

          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-[#39B54A] text-[#39B54A] hover:bg-[rgba(57,181,74,0.1)] rounded-[12px] font-inter bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-poppins">Record Expense</DialogTitle>
              </DialogHeader>
              <ExpenseRecordForm farmerId={farmerId} organizationId={organizationId} onSuccess={handleRecordAdded} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TabsContent value="income">
        <FinancialRecordsList
          type="income"
          farmerId={farmerId}
          organizationId={organizationId}
          refreshKey={refreshKey}
        />
      </TabsContent>

      <TabsContent value="expenses">
        <FinancialRecordsList
          type="expenses"
          farmerId={farmerId}
          organizationId={organizationId}
          refreshKey={refreshKey}
        />
      </TabsContent>

      <TabsContent value="summary">
        <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-poppins">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-[rgba(0,0,0,0.45)] font-inter py-8">
              Detailed financial analytics coming soon
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
