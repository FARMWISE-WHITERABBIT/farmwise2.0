import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { OrganizationSettingsForm } from "@/components/organization-settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  let organizationSettings = null
  if (userData && ["admin", "super_admin"].includes(userData.role)) {
    const { data } = await supabase
      .from("organization_settings")
      .select("*")
      .eq("organization_id", userData.organization_id)
      .single()
    organizationSettings = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Settings</h1>
        <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">Manage your account settings and preferences</p>
      </div>

      <Separator />

      <div className="grid gap-6">
        {userData && ["admin", "super_admin"].includes(userData.role) && (
          <>
            <OrganizationSettingsForm settings={organizationSettings} organizationId={userData.organization_id} />
            <Separator />
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-poppins">Profile Information</CardTitle>
            <CardDescription className="font-inter">Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="font-inter">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  defaultValue={userData?.first_name || ""}
                  className="rounded-[10px] font-inter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="font-inter">
                  Last Name
                </Label>
                <Input id="last_name" defaultValue={userData?.last_name || ""} className="rounded-[10px] font-inter" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-inter">
                Email
              </Label>
              <Input id="email" type="email" defaultValue={user.email || ""} className="rounded-[10px] font-inter" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-inter">
                Phone Number
              </Label>
              <Input id="phone" defaultValue={userData?.phone || ""} className="rounded-[10px] font-inter" />
            </div>

            <Button className="bg-[#39B54A] hover:bg-[#2D5016] rounded-[10px] font-inter">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-poppins">Change Password</CardTitle>
            <CardDescription className="font-inter">Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="font-inter">
                Current Password
              </Label>
              <Input id="current_password" type="password" className="rounded-[10px] font-inter" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password" className="font-inter">
                New Password
              </Label>
              <Input id="new_password" type="password" className="rounded-[10px] font-inter" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="font-inter">
                Confirm New Password
              </Label>
              <Input id="confirm_password" type="password" className="rounded-[10px] font-inter" />
            </div>

            <Button className="bg-[#39B54A] hover:bg-[#2D5016] rounded-[10px] font-inter">Update Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-poppins">Notifications</CardTitle>
            <CardDescription className="font-inter">Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium font-inter">Email Notifications</p>
                <p className="text-sm text-muted-foreground font-inter">Receive email updates about your account</p>
              </div>
              <Button variant="outline" className="rounded-[10px] font-inter bg-transparent">
                Configure
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium font-inter">SMS Notifications</p>
                <p className="text-sm text-muted-foreground font-inter">Receive SMS alerts for important updates</p>
              </div>
              <Button variant="outline" className="rounded-[10px] font-inter bg-transparent">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
