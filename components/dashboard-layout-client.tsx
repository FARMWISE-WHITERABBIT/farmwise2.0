"use client"

import type { ReactNode } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { OfflineIndicator } from "@/components/offline-indicator"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useState } from "react"
import { TopHeader } from "@/components/top-header"

export function DashboardLayoutClient({
  children,
  userData,
  unreadCount,
}: {
  children: ReactNode
  userData: {
    displayName: string
    initials: string
    roleDisplay: string
    avatarUrl?: string | null
    role: string
  }
  unreadCount: number
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isFieldAgent = userData.role === "field_agent"

  return (
    <div className="min-h-screen bg-[var(--color-background-muted)]">
      <SidebarNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} user={userData} unreadCount={unreadCount} />
      <main className="lg:ml-[200px] mt-[80px] p-4 md:p-6 lg:p-8">{children}</main>
      <OfflineIndicator />
      {isFieldAgent && <MobileBottomNav pendingSyncCount={0} farmerCount={0} />}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
