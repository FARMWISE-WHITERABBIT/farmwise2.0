"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Plus, FileText, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  pendingSyncCount?: number
  farmerCount?: number
}

export function MobileBottomNav({ pendingSyncCount = 0, farmerCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/dashboard/field-agent",
      icon: Home,
      label: "Home",
      badge: null,
    },
    {
      href: "/dashboard/farmers",
      icon: Users,
      label: "Farmers",
      badge: farmerCount > 0 ? farmerCount : null,
    },
    {
      href: "/dashboard/farmers/new",
      icon: Plus,
      label: "Register",
      badge: null,
      isPrimary: true,
    },
    {
      href: "/dashboard/reports",
      icon: FileText,
      label: "Reports",
      badge: null,
    },
    {
      href: "/dashboard/field-agent/profile",
      icon: User,
      label: "Profile",
      badge: null,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[rgba(0,0,0,0.12)] lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center relative -mt-8"
              >
                <div className="flex items-center justify-center w-14 h-14 bg-[#39B54A] rounded-full shadow-lg hover:bg-[#2D5016] transition-colors">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-[rgba(0,0,0,0.87)] mt-1 font-inter">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative transition-colors font-inter",
                isActive ? "text-[#39B54A]" : "text-[rgba(0,0,0,0.65)] hover:text-[#39B54A]",
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge !== null && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full",
                      item.badgeColor || "bg-red-500",
                    )}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
