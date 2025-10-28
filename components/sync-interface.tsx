"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Wifi,
  WifiOff,
  Battery,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { useOfflineSync } from "@/hooks/use-offline-sync"

interface SyncInterfaceProps {
  userId: string
}

export function SyncInterface({ userId }: SyncInterfaceProps) {
  const {
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
  } = useOfflineSync(userId)

  const [autoSync, setAutoSync] = useState(true)
  const [wifiOnly, setWifiOnly] = useState(false)
  const [batteryLevel, setBatteryLevel] = useState(100)

  useEffect(() => {
    // Get battery level
    if ("getBattery" in navigator) {
      ;(navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
        battery.addEventListener("levelchange", () => {
          setBatteryLevel(Math.round(battery.level * 100))
        })
      })
    }
  }, [])

  const pendingCount = pendingItems.length
  const failedItems = pendingItems.filter((item) => item.status === "failed")
  const totalDataSize = pendingItems.reduce((sum, item) => sum + (item.dataSize || 0), 0)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sync Status</h1>
          <p className="text-gray-600 mt-1">Manage offline data synchronization</p>
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`p-6 ${isOnline ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isOnline ? (
              <>
                <div className="p-3 bg-green-100 rounded-full">
                  <Cloud className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Online</h3>
                  <p className="text-sm text-green-700">Connected to server</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-orange-100 rounded-full">
                  <CloudOff className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Offline</h3>
                  <p className="text-sm text-orange-700">Working offline - data will sync when online</p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-orange-600" />}
            <div className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">{batteryLevel}%</span>
            </div>
          </div>
        </div>

        {lastSyncTime && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-sm text-green-700">Last synced: {new Date(lastSyncTime).toLocaleString()}</p>
          </div>
        )}
      </Card>

      {/* Sync Controls */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Sync Controls</h3>

        <div className="space-y-4">
          <Button
            onClick={startSync}
            disabled={!isOnline || isSyncing || pendingCount === 0}
            className="w-full"
            size="lg"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : `Sync Now (${pendingCount} items)`}
          </Button>

          {isSyncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Uploading {syncProgress.current} of {syncProgress.total}
                </span>
                <span>{Math.round((syncProgress.current / syncProgress.total) * 100)}%</span>
              </div>
              <Progress value={(syncProgress.current / syncProgress.total) * 100} />
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-t">
            <div className="flex items-center gap-2">
              <Switch id="auto-sync" checked={autoSync} onCheckedChange={setAutoSync} />
              <Label htmlFor="auto-sync">Auto-sync when online</Label>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t">
            <div className="flex items-center gap-2">
              <Switch id="wifi-only" checked={wifiOnly} onCheckedChange={setWifiOnly} />
              <Label htmlFor="wifi-only">Sync on WiFi only</Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Pending Queue */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Pending Uploads</h3>
            <p className="text-sm text-gray-600 mt-1">
              {pendingCount} items ({(totalDataSize / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
          {pendingCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearQueue}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {pendingCount === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">All data synced successfully!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {item.type === "farmer" && <span className="text-2xl">👤</span>}
                  {item.type === "activity" && <span className="text-2xl">📝</span>}
                  {item.type === "photo" && <span className="text-2xl">📷</span>}
                  {item.type === "visit" && <span className="text-2xl">📍</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <Badge
                      variant={
                        item.status === "pending" ? "secondary" : item.status === "syncing" ? "default" : "destructive"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(item.createdAt).toLocaleString()} • {(item.dataSize / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === "failed" && (
                    <Button variant="ghost" size="sm" onClick={() => retryFailed(item.id)}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Failed Items Alert */}
      {failedItems.length > 0 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900">Failed Uploads</h4>
              <p className="text-sm text-red-700 mt-1">
                {failedItems.length} items failed to sync. Check your connection and try again.
              </p>
              <Button variant="outline" size="sm" className="mt-3 bg-transparent" onClick={() => retryFailed()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry All Failed
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Sync History */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Sync History</h3>

        {syncHistory.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No sync history yet</p>
        ) : (
          <div className="space-y-3">
            {syncHistory.slice(0, 10).map((entry, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {entry.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{entry.success ? "Sync completed" : "Sync failed"}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(entry.timestamp).toLocaleString()} • {entry.itemCount} items
                  </p>
                </div>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Data Usage */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Data Usage</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-1">Today</p>
            <p className="text-2xl font-bold text-blue-900">2.4 MB</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700 mb-1">This Week</p>
            <p className="text-2xl font-bold text-purple-900">15.8 MB</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Storage Used</p>
            <p className="text-2xl font-bold text-green-900">48 MB</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-700 mb-1">Available</p>
            <p className="text-2xl font-bold text-orange-900">952 MB</p>
          </div>
        </div>

        <Button variant="outline" className="w-full mt-4 bg-transparent">
          Clear Cache
        </Button>
      </Card>
    </div>
  )
}
