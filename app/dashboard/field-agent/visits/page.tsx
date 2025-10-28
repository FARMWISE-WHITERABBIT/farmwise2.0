import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Camera } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Field Visits | Farmwise",
  description: "Document and track field visits",
}

export default async function FieldVisitsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-poppins font-semibold text-[#000000]">Field Visits</h1>
            <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
              Document your farm visits with photos and notes
            </p>
          </div>
          <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
            <Link href="/dashboard/field-agent/visits/new">
              <Plus className="h-4 w-4 mr-2" />
              New Visit
            </Link>
          </Button>
        </div>

        <Card className="rounded-[25px] border-none shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(57,181,74,0.1)]">
              <Camera className="h-8 w-8 text-[#39B54A]" />
            </div>
            <h3 className="font-poppins text-xl font-semibold mb-2">No field visits yet</h3>
            <p className="text-[rgba(0,0,0,0.65)] font-inter mb-6">
              Start documenting your farm visits with photos, GPS location, and notes
            </p>
            <Button asChild className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter">
              <Link href="/dashboard/field-agent/visits/new">
                <Plus className="h-4 w-4 mr-2" />
                Document First Visit
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
