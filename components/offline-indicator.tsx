"use client"

import { useEffect, useState } from "react"
import { WifiOff, Wifi, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { syncManager } from "@/lib/offline/sync-manager"
import { offlineDB } from "@/lib/offline/db"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const updateUnsyncedCount = async () => {
      try {
        const records = await offlineDB.getUnsyncedRecords()
        setUnsyncedCount(records.length)
      } catch (error) {
        console.error("[v0] Error getting unsynced records:", error)
        setUnsyncedCount(0)
      }
    }

    // Initial check
    updateOnlineStatus()
    updateUnsyncedCount()

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Update unsynced count periodically
    const interval = setInterval(updateUnsyncedCount, 5000)

    // Start auto-sync
    syncManager.startAutoSync()

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
      clearInterval(interval)
      syncManager.stopAutoSync()
    }
  }, [])

  const handleManualSync = async () => {
    setSyncing(true)
    try {
      await syncManager.syncAll()
      const records = await offlineDB.getUnsyncedRecords()
      setUnsyncedCount(records.length)
    } catch (error) {
      console.error("[v0] Error during manual sync:", error)
    }
    setSyncing(false)
  }

  if (isOnline && unsyncedCount === 0) return null

  return (
    <Card className="fixed bottom-4 right-4 z-50 shadow-lg">
      <div className="flex items-center gap-3 p-3">
        {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-orange-600" />}

        <div className="flex-1">
          <p className="text-sm font-medium">{isOnline ? "Online" : "Offline Mode"}</p>
          {unsyncedCount > 0 && <p className="text-xs text-muted-foreground">{unsyncedCount} items pending sync</p>}
        </div>

        {isOnline && unsyncedCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleManualSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>
    </Card>
  )
}
