"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { AddIncomeForm } from "@/components/add-income-form"
import { AddExpenseForm } from "@/components/add-expense-form"
import { CreditScoreCard } from "@/components/credit-score-card"

interface FarmerFinanceSectionProps {
  farmerId: string
  financialSummary: any
}

export function FarmerFinanceSection({ farmerId, financialSummary }: FarmerFinanceSectionProps) {
  const [showIncomeDialog, setShowIncomeDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Record Income</DialogTitle>
                    <DialogDescription>Add a new income transaction for this farmer</DialogDescription>
                  </DialogHeader>
                  <AddIncomeForm farmerId={farmerId} onSuccess={() => setShowIncomeDialog(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Income</p>
            <p className="text-2xl font-semibold mb-2">₦{financialSummary?.total_income?.toLocaleString() || "0"}</p>
            <p className="text-xs text-muted-foreground">
              Last 30 days: ₦{financialSummary?.income_last_30_days?.toLocaleString() || "0"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Record Expense</DialogTitle>
                    <DialogDescription>Add a new expense transaction for this farmer</DialogDescription>
                  </DialogHeader>
                  <AddExpenseForm farmerId={farmerId} onSuccess={() => setShowExpenseDialog(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-semibold mb-2">₦{financialSummary?.total_expenses?.toLocaleString() || "0"}</p>
            <p className="text-xs text-muted-foreground">
              Last 30 days: ₦{financialSummary?.expenses_last_30_days?.toLocaleString() || "0"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Net Position</p>
            <p className="text-2xl font-semibold mb-2">₦{financialSummary?.net_position?.toLocaleString() || "0"}</p>
            <p className="text-xs text-muted-foreground">
              Outstanding Debt: ₦{financialSummary?.total_outstanding_debt?.toLocaleString() || "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Score */}
      <CreditScoreCard
        farmerId={farmerId}
        creditScore={financialSummary?.total_credit_score}
        creditRating={financialSummary?.credit_rating}
      />

      {/* Transaction History */}
      <Card className="rounded-card">
        <CardHeader>
          <CardTitle className="font-heading">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="rounded-tab">
              <TabsTrigger value="all" className="rounded-tab">
                All Transactions
              </TabsTrigger>
              <TabsTrigger value="income" className="rounded-tab">
                Income
              </TabsTrigger>
              <TabsTrigger value="expenses" className="rounded-tab">
                Expenses
              </TabsTrigger>
              <TabsTrigger value="loans" className="rounded-tab">
                Loans
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="text-center py-8 text-muted-foreground">
                <p>Transaction history will be displayed here</p>
                <p className="text-sm mt-2">Start by recording income or expenses using the buttons above</p>
              </div>
            </TabsContent>

            <TabsContent value="income">
              <div className="text-center py-8 text-muted-foreground">
                <p>Income transactions will be displayed here</p>
              </div>
            </TabsContent>

            <TabsContent value="expenses">
              <div className="text-center py-8 text-muted-foreground">
                <p>Expense transactions will be displayed here</p>
              </div>
            </TabsContent>

            <TabsContent value="loans">
              <div className="text-center py-8 text-muted-foreground">
                <p>Loan information will be displayed here</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
