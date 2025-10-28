"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface FarmerActivitiesSectionProps {
  farmerId: string
}

export function FarmerActivitiesSection({ farmerId }: FarmerActivitiesSectionProps) {
  return (
    <Card className="rounded-card">
      <CardContent className="py-16 text-center">
        <p className="text-muted-foreground mb-4">Farm activities will be displayed here</p>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </CardContent>
    </Card>
  )
}
