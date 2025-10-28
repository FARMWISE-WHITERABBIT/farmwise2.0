import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, MapPin, Users, Calendar, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function OrganizationDetailPage({ params }: { params: { id: string } }) {
  if (params.id === "new") {
    redirect("/dashboard/organizations")
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch organization details
  const { data: organization, error } = await supabase.from("organizations").select("*").eq("id", params.id).single()

  if (error || !organization) {
    notFound()
  }

  // Fetch users in this organization
  const { data: orgUsers } = await supabase
    .from("users")
    .select("*")
    .eq("organization_id", params.id)
    .order("created_at", { ascending: false })

  // Fetch farmers linked to this organization
  const { data: farmers } = await supabase
    .from("farmers")
    .select("*")
    .eq("organization_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="flex-1 bg-background">
      <div className="p-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground -ml-2">
            <Link href="/dashboard/organizations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)] text-[#39B54A] font-bold text-2xl flex-shrink-0">
              {organization.org_name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-poppins font-semibold text-foreground">{organization.org_name}</h1>
              <p className="text-sm text-muted-foreground font-inter mt-1 capitalize">
                {organization.org_type?.replace("_", " ")}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={organization.is_active ? "default" : "secondary"}
                  className={`rounded-full font-inter ${
                    organization.is_active
                      ? "bg-[rgba(57,181,74,0.1)] text-[#39B54A] hover:bg-[rgba(57,181,74,0.2)]"
                      : ""
                  }`}
                >
                  {organization.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline" className="rounded-full font-inter capitalize">
                  {organization.subscription_tier}
                </Badge>
              </div>
            </div>
          </div>
          <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
            <Link href={`/dashboard/organizations/${params.id}/edit`}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Organization
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white rounded-[15px] p-1 shadow-sm">
            <TabsTrigger
              value="overview"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Users ({orgUsers?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="farmers"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Farmers ({farmers?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-[10px] font-inter data-[state=active]:bg-[rgba(57,181,74,0.1)] data-[state=active]:text-[#39B54A]"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {organization.contact_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-[rgba(0,0,0,0.45)]" />
                      <div>
                        <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Email</p>
                        <p className="text-sm font-inter">{organization.contact_email}</p>
                      </div>
                    </div>
                  )}
                  {organization.contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-[rgba(0,0,0,0.45)]" />
                      <div>
                        <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Phone</p>
                        <p className="text-sm font-inter">{organization.contact_phone}</p>
                      </div>
                    </div>
                  )}
                  {organization.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-[rgba(0,0,0,0.45)] mt-0.5" />
                      <div>
                        <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Address</p>
                        <p className="text-sm font-inter">{organization.address}</p>
                        <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                          {organization.state}, {organization.country}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[rgba(57,181,74,0.05)] rounded-[15px]">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-[#39B54A]" />
                      <span className="text-sm font-inter text-[rgba(0,0,0,0.65)]">Total Users</span>
                    </div>
                    <span className="text-2xl font-poppins font-semibold text-[#39B54A]">{orgUsers?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[rgba(57,181,74,0.05)] rounded-[15px]">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-[#39B54A]" />
                      <span className="text-sm font-inter text-[rgba(0,0,0,0.65)]">Total Farmers</span>
                    </div>
                    <span className="text-2xl font-poppins font-semibold text-[#39B54A]">{farmers?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[rgba(57,181,74,0.05)] rounded-[15px]">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-[#39B54A]" />
                      <span className="text-sm font-inter text-[rgba(0,0,0,0.65)]">Member Since</span>
                    </div>
                    <span className="text-sm font-inter font-medium">
                      {new Date(organization.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Details */}
            <Card className="rounded-[25px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Subscription Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Tier</p>
                    <p className="text-sm font-inter font-medium capitalize">{organization.subscription_tier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Max Users</p>
                    <p className="text-sm font-inter font-medium">{organization.max_users}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Max Farmers</p>
                    <p className="text-sm font-inter font-medium">{organization.max_farmers || "Unlimited"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground font-inter">
                {orgUsers?.length || 0} user{orgUsers?.length !== 1 ? "s" : ""} in this organization
              </p>
              <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                <Link href={`/dashboard/users/new?organization_id=${params.id}`}>Add User</Link>
              </Button>
            </div>
            {orgUsers && orgUsers.length > 0 ? (
              <div className="grid gap-4">
                {orgUsers.map((user: any) => (
                  <Card key={user.id} className="rounded-[20px] border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center text-[#39B54A] font-semibold">
                          {user.first_name[0]}
                          {user.last_name[0]}
                        </div>
                        <div>
                          <p className="font-inter font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground font-inter">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full font-inter capitalize">
                        {user.role?.replace("_", " ")}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-[25px] border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground font-inter">No users in this organization yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="farmers" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                {farmers?.length || 0} farmer{farmers?.length !== 1 ? "s" : ""} linked to this organization
              </p>
              <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
                <Link href="/dashboard/farmers/new">Add Farmer</Link>
              </Button>
            </div>
            {farmers && farmers.length > 0 ? (
              <div className="grid gap-4">
                {farmers.map((farmer: any) => (
                  <Card
                    key={farmer.id}
                    className="rounded-[20px] border-none shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center text-[#39B54A] font-semibold">
                          {farmer.first_name[0]}
                          {farmer.last_name[0]}
                        </div>
                        <div>
                          <p className="font-inter font-medium">
                            {farmer.first_name} {farmer.last_name}
                          </p>
                          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                            {farmer.lga}, {farmer.state}
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-[#39B54A] hover:text-[#2D5016] hover:bg-[rgba(57,181,74,0.1)] rounded-[8px] font-inter"
                      >
                        <Link href={`/dashboard/farmers/${farmer.id}`}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-[25px] border-none shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-[rgba(0,0,0,0.45)] font-inter">No farmers linked to this organization yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card className="rounded-[25px] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Organization Settings</CardTitle>
                <CardDescription className="font-inter">Manage organization preferences and features</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
