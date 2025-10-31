"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, User, Filter, X } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"

interface FarmersListClientProps {
  farmers: any[]
  totalCount: number
  organizations: any[]
  states: string[]
  initialFilters: {
    search: string
    organization: string
    cropType: string
    state: string
    lga: string
    verificationStatus: string
    dateFrom: string
    dateTo: string
  }
  userRole: string
}

const CROP_TYPES = [
  "Cassava",
  "Yam",
  "Maize",
  "Rice",
  "Beans",
  "Sorghum",
  "Millet",
  "Groundnut",
  "Soybean",
  "Cowpea",
  "Tomato",
  "Pepper",
  "Onion",
  "Okra",
  "Vegetable",
  "Cocoa",
  "Oil Palm",
  "Rubber",
  "Cashew",
  "Plantain",
  "Banana",
]

export function FarmersListClient({
  farmers,
  totalCount,
  organizations,
  states,
  initialFilters,
  userRole,
}: FarmersListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState(initialFilters)
  const [showFilters, setShowFilters] = useState(false)

  const canCreateFarmers = ["super_admin", "admin", "manager", "field_agent"].includes(userRole)

  const applyFilters = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    router.push(`/dashboard/farmers?${params.toString()}`)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      organization: "",
      cropType: "",
      state: "",
      lga: "",
      verificationStatus: "",
      dateFrom: "",
      dateTo: "",
    })
    router.push("/dashboard/farmers")
    setShowFilters(false)
  }

  const activeFiltersCount = Object.values(filters).filter((v) => v !== "").length

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-poppins font-semibold text-[#000000]">Farmers</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              {totalCount} farmer{totalCount !== 1 ? "s" : ""} registered
            </p>
          </div>
          {canCreateFarmers && (
            <Button
              asChild
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter w-full sm:w-auto"
            >
              <Link href="/dashboard/farmers/new">
                <Plus className="h-4 w-4 mr-2" />
                Register Farmer
              </Link>
            </Button>
          )}
        </div>

        <Card className="mb-4 md:mb-6 rounded-[20px] md:rounded-[25px] border-none shadow-sm">
          <CardContent className="p-4 md:pt-6">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.45)]" />
                <Input
                  placeholder="Search farmers..."
                  className="pl-10 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter text-sm md:text-base"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters()
                  }}
                />
              </div>
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter bg-white hover:bg-[rgba(57,181,74,0.05)] relative w-full sm:w-auto justify-center"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Filters</span>
                    <span className="sm:hidden">Filter</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-2 bg-[#39B54A] text-white rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:w-[400px] md:w-[480px] p-0 flex flex-col">
                  <SheetHeader className="px-4 md:px-6 pt-6 pb-4 border-b">
                    <SheetTitle className="font-poppins text-lg md:text-xl">Filter Farmers</SheetTitle>
                    <SheetDescription className="font-inter text-sm">
                      Apply filters to narrow down your farmer list
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                    <div className="space-y-4">
                      {userRole === "super_admin" && organizations.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="organization" className="font-inter text-sm">
                            Organization
                          </Label>
                          <Select
                            value={filters.organization}
                            onValueChange={(value) => setFilters({ ...filters, organization: value })}
                          >
                            <SelectTrigger id="organization" className="rounded-[10px]">
                              <SelectValue placeholder="All organizations" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All organizations</SelectItem>
                              {organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                  {org.org_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="cropType" className="font-inter text-sm">
                          Crop Type
                        </Label>
                        <Select
                          value={filters.cropType}
                          onValueChange={(value) => setFilters({ ...filters, cropType: value })}
                        >
                          <SelectTrigger id="cropType" className="rounded-[10px]">
                            <SelectValue placeholder="All crops" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All crops</SelectItem>
                            {CROP_TYPES.map((crop) => (
                              <SelectItem key={crop} value={crop}>
                                {crop}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="font-inter text-sm">
                          State
                        </Label>
                        <Select
                          value={filters.state}
                          onValueChange={(value) => setFilters({ ...filters, state: value })}
                        >
                          <SelectTrigger id="state" className="rounded-[10px]">
                            <SelectValue placeholder="All states" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All states</SelectItem>
                            {states.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lga" className="font-inter text-sm">
                          Local Government Area
                        </Label>
                        <Input
                          id="lga"
                          placeholder="Enter LGA"
                          className="rounded-[10px]"
                          value={filters.lga}
                          onChange={(e) => setFilters({ ...filters, lga: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verificationStatus" className="font-inter text-sm">
                          Verification Status
                        </Label>
                        <Select
                          value={filters.verificationStatus}
                          onValueChange={(value) => setFilters({ ...filters, verificationStatus: value })}
                        >
                          <SelectTrigger id="verificationStatus" className="rounded-[10px]">
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="unverified">Unverified</SelectItem>
                            <SelectItem value="phone_verified">Phone Verified</SelectItem>
                            <SelectItem value="partially_verified">Partially Verified</SelectItem>
                            <SelectItem value="fully_verified">Fully Verified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-inter text-sm">Registration Date Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="dateFrom" className="text-xs font-inter text-[rgba(0,0,0,0.65)]">
                              From
                            </Label>
                            <Input
                              id="dateFrom"
                              type="date"
                              className="rounded-[10px] text-sm"
                              value={filters.dateFrom}
                              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dateTo" className="text-xs font-inter text-[rgba(0,0,0,0.65)]">
                              To
                            </Label>
                            <Input
                              id="dateTo"
                              type="date"
                              className="rounded-[10px] text-sm"
                              value={filters.dateTo}
                              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t px-4 md:px-6 py-4 bg-white">
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-[10px] bg-transparent" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                      <Button className="flex-1 bg-[#39B54A] hover:bg-[#2D5016] rounded-[10px]" onClick={applyFilters}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                {filters.organization && filters.organization !== "all" && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    Org: {organizations.find((o) => o.id === filters.organization)?.org_name}
                    <button
                      className="ml-1.5"
                      onClick={() => {
                        setFilters({ ...filters, organization: "" })
                        applyFilters()
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.cropType && filters.cropType !== "all" && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    Crop: {filters.cropType}
                    <button
                      className="ml-1.5"
                      onClick={() => {
                        setFilters({ ...filters, cropType: "" })
                        applyFilters()
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.state && filters.state !== "all" && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    State: {filters.state}
                    <button
                      className="ml-1.5"
                      onClick={() => {
                        setFilters({ ...filters, state: "" })
                        applyFilters()
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.verificationStatus && filters.verificationStatus !== "all" && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    Status: {filters.verificationStatus.replace("_", " ")}
                    <button
                      className="ml-1.5"
                      onClick={() => {
                        setFilters({ ...filters, verificationStatus: "" })
                        applyFilters()
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {!farmers || farmers.length === 0 ? (
          <Card className="rounded-[20px] md:rounded-[25px] border-none shadow-sm">
            <CardContent className="py-12 md:py-16 text-center px-4">
              <div className="mx-auto mb-4 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                <User className="h-7 w-7 md:h-8 md:w-8 text-[#39B54A]" />
              </div>
              <h3 className="font-poppins text-lg md:text-xl font-semibold mb-2">
                {activeFiltersCount > 0 ? "No farmers match your filters" : "No farmers registered yet"}
              </h3>
              <p className="text-[rgba(0,0,0,0.65)] font-inter mb-6 text-sm md:text-base">
                {activeFiltersCount > 0
                  ? "Try adjusting your filters to see more results"
                  : "Get started by registering your first farmer"}
              </p>
              {activeFiltersCount > 0 ? (
                <Button variant="outline" onClick={clearFilters} className="rounded-[10px] font-inter bg-transparent">
                  Clear Filters
                </Button>
              ) : (
                canCreateFarmers && (
                  <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                    <Link href="/dashboard/farmers/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Register First Farmer
                    </Link>
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {farmers.map((farmer) => (
              <Card
                key={farmer.id}
                className="rounded-[15px] md:rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] text-[#39B54A] font-semibold text-sm md:text-base">
                        {farmer.first_name[0]}
                        {farmer.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-poppins font-semibold text-base md:text-lg text-[#000000] truncate">
                          {farmer.title} {farmer.first_name} {farmer.last_name}
                        </h3>
                        <p className="text-xs md:text-sm text-[rgba(0,0,0,0.65)] font-inter">ID: {farmer.farmer_id}</p>
                        <div className="flex flex-wrap gap-2 md:gap-4 mt-2 text-xs md:text-sm font-inter text-[rgba(0,0,0,0.65)]">
                          <span className="truncate">{farmer.primary_phone}</span>
                          <span className="truncate">
                            {farmer.lga}, {farmer.state}
                          </span>
                          {farmer.primary_crops && farmer.primary_crops.length > 0 && (
                            <span className="truncate">{farmer.primary_crops.join(", ")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 justify-between sm:justify-start">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium font-inter whitespace-nowrap ${
                          farmer.verification_status === "fully_verified"
                            ? "bg-[rgba(57,181,74,0.1)] text-[#39B54A]"
                            : farmer.verification_status === "partially_verified"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {farmer.verification_status?.replace("_", " ")}
                      </span>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter text-xs md:text-sm h-8"
                      >
                        <Link href={`/dashboard/farmers/${farmer.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
