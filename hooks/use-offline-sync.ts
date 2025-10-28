"use client"

import { useState, useEffect, useCallback } from "react"
import { useOnlineStatus } from "@/hooks/use-online-status"

interface PendingItem {
  id: string
  type: "farmer" | "activity" | "photo" | "visit"
  title: string
  data: any
  status: "pending" | "syncing" | "failed"
  createdAt: string
  dataSize: number
  retryCount: number
}

interface SyncHistory {
  timestamp: string
  success: boolean
  itemCount: number
  error?: string
}

export function useOfflineSync(userId: string) {
  const isOnline = useOnlineStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 })
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([])

  // Load pending items from IndexedDB
  useEffect(() => {
    loadPendingItems()
    loadSyncHistory()
  }, [])

  const loadPendingItems = async () => {
    try {
      const db = await openDB()
      const tx = db.transaction("pending_sync", "readonly")
      const store = tx.objectStore("pending_sync")
      const items = await store.getAll()
      setPendingItems(items)
    } catch (error) {
      console.error("Error loading pending items:", error)
    }
  }

  const loadSyncHistory = () => {
    const history = localStorage.getItem("sync_history")
    if (history) {
      setSyncHistory(JSON.parse(history))
    }
    const lastSync = localStorage.getItem("last_sync_time")
    if (lastSync) {
      setLastSyncTime(lastSync)
    }
  }

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("farmwise_offline", 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains("pending_sync")) {
          db.createObjectStore("pending_sync", { keyPath: "id" })
        }
      }
    })
  }

  const startSync = useCallback(async () => {
    if (!isOnline || isSyncing || pendingItems.length === 0) return

    setIsSyncing(true)
    setSyncProgress({ current: 0, total: pendingItems.length })

    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i]
      setSyncProgress({ current: i + 1, total: pendingItems.length })

      try {
        // Update item status to syncing
        await updateItemStatus(item.id, "syncing")

        // Sync based on type
        let endpoint = ""
        switch (item.type) {
          case "farmer":
            endpoint = "/api/farmers"
            break
          case "activity":
            endpoint = "/api/activities"
            break
          case "visit":
            endpoint = "/api/field-visits"
            break
          default:
            continue
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.data),
        })

        if (response.ok) {
          await deleteItem(item.id)
          successCount++
        } else {
          await updateItemStatus(item.id, "failed")
          failedCount++
        }
      } catch (error) {
        console.error("Sync error:", error)
        await updateItemStatus(item.id, "failed")
        failedCount++
      }
    }

    // Update sync history
    const newHistory: SyncHistory = {
      timestamp: new Date().toISOString(),
      success: failedCount === 0,
      itemCount: successCount,
    }
    const updatedHistory = [newHistory, ...syncHistory].slice(0, 50)
    setSyncHistory(updatedHistory)
    localStorage.setItem("sync_history", JSON.stringify(updatedHistory))

    if (successCount > 0) {
      const now = new Date().toISOString()
      setLastSyncTime(now)
      localStorage.setItem("last_sync_time", now)
    }

    setIsSyncing(false)
    await loadPendingItems()
  }, [isOnline, isSyncing, pendingItems, syncHistory])

  const updateItemStatus = async (id: string, status: PendingItem["status"]) => {
    try {
      const db = await openDB()
      const tx = db.transaction("pending_sync", "readwrite")
      const store = tx.objectStore("pending_sync")
      const item = await store.get(id)
      if (item) {
        item.status = status
        await store.put(item)
      }
    } catch (error) {
      console.error("Error updating item status:", error)
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const db = await openDB()
      const tx = db.transaction("pending_sync", "readwrite")
      const store = tx.objectStore("pending_sync")
      await store.delete(id)
      await loadPendingItems()
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  const clearQueue = async () => {
    try {
      const db = await openDB()
      const tx = db.transaction("pending_sync", "readwrite")
      const store = tx.objectStore("pending_sync")
      await store.clear()
      setPendingItems([])
    } catch (error) {
      console.error("Error clearing queue:", error)
    }
  }

  const retryFailed = async (itemId?: string) => {
    if (itemId) {
      await updateItemStatus(itemId, "pending")
    } else {
      // Retry all failed items
      for (const item of pendingItems.filter((i) => i.status === "failed")) {
        await updateItemStatus(item.id, "pending")
      }
    }
    await loadPendingItems()
  }

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && pendingItems.length > 0 && !isSyncing) {
      const autoSyncEnabled = localStorage.getItem("auto_sync") !== "false"
      if (autoSyncEnabled) {
        startSync()
      }
    }
  }, [isOnline, pendingItems.length, isSyncing, startSync])

  return {
    isOnline,
    isSyncing,
    pendingItems,
    syncProgress,
    lastSyncTime,
    syncHistory,
    startSync,
    clearQueue,
    retryFailed,
    deleteItem,
  }
}
