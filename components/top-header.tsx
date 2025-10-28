"use client"

import { Bell, MessageSquare, Search, Moon, Sun, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { signOut } from "@/app/actions/auth"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"

interface TopHeaderProps {
  onMenuClick?: () => void
  user: {
    displayName: string
    initials: string
    roleDisplay: string
    avatarUrl?: string | null
  }
  unreadCount?: number
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard"
  if (pathname.startsWith("/dashboard/organizations")) return "Organizations"
  if (pathname.startsWith("/dashboard/farmers")) return "Farmers"
  if (pathname.startsWith("/dashboard/agents")) return "Extension Agents"
  if (pathname.startsWith("/dashboard/plots")) return "Farm Plots"
  if (pathname.startsWith("/dashboard/yield")) return "Crop Yield"
  if (pathname.startsWith("/dashboard/loans")) return "Loan Management"
  if (pathname.startsWith("/dashboard/finance")) return "Finance"
  if (pathname.startsWith("/dashboard/traceability")) return "Traceability"
  if (pathname.startsWith("/dashboard/contracts")) return "Contracts"
  if (pathname.startsWith("/dashboard/reports")) return "Reports"
  if (pathname.startsWith("/dashboard/approvals")) return "Account Approvals"
  if (pathname.startsWith("/dashboard/notifications")) return "Notifications"
  if (pathname.startsWith("/dashboard/settings")) return "Settings"
  if (pathname.startsWith("/dashboard/field-agent")) return "Extension Agent Dashboard"
  return "Dashboard"
}

export function TopHeader({ onMenuClick, user, unreadCount }: TopHeaderProps) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const { theme, setTheme } = useTheme()

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[200px] h-[80px] bg-white dark:bg-gray-900 border-b border-[rgba(0,0,0,0.12)] dark:border-gray-800 z-40 px-4 md:px-8">
      <div className="flex items-center justify-between h-full gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 flex-shrink-0" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>

          <h1 className="text-sm font-poppins text-[rgba(0,0,0,0.87)] dark:text-gray-100 truncate font-light tracking-[-0.05em]">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Link href="/dashboard/notifications">
              <Bell className="h-5 w-5 text-[rgba(0,0,0,0.65)] dark:text-gray-400" />
              {unreadCount && unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#39B54A] text-white text-[10px] font-semibold border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Search className="h-5 w-5 text-[rgba(0,0,0,0.65)] dark:text-gray-400" />
          </Button>

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden md:flex h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Link href="/dashboard/chat">
              <MessageSquare className="h-5 w-5 text-[rgba(0,0,0,0.65)] dark:text-gray-400" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-[rgba(0,0,0,0.65)] dark:text-gray-400" />
            ) : (
              <Moon className="h-5 w-5 text-[rgba(0,0,0,0.65)] dark:text-gray-400" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 md:gap-3 h-auto py-2 px-2 md:px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-[#39B54A] text-white font-semibold text-xs md:text-sm">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold font-inter text-[rgba(0,0,0,0.87)] dark:text-gray-100">
                    {user.displayName}
                  </span>
                  <span className="text-xs font-inter text-[#39B54A] font-semibold">{user.roleDisplay}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut}>
                  <button type="submit" className="w-full text-left">
                    Sign Out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
