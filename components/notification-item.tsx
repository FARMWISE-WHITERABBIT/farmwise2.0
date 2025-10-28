"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AlertCircle, Info, CheckCircle, X, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationItemProps {
  notification: any
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()
  const [isUpdating, setIsUpdating] = useState(false)

  const getIcon = () => {
    switch (notification.priority) {
      case "high":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "low":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-[#39B54A]" />
    }
  }

  const getPriorityColor = () => {
    switch (notification.priority) {
      case "high":
        return "bg-red-50 border-red-200"
      case "low":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-white"
    }
  }

  const markAsRead = async () => {
    if (notification.is_read) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notification.id)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const dismissNotification = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase.from("notifications").update({ is_dismissed: true }).eq("id", notification.id)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (notification.is_dismissed) return null

  return (
    <Card
      className={`rounded-[20px] border shadow-sm hover:shadow-md transition-shadow ${getPriorityColor()} ${
        !notification.is_read ? "border-l-4 border-l-[#39B54A]" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">{getIcon()}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-inter font-semibold text-[#000000]">{notification.title}</h3>
              {!notification.is_read && (
                <Badge className="bg-[#39B54A] text-white rounded-full px-2 py-0.5 text-xs font-inter">New</Badge>
              )}
            </div>

            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mb-3">{notification.message}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[rgba(0,0,0,0.45)] font-inter">
                {new Date(notification.created_at).toLocaleString()}
              </span>

              <div className="flex items-center gap-2">
                {notification.action_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter h-8"
                    onClick={() => router.push(notification.action_url)}
                  >
                    {notification.action_label || "View"}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}

                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[rgba(0,0,0,0.65)] hover:text-[#39B54A] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter h-8"
                    onClick={markAsRead}
                    disabled={isUpdating}
                  >
                    Mark as read
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[rgba(0,0,0,0.45)] hover:text-red-500 hover:bg-red-50 rounded-[8px] h-8 w-8 p-0"
                  onClick={dismissNotification}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
