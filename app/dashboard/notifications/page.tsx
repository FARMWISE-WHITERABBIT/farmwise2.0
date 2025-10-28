import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle } from "lucide-react"
import { NotificationItem } from "@/components/notification-item"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch all notifications
  const { data: allNotifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch unread notifications
  const { data: unreadNotifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })

  const unreadCount = unreadNotifications?.length || 0

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Notifications</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              Stay updated with important alerts and messages
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-[#39B54A] text-white rounded-full px-3 py-1 font-inter">{unreadCount} New</Badge>
          )}
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white rounded-[15px] p-1 shadow-sm">
            <TabsTrigger
              value="all"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              All ({allNotifications?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {!allNotifications || allNotifications.length === 0 ? (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                    <Bell className="h-8 w-8 text-[#39B54A]" />
                  </div>
                  <h3 className="font-poppins text-xl font-semibold mb-2">No notifications yet</h3>
                  <p className="text-[rgba(0,0,0,0.65)] font-inter">You'll see important updates and alerts here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {allNotifications.map((notification: any) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {!unreadNotifications || unreadNotifications.length === 0 ? (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
                    <CheckCircle className="h-8 w-8 text-[#39B54A]" />
                  </div>
                  <h3 className="font-poppins text-xl font-semibold mb-2">All caught up!</h3>
                  <p className="text-[rgba(0,0,0,0.65)] font-inter">You have no unread notifications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {unreadNotifications.map((notification: any) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
