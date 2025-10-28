import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Phone, Mail, Settings, LogOut, Cloud } from "lucide-react"
import { signOut } from "@/app/actions/auth"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  const { data: farmers } = await supabase.from("farmers").select("id").eq("assigned_agent_id", user.id)

  const { data: activities } = await supabase.from("farm_activities").select("id").eq("recorded_by", user.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-2xl font-bold">
              {userData?.first_name?.[0]}
              {userData?.last_name?.[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {userData?.first_name} {userData?.last_name}
              </h2>
              <p className="text-gray-600">{userData?.role}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {userData?.email}
                </span>
                {userData?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {userData.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{farmers?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Farmers</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{activities?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Activities</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Days Active</p>
          </Card>
        </div>

        {/* Settings */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h3>

          <div className="space-y-4">
            {/* Sync Data section */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex-1">
                <Label>Sync Data</Label>
                <p className="text-sm text-gray-600">Sync offline data with server</p>
              </div>
              <Button size="sm" className="bg-[#39B54A] hover:bg-[#2D5016]">
                <Cloud className="w-4 h-4 mr-2" />
                Sync Now
              </Button>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <Label>Offline Mode</Label>
                <p className="text-sm text-gray-600">Work without internet connection</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <Label>Auto-sync</Label>
                <p className="text-sm text-gray-600">Automatically sync when online</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <Label>Notifications</Label>
                <p className="text-sm text-gray-600">Receive push notifications</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <Label>GPS Tracking</Label>
                <p className="text-sm text-gray-600">Track location for field visits</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Logout */}
        <form action={signOut}>
          <Button type="submit" variant="destructive" className="w-full" size="lg">
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </form>
      </div>
    </div>
  )
}
