"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowLeft, Building2, Users, Sprout } from "lucide-react"
import { createOrganizationAccount } from "@/app/actions/create-organization-account"

type AccountType = "organization" | "extension_agent" | "farmer" | null
type Step = "account_type" | "user_details" | "organization_details" | "select_organization"

interface Organization {
  id: string
  org_name: string
  org_type: string
  state: string
}

interface ExtensionAgent {
  id: string
  first_name: string
  last_name: string
  phone: string
}

export default function SignUpPage() {
  const [step, setStep] = useState<Step>("account_type")
  const [accountType, setAccountType] = useState<AccountType>(null)

  // User details
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")

  // Organization details
  const [orgName, setOrgName] = useState("")
  const [orgType, setOrgType] = useState("")
  const [orgAddress, setOrgAddress] = useState("")
  const [orgState, setOrgState] = useState("")
  const [orgPhone, setOrgPhone] = useState("")
  const [orgEmail, setOrgEmail] = useState("")

  // Organization and agent selection
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [extensionAgents, setExtensionAgents] = useState<ExtensionAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (step === "select_organization") {
      fetchOrganizations()
    }
  }, [step])

  useEffect(() => {
    if (accountType === "farmer" && selectedOrgId) {
      fetchExtensionAgents(selectedOrgId)
    }
  }, [selectedOrgId, accountType])

  const fetchOrganizations = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("organizations")
        .select("id, org_name, org_type, state")
        .eq("is_active", true)
        .order("org_name")

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error("Error fetching organizations:", error)
    }
  }

  const fetchExtensionAgents = async (orgId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, phone")
        .eq("organization_id", orgId)
        .eq("role", "field_agent")
        .eq("is_active", true)
        .order("first_name")

      if (error) throw error
      setExtensionAgents(data || [])
    } catch (error) {
      console.error("Error fetching extension agents:", error)
      setExtensionAgents([])
    }
  }

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type)
    setStep("user_details")
  }

  const handleUserDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (accountType === "organization") {
      setStep("organization_details")
    } else {
      setStep("select_organization")
    }
  }

  const handleOrganizationDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await createOrganizationAccount({
        email,
        password,
        firstName,
        lastName,
        phone,
        orgName,
        orgType,
        orgAddress,
        orgState,
        orgPhone,
        orgEmail,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to create account")
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("[v0] Sign in error:", signInError)
        throw new Error("Account created but failed to sign in. Please try logging in manually.")
      }

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      console.error("[v0] Sign up error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExtensionAgentOrFarmerSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!selectedOrgId) {
      setError("Please select an organization")
      setIsLoading(false)
      return
    }

    if (accountType === "farmer" && !selectedAgentId) {
      setError("Please select an extension agent")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            role: accountType === "extension_agent" ? "field_agent" : "farmer",
            organization_id: selectedOrgId,
            extension_agent_id: accountType === "farmer" ? selectedAgentId : null,
            account_type: accountType,
          },
        },
      })

      if (authError) throw authError

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      console.error("Sign up error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#39B54A] to-[#2D5016] items-center justify-center p-12">
        <div className="max-w-md space-y-6 text-white">
          <Image src="/farmwise-logo-white.png" alt="Farmwise" width={200} height={67} className="w-auto h-24" />
          <h2 className="text-4xl font-bold font-poppins">Transforming Agriculture through Data-Driven Solutions</h2>
          <p className="text-lg font-inter opacity-90">
            Join thousands of farmers, extension agents, and organizations using Farmwise to revolutionize agriculture.
          </p>
          <div className="space-y-4 pt-8">
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold font-poppins">Easy Setup</h3>
                <p className="text-sm opacity-80 font-inter">Get started in minutes</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold font-poppins">Secure & Reliable</h3>
                <p className="text-sm opacity-80 font-inter">Your data is safe with us</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold font-poppins">24/7 Support</h3>
                <p className="text-sm opacity-80 font-inter">We are here to help you succeed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex flex-1 items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center text-sm text-[#39B54A] hover:text-[#2D5016] font-inter">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
            {step !== "account_type" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === "user_details") setStep("account_type")
                  else if (step === "organization_details" || step === "select_organization") setStep("user_details")
                }}
                className="text-[#39B54A] hover:text-[#2D5016]"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center space-y-2">
            <Image
              src="/farmwise-logo-green.png"
              alt="Farmwise"
              width={200}
              height={67}
              className="w-auto h-16 lg:hidden"
            />
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Agricultural Management Platform</p>
          </div>

          {step === "account_type" && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold font-poppins text-[#000000]">Choose Account Type</h1>
                <p className="text-[rgba(0,0,0,0.65)] font-inter">Select the type of account you want to create</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleAccountTypeSelect("organization")}
                  className="w-full p-6 border-2 border-[rgba(0,0,0,0.23)] rounded-[10px] hover:border-[#39B54A] hover:bg-[#39B54A]/5 transition-all text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#39B54A]/10">
                      <Building2 className="h-6 w-6 text-[#39B54A]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold font-poppins text-lg text-[#000000]">Organization</h3>
                      <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
                        For government agencies, cooperatives, NGOs, or commodity aggregators
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleAccountTypeSelect("extension_agent")}
                  className="w-full p-6 border-2 border-[rgba(0,0,0,0.23)] rounded-[10px] hover:border-[#39B54A] hover:bg-[#39B54A]/5 transition-all text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#39B54A]/10">
                      <Users className="h-6 w-6 text-[#39B54A]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold font-poppins text-lg text-[#000000]">Extension Agent</h3>
                      <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
                        For field agents working with farmers under an organization
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleAccountTypeSelect("farmer")}
                  className="w-full p-6 border-2 border-[rgba(0,0,0,0.23)] rounded-[10px] hover:border-[#39B54A] hover:bg-[#39B54A]/5 transition-all text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#39B54A]/10">
                      <Sprout className="h-6 w-6 text-[#39B54A]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold font-poppins text-lg text-[#000000]">Farmer</h3>
                      <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
                        For individual farmers managing their farm operations
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm font-inter text-[rgba(0,0,0,0.65)]">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="font-medium text-[#39B54A] hover:text-[#2D5016] hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          )}

          {step === "user_details" && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold font-poppins text-[#000000]">Create Your Account</h1>
                <p className="text-[rgba(0,0,0,0.65)] font-inter">
                  {accountType === "organization" && "Set up your organization account"}
                  {accountType === "extension_agent" && "Set up your extension agent account"}
                  {accountType === "farmer" && "Set up your farmer account"}
                </p>
              </div>

              <form onSubmit={handleUserDetailsSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="font-inter text-[rgba(0,0,0,0.87)]">
                      First Name
                    </Label>
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="John"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="font-inter text-[rgba(0,0,0,0.87)]">
                      Last Name
                    </Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Doe"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                    />
                  </div>
                </div>

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
                  <Label htmlFor="phone" className="font-inter text-[rgba(0,0,0,0.87)]">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    placeholder="Create a password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repeat-password" className="font-inter text-[rgba(0,0,0,0.87)]">
                    Confirm Password
                  </Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    placeholder="Confirm your password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                {error && (
                  <div className="rounded-[10px] bg-red-50 border border-red-200 p-3 text-sm text-red-600 font-inter">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter font-medium text-base"
                >
                  Continue
                </Button>
              </form>
            </div>
          )}

          {step === "organization_details" && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold font-poppins text-[#000000]">Organization Details</h1>
                <p className="text-[rgba(0,0,0,0.65)] font-inter">Tell us about your organization</p>
              </div>

              <form onSubmit={handleOrganizationDetailsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="font-inter text-[rgba(0,0,0,0.87)]">
                    Organization Name
                  </Label>
                  <Input
                    id="org-name"
                    type="text"
                    placeholder="Enter organization name"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-type" className="font-inter text-[rgba(0,0,0,0.87)]">
                    Organization Type
                  </Label>
                  <Select value={orgType} onValueChange={setOrgType} required>
                    <SelectTrigger className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter">
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="government">Government Agency</SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                      <SelectItem value="ngo">NGO</SelectItem>
                      <SelectItem value="private_aggregator">Commodity Aggregator</SelectItem>
                      <SelectItem value="research">Research Institution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-state" className="font-inter text-[rgba(0,0,0,0.87)]">
                    State
                  </Label>
                  <Input
                    id="org-state"
                    type="text"
                    placeholder="Enter state"
                    required
                    value={orgState}
                    onChange={(e) => setOrgState(e.target.value)}
                    className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-address" className="font-inter text-[rgba(0,0,0,0.87)]">
                    Address
                  </Label>
                  <Textarea
                    id="org-address"
                    placeholder="Enter organization address"
                    required
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-phone" className="font-inter text-[rgba(0,0,0,0.87)]">
                    Organization Phone
                  </Label>
                  <Input
                    id="org-phone"
                    type="tel"
                    placeholder="Enter phone number"
                    required
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-email" className="font-inter text-[rgba(0,0,0,0.87)]">
                    Organization Email
                  </Label>
                  <Input
                    id="org-email"
                    type="email"
                    placeholder="Enter email address"
                    required
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
                  />
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
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </div>
          )}

          {step === "select_organization" && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold font-poppins text-[#000000]">
                  {accountType === "farmer" ? "Select Organization & Agent" : "Select Organization"}
                </h1>
                <p className="text-[rgba(0,0,0,0.65)] font-inter">
                  {accountType === "farmer"
                    ? "Choose your organization and the extension agent managing your account"
                    : "Choose the organization you are associated with"}
                </p>
              </div>

              <form onSubmit={handleExtensionAgentOrFarmerSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organization" className="font-inter text-[rgba(0,0,0,0.87)]">
                    Organization <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId} required>
                    <SelectTrigger className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter">
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.org_name} - {org.org_type} ({org.state})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter mt-1">
                    Cannot find your organization? Contact your organization admin to create an account first.
                  </p>
                </div>

                {accountType === "farmer" && selectedOrgId && (
                  <div className="space-y-2">
                    <Label htmlFor="extension-agent" className="font-inter text-[rgba(0,0,0,0.87)]">
                      Extension Agent <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId} required>
                      <SelectTrigger className="h-12 rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter">
                        <SelectValue placeholder="Select your extension agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {extensionAgents.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No extension agents available
                          </SelectItem>
                        ) : (
                          extensionAgents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.first_name} {agent.last_name} - {agent.phone}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter mt-1">
                      Select the extension agent who will manage your farmer account.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-[10px] bg-red-50 border border-red-200 p-3 text-sm text-red-600 font-inter">
                    {error}
                  </div>
                )}

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1 h-4 w-4 rounded border-[rgba(0,0,0,0.23)] text-[#39B54A] focus:ring-[#39B54A]"
                  />
                  <Label htmlFor="terms" className="text-sm font-inter text-[rgba(0,0,0,0.65)] cursor-pointer">
                    I agree to the{" "}
                    <Link href="/terms" className="text-[#39B54A] hover:text-[#2D5016] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#39B54A] hover:text-[#2D5016] hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter font-medium text-base"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
