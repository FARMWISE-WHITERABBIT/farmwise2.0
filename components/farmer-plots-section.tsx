"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface FarmerPlotsSectionProps {
  farmerId: string
}

export function FarmerPlotsSection({ farmerId }: FarmerPlotsSectionProps) {
  return (
    <Card className="rounded-card">
      <CardContent className="py-16 text-center">
        <p className="text-muted-foreground mb-4">Farm plots will be displayed here</p>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Farm Plot
        </Button>
      </CardContent>
    </Card>
  )
}
