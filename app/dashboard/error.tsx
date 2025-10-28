"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Dashboard Error</CardTitle>
          </div>
          <CardDescription>An error occurred while loading the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">This could be due to:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Network connectivity issues</li>
              <li>Authentication problems</li>
              <li>Server unavailability</li>
            </ul>
          </div>
          <div className="text-xs bg-muted p-2 rounded">
            <p className="font-medium mb-1">Error message:</p>
            <p>{error.message || "Unknown error"}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              Try again
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/auth/login")} className="flex-1">
              Go to login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
