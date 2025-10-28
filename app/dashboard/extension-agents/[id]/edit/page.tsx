import { redirect, notFound } from "next/navigation"
import { createClient, getAuthUser } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ExtensionAgentEditForm } from "@/components/extension-agent-edit-form"

export default async function EditExtensionAgentPage({ params }: { params: { id: string } }) {
  const { user } = await getAuthUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Fetch agent details
  const { data: agent, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", params.id)
    .eq("role", "field_agent")
    .single()

  if (error || !agent) {
    console.error("[v0] Agent fetch error:", error)
    notFound()
  }

  // Fetch organizations for dropdown
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, org_name")
    .eq("is_active", true)
    .order("org_name")

  return (
    <div className="flex-1 bg-background">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-[rgba(57,181,74,0.1)]">
            <Link href={`/dashboard/extension-agents/${params.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-poppins font-semibold text-foreground">Edit Extension Agent</h1>
            <p className="text-sm text-muted-foreground font-inter">Update agent information</p>
          </div>
        </div>

        <ExtensionAgentEditForm agent={agent} organizations={organizations || []} />
      </div>
    </div>
  )
}
