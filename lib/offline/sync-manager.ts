import { offlineDB, type OfflineRecord } from "./db"
import { createClient } from "@/lib/supabase/client"

class SyncManager {
  private syncing = false
  private syncInterval: NodeJS.Timeout | null = null

  async startAutoSync(intervalMs = 30000): Promise<void> {
    if (this.syncInterval) return

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncAll()
      }
    }, intervalMs)

    // Initial sync if online
    if (navigator.onLine) {
      await this.syncAll()
    }
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async syncAll(): Promise<void> {
    if (this.syncing) return

    this.syncing = true
    console.log("[v0] Starting sync...")

    try {
      const records = await offlineDB.getUnsyncedRecords()
      console.log(`[v0] Found ${records.length} unsynced records`)

      for (const record of records) {
        try {
          await this.syncRecord(record)
          await offlineDB.markAsSynced(record.id)
          console.log(`[v0] Synced record ${record.id}`)
        } catch (error) {
          console.error(`[v0] Failed to sync record ${record.id}:`, error)
        }
      }

      console.log("[v0] Sync completed")
    } catch (error) {
      console.error("[v0] Sync error:", error)
    } finally {
      this.syncing = false
    }
  }

  private async syncRecord(record: OfflineRecord): Promise<void> {
    const supabase = createClient()

    switch (record.type) {
      case "farmer":
        await supabase.from("farmers").insert(record.data)
        break
      case "plot":
        await supabase.from("farm_plots").insert(record.data)
        break
      case "activity":
        await supabase.from("farm_activities").insert(record.data)
        break
      case "batch":
        await supabase.from("harvest_batches").insert(record.data)
        break
      default:
        throw new Error(`Unknown record type: ${record.type}`)
    }
  }

  isSyncing(): boolean {
    return this.syncing
  }
}

export const syncManager = new SyncManager()
