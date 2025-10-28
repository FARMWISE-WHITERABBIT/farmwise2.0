"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function CreateDemoUserPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDemoUser = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createBrowserClient()

      // Create demo user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: "demo@farmwise.com",
        password: "demo123456",
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: "Demo User",
          },
        },
      })

      if (signUpError) throw signUpError

      // Insert demo organization
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({
          id: "00000000-0000-0000-0000-000000000001",
          name: "Demo Organization",
          type: "cooperative",
          contact_email: "demo@farmwise.com",
          contact_phone: "+1234567890",
        })
        .select()
        .single()

      if (orgError && orgError.code !== "23505") {
        // Ignore duplicate key error
        console.log("Organization might already exist:", orgError)
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to create demo user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Demo User</CardTitle>
          <CardDescription className="text-center">Set up a demo account for testing Farmwise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Demo user created successfully! You can now log in with:
                <div className="mt-2 p-3 bg-white rounded-md font-mono text-sm">
                  <div>Email: demo@farmwise.com</div>
                  <div>Password: demo123456</div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>This will create a demo account with the following credentials:</p>
                <div className="p-3 bg-muted rounded-md font-mono text-sm">
                  <div>Email: demo@farmwise.com</div>
                  <div>Password: demo123456</div>
                </div>
                <p className="text-xs">
                  Note: If the user already exists, you can use these credentials to log in directly.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={createDemoUser} disabled={loading} className="w-full bg-[#39B54A] hover:bg-[#2d8f3a]">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Demo User...
                  </>
                ) : (
                  "Create Demo User"
                )}
              </Button>
            </>
          )}

          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <a href="/auth/login">Go to Login</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
