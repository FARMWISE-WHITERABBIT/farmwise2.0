"use client"

import { useState, useCallback } from "react"
import { offlineDB } from "@/lib/offline/db"
import { syncManager } from "@/lib/offline/sync-manager"

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true)

  const saveOffline = useCallback(async (type: "farmer" | "plot" | "activity" | "batch", data: any) => {
    try {
      const id = await offlineDB.addRecord({ type, data })
      console.log("[v0] Saved offline:", id)

      // Trigger sync if online
      if (navigator.onLine) {
        await syncManager.syncAll()
      }

      return id
    } catch (error) {
      console.error("[v0] Failed to save offline:", error)
      throw error
    }
  }, [])

  const getUnsyncedCount = useCallback(async () => {
    const records = await offlineDB.getUnsyncedRecords()
    return records.length
  }, [])

  return {
    isOnline,
    saveOffline,
    getUnsyncedCount,
    syncAll: () => syncManager.syncAll(),
  }
}
