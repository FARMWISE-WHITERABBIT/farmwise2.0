"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CreditCard, TrendingUp, AlertCircle } from "lucide-react"

interface CreditScoreCardProps {
  farmerId: string
  creditScore?: number
  creditRating?: string
}

export function CreditScoreCard({ farmerId, creditScore, creditRating }: CreditScoreCardProps) {
  const score = creditScore || 0
  const rating = creditRating || "No Rating"

  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-700 border-green-200"
      case "good":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "fair":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "poor":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <Card className="rounded-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Credit Score & Rating
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Score Display */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Credit Score</p>
              <p className="text-4xl font-bold">{score}</p>
              <p className="text-xs text-muted-foreground mt-1">Out of 1000</p>
            </div>
            <Badge className={`${getRatingColor(rating)} text-lg px-4 py-2`}>{rating}</Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={(score / 1000) * 100} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1000</span>
            </div>
          </div>

          {/* Score Factors */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Score Factors:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Repayment History</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-muted-foreground">Income Stability</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-muted-foreground">Farm Productivity</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-muted-foreground">Record Keeping</span>
              </div>
            </div>
          </div>

          {score === 0 && (
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">No credit score available</p>
                <p className="text-xs">
                  Credit score will be calculated based on financial transactions, loan repayment history, and farming
                  activities.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
