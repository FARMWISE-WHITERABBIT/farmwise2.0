"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Map,
  Activity,
  Edit,
  ArrowLeft,
  Camera,
  DollarSign,
  Beef,
} from "lucide-react"
import Link from "next/link"
import { PhotoGallery } from "@/components/photo-gallery"
import { FarmerFinanceSection } from "@/components/farmer-finance-section"

interface FarmerProfileClientProps {
  farmer: any
  farmerUser: any
  plots: any[]
  activities: any[]
  livestock: any[]
  allPhotos: string[]
  financialSummary: any
  farmerId: string
}

export function FarmerProfileClient({
  farmer,
  farmerUser,
  plots,
  activities,
  livestock,
  allPhotos,
  financialSummary,
  farmerId,
}: FarmerProfileClientProps) {
  const router = useRouter()

  const activityTypeColors: Record<string, string> = {
    planting: "bg-green-100 text-green-800",
    fertilizing: "bg-yellow-100 text-yellow-800",
    weeding: "bg-orange-100 text-orange-800",
    pest_control: "bg-red-100 text-red-800",
    harvesting: "bg-blue-100 text-blue-800",
    irrigation: "bg-cyan-100 text-cyan-800",
    soil_preparation: "bg-purple-100 text-purple-800",
    pruning: "bg-pink-100 text-pink-800",
  }

  return (
    <div className="space-y-6 pb-24 md:pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
          <Button asChild variant="outline" size="icon" className="shrink-0 bg-transparent">
            <Link href="/dashboard/farmers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {farmer.profile_photo_url && (
              <img
                src={farmer.profile_photo_url || "/placeholder.svg"}
                alt={`${farmer.first_name} ${farmer.last_name}`}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-[#39B54A] shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold font-poppins text-[rgba(0,0,0,0.87)] truncate">
                {farmer.title} {farmer.first_name} {farmer.last_name}
              </h1>
              <p className="text-xs sm:text-sm font-inter text-[rgba(0,0,0,0.65)] truncate">
                Farmer ID: {farmer.farmer_id}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Badge
            className={
              farmer.verification_status === "fully_verified"
                ? "bg-green-100 text-green-700"
                : farmer.verification_status === "partially_verified"
                  ? "bg-yellow-100 text-yellow-700"
                  : farmer.verification_status === "phone_verified"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
            }
          >
            {farmer.verification_status?.replace("_", " ")}
          </Badge>
          {farmerUser ? (
            <Badge className="bg-blue-100 text-blue-700">Has Account</Badge>
          ) : (
            <Badge variant="outline">No Account</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/farmers/${farmerId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {!farmer.user_id && (
        <Card className="border-[#39B54A] bg-[rgba(57,181,74,0.05)] rounded-[15px]">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium font-poppins text-[rgba(0,0,0,0.87)]">
                This farmer doesn't have a user account yet
              </p>
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                Create an account to allow them to access the platform and view their data
              </p>
            </div>
            <Button asChild className="bg-[#39B54A] hover:bg-[#2d8f3a]">
              <Link href={`/dashboard/farmers/${farmerId}/create-account`}>Create Account</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {farmerUser && (
        <Card className="border-[rgba(0,0,0,0.12)] rounded-[15px]">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[rgba(57,181,74,0.1)] flex items-center justify-center">
                <User className="h-5 w-5 text-[#39B54A]" />
              </div>
              <div>
                <p className="font-medium font-poppins text-[rgba(0,0,0,0.87)]">User Account Active</p>
                <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                  {farmerUser.email} • Last login:{" "}
                  {farmerUser.last_login ? new Date(farmerUser.last_login).toLocaleDateString() : "Never"}
                </p>
              </div>
            </div>
            <Badge className={farmerUser.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
              {farmerUser.is_active ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-[rgba(0,0,0,0.12)] rounded-[10px] p-1">
          <TabsTrigger value="overview" className="rounded-[8px]">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-[8px]">
            <DollarSign className="h-4 w-4 mr-2" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="plots" className="rounded-[8px]">
            <Map className="h-4 w-4 mr-2" />
            Farm Plots ({plots?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="livestock" className="rounded-[8px]">
            <Beef className="h-4 w-4 mr-2" />
            Livestock ({livestock?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activities" className="rounded-[8px]">
            <Activity className="h-4 w-4 mr-2" />
            Activities ({activities?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="photos" className="rounded-[8px]">
            <Camera className="h-4 w-4 mr-2" />
            Photos ({allPhotos.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-[8px]">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-[#39B54A] mt-0.5" />
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Full Name</p>
                    <p className="text-sm font-medium font-inter">
                      {farmer.title} {farmer.first_name} {farmer.middle_name} {farmer.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[#39B54A] mt-0.5" />
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Date of Birth</p>
                    <p className="text-sm font-medium font-inter">
                      {farmer.date_of_birth ? new Date(farmer.date_of_birth).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-[#39B54A] mt-0.5" />
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Gender</p>
                    <p className="text-sm font-medium font-inter">{farmer.gender || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-[#39B54A] mt-0.5" />
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Marital Status</p>
                    <p className="text-sm font-medium font-inter">{farmer.marital_status || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#39B54A] mt-0.5" />
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Primary Phone</p>
                    <p className="text-sm font-medium font-inter">{farmer.primary_phone}</p>
                  </div>
                </div>
                {farmer.alternate_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-[#39B54A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Alternate Phone</p>
                      <p className="text-sm font-medium font-inter">{farmer.alternate_phone}</p>
                    </div>
                  </div>
                )}
                {farmer.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-[#39B54A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Email</p>
                      <p className="text-sm font-medium font-inter">{farmer.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#39B54A] mt-0.5" />
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Address</p>
                    <p className="text-sm font-medium font-inter">
                      {farmer.residential_address}
                      <br />
                      {farmer.lga}, {farmer.state}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Farm Information */}
            <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Farm Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Primary Crops</p>
                  <div className="flex flex-wrap gap-2">
                    {farmer.primary_crops && farmer.primary_crops.length > 0 ? (
                      farmer.primary_crops.map((crop: string) => (
                        <Badge key={crop} variant="outline" className="bg-[rgba(57,181,74,0.1)] text-[#39B54A]">
                          {crop}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-[rgba(0,0,0,0.45)]">No crops specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Livestock</p>
                  <div className="flex flex-wrap gap-2">
                    {farmer.livestock && farmer.livestock.length > 0 ? (
                      farmer.livestock.map((animal: string) => (
                        <Badge key={animal} variant="outline" className="bg-[rgba(57,181,74,0.1)] text-[#39B54A]">
                          {animal}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-[rgba(0,0,0,0.45)]">No livestock</span>
                    )}
                  </div>
                </div>
                {farmer.total_farm_area_hectares && (
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Total Farm Area</p>
                    <p className="text-sm font-medium font-inter">{farmer.total_farm_area_hectares} hectares</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Identification */}
            <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Identification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {farmer.bvn && (
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">BVN</p>
                    <p className="text-sm font-medium font-inter">{farmer.bvn}</p>
                  </div>
                )}
                {farmer.nin && (
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">NIN</p>
                    <p className="text-sm font-medium font-inter">{farmer.nin}</p>
                  </div>
                )}
                {farmer.bank_name && (
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Bank Details</p>
                    <p className="text-sm font-medium font-inter">
                      {farmer.bank_name} - {farmer.account_number}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-6">
          <FarmerFinanceSection farmerId={farmerId} financialSummary={financialSummary} />
        </TabsContent>

        {/* Farm Plots Tab */}
        <TabsContent value="plots" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{plots?.length || 0} farm plot(s) registered</p>
            <Button
              size="sm"
              className="bg-[#39B54A] hover:bg-[#2d8f3a]"
              onClick={() => router.push(`/dashboard/plots/new?farmer_id=${farmerId}`)}
            >
              <Map className="h-4 w-4 mr-2" />
              Add Plot
            </Button>
          </div>

          {plots && plots.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {plots.map((plot) => (
                <Card key={plot.id} className="border-[rgba(0,0,0,0.12)] rounded-[15px]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-poppins text-lg">{plot.plot_name}</CardTitle>
                        <CardDescription className="font-inter">{plot.plot_code}</CardDescription>
                      </div>
                      <Badge
                        className={
                          plot.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }
                      >
                        {plot.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[rgba(0,0,0,0.45)] font-inter">Area:</span>
                      <span className="font-semibold text-[#39B54A] font-inter">
                        {plot.size_hectares?.toFixed(2)} ha
                      </span>
                    </div>
                    {plot.current_crop && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[rgba(0,0,0,0.45)] font-inter">Current Crop:</span>
                        <span className="font-medium font-inter">{plot.current_crop}</span>
                      </div>
                    )}
                    {plot.crop_health_status && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[rgba(0,0,0,0.45)] font-inter">Health:</span>
                        <Badge
                          variant="outline"
                          className={
                            plot.crop_health_status === "healthy"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : plot.crop_health_status === "attention"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {plot.crop_health_status}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Map className="h-12 w-12 text-[rgba(0,0,0,0.25)] mb-4" />
                <p className="text-lg font-medium text-[rgba(0,0,0,0.45)] mb-2 font-poppins">No farm plots yet</p>
                <p className="text-sm text-[rgba(0,0,0,0.45)] mb-4 font-inter">
                  Start by mapping this farmer's farm plots
                </p>
                <Button
                  className="bg-[#39B54A] hover:bg-[#2d8f3a]"
                  onClick={() => router.push(`/dashboard/plots/new?farmer_id=${farmerId}`)}
                >
                  <Map className="h-4 w-4 mr-2" />
                  Map First Plot
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Livestock Tab */}
        <TabsContent value="livestock" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{livestock?.length || 0} livestock record(s)</p>
            <Button
              size="sm"
              className="bg-[#39B54A] hover:bg-[#2d8f3a]"
              onClick={() => router.push(`/dashboard/livestock/new?farmer_id=${farmerId}`)}
            >
              <Beef className="h-4 w-4 mr-2" />
              Add Livestock
            </Button>
          </div>

          {livestock && livestock.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {livestock.map((animal) => (
                <Card key={animal.id} className="border-[rgba(0,0,0,0.12)] rounded-[15px]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-poppins text-lg capitalize">{animal.livestock_type}</CardTitle>
                        <CardDescription className="font-inter">
                          {animal.tag_number || animal.identification}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          animal.health_status === "healthy"
                            ? "bg-green-100 text-green-700"
                            : animal.health_status === "sick"
                              ? "bg-red-100 text-red-700"
                              : animal.health_status === "under_treatment"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }
                      >
                        {animal.health_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Breed</p>
                        <p className="font-medium font-inter">{animal.breed || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Quantity</p>
                        <p className="font-semibold text-[#39B54A] font-inter">{animal.quantity}</p>
                      </div>
                      {animal.age_months && (
                        <div>
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Age</p>
                          <p className="font-medium font-inter">{animal.age_months} months</p>
                        </div>
                      )}
                      {animal.weight_kg && (
                        <div>
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Weight</p>
                          <p className="font-medium font-inter">{animal.weight_kg} kg</p>
                        </div>
                      )}
                    </div>
                    {animal.acquisition_cost && (
                      <div className="pt-3 border-t border-[rgba(0,0,0,0.12)]">
                        <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Acquisition Cost</p>
                        <p className="font-semibold text-[#39B54A] font-inter">
                          ₦{animal.acquisition_cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Beef className="h-12 w-12 text-[rgba(0,0,0,0.25)] mb-4" />
                <p className="text-lg font-medium text-[rgba(0,0,0,0.45)] mb-2 font-poppins">No livestock recorded</p>
                <p className="text-sm text-[rgba(0,0,0,0.45)] mb-4 font-inter">
                  Start tracking livestock for this farmer
                </p>
                <Button
                  className="bg-[#39B54A] hover:bg-[#2d8f3a]"
                  onClick={() => router.push(`/dashboard/livestock/new?farmer_id=${farmerId}`)}
                >
                  <Beef className="h-4 w-4 mr-2" />
                  Add First Livestock
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
              {activities?.length || 0} recent activit{activities?.length === 1 ? "y" : "ies"}
            </p>
            <Button
              size="sm"
              className="bg-[#39B54A] hover:bg-[#2d8f3a]"
              onClick={() => router.push(`/dashboard/field-visits/new?farmer_id=${farmerId}`)}
            >
              <Activity className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </div>

          {activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="border-[rgba(0,0,0,0.12)] rounded-[15px]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-poppins capitalize">
                            {activity.activity_type.replace(/_/g, " ")}
                          </CardTitle>
                          <Badge className={activityTypeColors[activity.activity_type] || "bg-gray-100 text-gray-800"}>
                            {activity.activity_type}
                          </Badge>
                        </div>
                        <CardDescription className="font-inter">{activity.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-[rgba(0,0,0,0.45)] font-inter">
                          <Calendar className="h-4 w-4" />
                          {new Date(activity.activity_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Plot</p>
                        <p className="font-medium font-inter">{activity.farm_plots?.plot_name || "N/A"}</p>
                      </div>
                      {activity.cost && (
                        <div>
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Cost</p>
                          <p className="font-medium font-inter">₦{activity.cost.toLocaleString()}</p>
                        </div>
                      )}
                      {activity.labor_hours && (
                        <div>
                          <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">Labor Hours</p>
                          <p className="font-medium font-inter">{activity.labor_hours}h</p>
                        </div>
                      )}
                    </div>
                    {activity.notes && (
                      <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.12)]">
                        <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter mb-1">Notes</p>
                        <p className="text-sm font-inter">{activity.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-[rgba(0,0,0,0.25)] mb-4" />
                <p className="text-lg font-medium text-[rgba(0,0,0,0.45)] mb-2 font-poppins">No activities logged</p>
                <p className="text-sm text-[rgba(0,0,0,0.45)] mb-4 font-inter">
                  Start tracking farm activities for this farmer
                </p>
                <Button
                  className="bg-[#39B54A] hover:bg-[#2d8f3a]"
                  onClick={() => router.push(`/dashboard/field-visits/new?farmer_id=${farmerId}`)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Log First Activity
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
              {allPhotos.length} photo{allPhotos.length !== 1 ? "s" : ""}
            </p>
          </div>

          {allPhotos.length > 0 ? (
            <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
              <CardContent className="p-6">
                <PhotoGallery photos={allPhotos} title={`${farmer.first_name} ${farmer.last_name}`} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="h-12 w-12 text-[rgba(0,0,0,0.25)] mb-4" />
                <p className="text-lg font-medium text-[rgba(0,0,0,0.45)] mb-2 font-poppins">No photos yet</p>
                <p className="text-sm text-[rgba(0,0,0,0.45)] mb-4 font-inter">
                  Photos from field visits and plot registrations will appear here
                </p>
                <Button className="bg-[#39B54A] hover:bg-[#2d8f3a]">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-[rgba(0,0,0,0.25)] mb-4" />
              <p className="text-lg font-medium text-[rgba(0,0,0,0.45)] mb-2 font-poppins">No documents uploaded</p>
              <p className="text-sm text-[rgba(0,0,0,0.45)] mb-4 font-inter">
                Upload farmer documents, certificates, and agreements
              </p>
              <Button className="bg-[#39B54A] hover:bg-[#2d8f3a]">
                <FileText className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
