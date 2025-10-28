"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"

interface Organization {
  id: string
  org_name: string
}

interface OrganizationFilterProps {
  organizations: Organization[]
  currentPath: string
}

export default function OrganizationFilter({ organizations, currentPath }: OrganizationFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentOrg = searchParams.get("org") || "all"

  const handleOrgChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("org")
    } else {
      params.set("org", value)
    }
    const queryString = params.toString()
    router.push(`${currentPath}${queryString ? `?${queryString}` : ""}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-inter text-[rgba(0,0,0,0.65)]">Filter by Organization:</span>
      <Select value={currentOrg} onValueChange={handleOrgChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="All Organizations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Organizations</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.org_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
