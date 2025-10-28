"use client"

import type React from "react"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.session) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Side - Login Form */}
      <div className="flex flex-1 items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-start">
            <Link href="/" className="flex items-center text-sm text-[#39B54A] hover:text-[#2D5016] font-inter">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <Image src="/farmwise-logo-green.png" alt="Farmwise" width={200} height={67} className="w-auto h-24" />
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Agricultural Management Platform</p>
          </div>

          {/* Welcome Text */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold font-poppins text-[#000000]">Welcome Back</h1>
            <p className="text-[rgba(0,0,0,0.65)] font-inter">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-inter text-[rgba(0,0,0,0.87)]">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-inter text-[rgba(0,0,0,0.87)]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-[rgba(0,0,0,0.23)] text-[#39B54A] focus:ring-[#39B54A]"
                />
                <Label htmlFor="remember" className="text-sm font-inter text-[rgba(0,0,0,0.65)] cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-inter text-[#39B54A] hover:text-[#2D5016] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="rounded-[10px] bg-red-50 border border-red-200 p-3 text-sm text-red-600 font-inter">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter font-medium text-base"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm font-inter text-[rgba(0,0,0,0.65)]">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="font-medium text-[#39B54A] hover:text-[#2D5016] hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#39B54A] to-[#2D5016] items-center justify-center p-12">
        <div className="max-w-md space-y-6 text-white">
          
          <h2 className="text-4xl font-bold font-poppins">Empowering Farmers with Technology</h2>
          <p className="text-lg font-inter text-white/90">
            Manage your farm operations, track activities, and grow your agricultural business with Farmwise.
          </p>
          <div className="space-y-4 pt-8">
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold font-poppins">Farm Management</h3>
                <p className="text-sm text-white/80 font-inter">Track plots, activities, and harvests</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold font-poppins">Financial Tracking</h3>
                <p className="text-sm text-white/80 font-inter">Monitor income, expenses, and loans</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold font-poppins">Data-Driven Insights</h3>
                <p className="text-sm text-white/80 font-inter">Make informed decisions with analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
