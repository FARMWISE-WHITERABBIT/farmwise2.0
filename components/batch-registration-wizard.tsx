"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import BatchRegistrationForm from "@/components/forms/batch-registration-form"

interface BatchRegistrationWizardProps {
  onComplete: (batchId: string) => void
  onCancel: () => void
}

export function BatchRegistrationWizard({ onComplete, onCancel }: BatchRegistrationWizardProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)

        const { data: userData } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

        if (userData) {
          setOrganizationId(userData.organization_id)
        }
      }

      setIsLoading(false)
    }

    fetchUserData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39B54A] mx-auto mb-4" />
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Loading...</p>
        </div>
      </div>
    )
  }

  if (!userId || !organizationId) {
    return (
      <div className="text-center p-8">
        <p className="text-sm text-red-600 font-inter">Unable to load user information</p>
      </div>
    )
  }

  return <BatchRegistrationForm userId={userId} organizationId={organizationId} />
}
