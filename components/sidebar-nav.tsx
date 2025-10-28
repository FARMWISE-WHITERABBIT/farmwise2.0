"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  TrendingUp,
  DollarSign,
  FileText,
  Settings,
  ChevronDown,
  MapPin,
  Clipboard,
  X,
  BarChart3,
  CheckSquare,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/auth/roles"
import Image from "next/image"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "manager", "analyst", "viewer"] as UserRole[],
  },
  {
    title: "Organizations",
    href: "/dashboard/organizations",
    icon: Building2,
    roles: ["super_admin", "admin", "manager"] as UserRole[],
  },
  {
    title: "Extension Agent Dashboard",
    icon: Clipboard,
    roles: ["field_agent"] as UserRole[],
    children: [
      {
        title: "My Dashboard",
        href: "/dashboard/field-agent",
        roles: ["field_agent"] as UserRole[],
      },
      {
        title: "Field Visits",
        href: "/dashboard/field-agent/visits",
        roles: ["field_agent"] as UserRole[],
      },
      {
        title: "Progress Tracking",
        href: "/dashboard/field-agent/progress",
        roles: ["field_agent"] as UserRole[],
      },
    ],
  },
  {
    title: "Farmers",
    href: "/dashboard/farmers",
    icon: Users,
    roles: ["super_admin", "admin", "manager", "field_agent"] as UserRole[],
  },
  {
    title: "Extension Agents",
    href: "/dashboard/agents",
    icon: UserCog,
    roles: ["super_admin", "admin", "manager"] as UserRole[],
  },
  {
    title: "Farm Plots",
    icon: MapPin,
    roles: ["super_admin", "admin", "manager", "field_agent"] as UserRole[],
    children: [
      {
        title: "All Plots",
        href: "/dashboard/plots",
        roles: ["super_admin", "admin", "manager", "field_agent"] as UserRole[],
      },
      {
        title: "Map View",
        href: "/dashboard/plots/map",
        roles: ["super_admin", "admin", "manager", "field_agent"] as UserRole[],
      },
    ],
  },
  {
    title: "Crop Yield",
    href: "/dashboard/yield",
    icon: TrendingUp,
    roles: ["super_admin", "admin", "manager", "analyst"] as UserRole[],
  },
  {
    title: "Finance",
    icon: DollarSign,
    roles: ["super_admin", "admin", "manager"] as UserRole[],
    children: [
      { title: "Loan Management", href: "/dashboard/loans", roles: ["super_admin", "admin", "manager"] as UserRole[] },
      {
        title: "Credit Profiles",
        href: "/dashboard/finance/credit-profiles",
        roles: ["super_admin", "admin", "manager"] as UserRole[],
      },
    ],
  },
  {
    title: "Traceability",
    href: "/dashboard/traceability",
    icon: FileText,
    roles: ["super_admin", "admin", "manager", "field_agent"] as UserRole[],
  },
  {
    title: "Contracts",
    href: "/dashboard/contracts",
    icon: FileText,
    roles: ["super_admin", "admin", "manager"] as UserRole[],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["super_admin", "admin", "manager", "field_agent", "analyst"] as UserRole[],
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    roles: ["super_admin", "admin", "manager", "field_agent"] as UserRole[],
  },
  {
    title: "Account Approvals",
    href: "/dashboard/approvals",
    icon: CheckSquare,
    roles: ["super_admin", "admin", "manager"] as UserRole[],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["super_admin", "admin"] as UserRole[],
  },
]

export function SidebarNav({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<string[]>([])
  const [userRole, setUserRole] = useState<UserRole | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

        if (userData) {
          setUserRole(userData.role as UserRole)
        }
      }
    }

    fetchUserRole()
  }, [])

  const toggleItem = (title: string) => {
    setOpenItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const canAccessItem = (roles: UserRole[]) => {
    if (!userRole) return false
    return roles.includes(userRole)
  }

  const visibleNavItems = navItems.filter((item) => canAccessItem(item.roles))

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-[240px] md:w-[200px] bg-white border-r border-[rgba(0,0,0,0.12)] z-50 flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={{ boxShadow: "0px 4px 30px 0px rgba(0, 0, 0, 0.1)" }}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/farmwise-logo-green.png"
              alt="Farmwise"
              width={140}
              height={47}
              className="w-auto h-10"
              priority
            />
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href ? pathname === item.href : false
            const hasChildren = item.children && item.children.length > 0

            if (hasChildren) {
              const visibleChildren = item.children?.filter((child) => canAccessItem(child.roles)) || []

              if (visibleChildren.length === 0) return null

              const isOpen = openItems.includes(item.title)
              return (
                <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleItem(item.title)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2.5 h-auto font-normal rounded-[10px]",
                        "text-[rgba(0,0,0,0.65)] hover:bg-[rgba(57,181,74,0.1)] hover:text-[#39B54A]",
                        "font-inter text-sm",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "transform rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-9 space-y-1 mt-1">
                    {visibleChildren.map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href!}
                          onClick={onClose}
                          className={cn(
                            "block px-3 py-2 rounded-[8px] text-sm font-inter",
                            isChildActive
                              ? "bg-[rgba(57,181,74,0.25)] text-[#39B54A] font-medium"
                              : "text-[rgba(0,0,0,0.65)] hover:bg-[rgba(57,181,74,0.1)] hover:text-[#39B54A]",
                          )}
                        >
                          {child.title}
                        </Link>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-inter transition-all",
                  isActive
                    ? "bg-[rgba(57,181,74,0.25)] text-[#39B54A] font-medium"
                    : "text-[rgba(0,0,0,0.65)] hover:bg-[rgba(57,181,74,0.1)] hover:text-[#39B54A]",
                )}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
