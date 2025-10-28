// IndexedDB wrapper for offline storage
const DB_NAME = "farmwise-offline"
const DB_VERSION = 1

export interface OfflineRecord {
  id: string
  type: "farmer" | "plot" | "activity" | "batch"
  data: any
  timestamp: number
  synced: boolean
}

class OfflineDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains("records")) {
          const store = db.createObjectStore("records", { keyPath: "id" })
          store.createIndex("type", "type", { unique: false })
          store.createIndex("synced", "synced", { unique: false })
          store.createIndex("timestamp", "timestamp", { unique: false })
        }
      }
    })
  }

  async addRecord(record: Omit<OfflineRecord, "id" | "timestamp" | "synced">): Promise<string> {
    if (!this.db) await this.init()

    const fullRecord: OfflineRecord = {
      ...record,
      id: `${record.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records"], "readwrite")
      const store = transaction.objectStore("records")
      const request = store.add(fullRecord)

      request.onsuccess = () => resolve(fullRecord.id)
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedRecords(): Promise<OfflineRecord[]> {
    try {
      if (!this.db) await this.init()

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(["records"], "readonly")
        const store = transaction.objectStore("records")
        // Get all records without filtering
        const request = store.getAll()

        request.onsuccess = () => {
          // Filter in JavaScript to find unsynced records
          const allRecords = request.result as OfflineRecord[]
          const unsyncedRecords = allRecords.filter((record) => record.synced === false)
          resolve(unsyncedRecords)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[v0] Error getting unsynced records:", error)
      return []
    }
  }

  async markAsSynced(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records"], "readwrite")
      const store = transaction.objectStore("records")
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.synced = true
          const updateRequest = store.put(record)
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteRecord(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records"], "readwrite")
      const store = transaction.objectStore("records")
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAllRecords(): Promise<OfflineRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records"], "readonly")
      const store = transaction.objectStore("records")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineDB = new OfflineDB()
