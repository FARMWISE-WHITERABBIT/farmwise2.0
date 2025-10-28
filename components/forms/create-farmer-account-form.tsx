"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface CreateFarmerAccountFormProps {
  farmer: {
    id: string
    farmer_id: string
    first_name: string
    last_name: string
    email?: string
    primary_phone: string
    organization_id?: string
    preferred_language?: string
  }
}

export default function CreateFarmerAccountForm({ farmer }: CreateFarmerAccountFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: farmer.email || "",
    phone: farmer.primary_phone,
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error("Email and password are required")
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }

      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      // Create auth user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: farmer.first_name,
            last_name: farmer.last_name,
            role: "farmer",
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create user account")

      // Create user record in users table
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        organization_id: farmer.organization_id,
        first_name: farmer.first_name,
        last_name: farmer.last_name,
        email: formData.email,
        phone: formData.phone,
        role: "farmer",
        is_active: true,
        email_verified: false,
        preferred_language: farmer.preferred_language || "English",
      })

      if (userError) throw userError

      // Link user to farmer
      const { error: linkError } = await supabase
        .from("farmers")
        .update({ user_id: authData.user.id })
        .eq("id", farmer.id)

      if (linkError) throw linkError

      setSuccess(true)
      setTimeout(() => {
        router.push(`/dashboard/farmers/${farmer.id}`)
        router.refresh()
      }, 2000)
    } catch (err: any) {
      console.error("[v0] Error creating farmer account:", err)
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">Account created successfully! Redirecting...</AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-inter">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="farmer@example.com"
            required
            className="rounded-[10px]"
          />
          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">This will be used for login and notifications</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="font-inter">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+234 XXX XXX XXXX"
            className="rounded-[10px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-inter">
            Password *
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimum 8 characters"
            required
            minLength={8}
            className="rounded-[10px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-inter">
            Confirm Password *
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Re-enter password"
            required
            minLength={8}
            className="rounded-[10px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="rounded-[10px]"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#39B54A] hover:bg-[#2d8f3a] rounded-[10px]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </div>
    </form>
  )
}
