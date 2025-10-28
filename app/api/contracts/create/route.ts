import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Get user's organization
    const { data: userData } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single()

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    // Check permissions
    if (!["super_admin", "admin", "manager"].includes(userData.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Generate contract number
    const contractNumber = `CNT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Create contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        organization_id: userData.organization_id,
        created_by: user.id,
        contract_number: contractNumber,
        contract_type: body.contractType,
        title: `${body.cropType} ${body.contractType}`,
        description: body.qualitySpecs,
        status: "draft",

        // Buyer information (stored in notes for now, can be normalized later)
        notes: JSON.stringify({
          buyer: {
            orgName: body.buyerOrgName,
            contactPerson: body.buyerContactPerson,
            email: body.buyerEmail,
            phone: body.buyerPhone,
            address: body.buyerAddress,
          },
          seller: {
            type: body.sellerType,
            id: body.sellerId,
            name: body.sellerName,
          },
        }),

        // Product details
        crop_type: body.cropType,
        variety: body.variety,
        quantity_kg: body.totalQuantity,
        unit_of_measure: body.unit,
        quality_specifications: body.qualitySpecs,

        // Pricing
        price_per_unit: body.pricePerUnit,
        currency: body.currency,
        total_contract_value: body.totalValue,

        // Payment terms
        payment_terms: JSON.stringify({
          schedule: body.paymentSchedule,
          upfrontPercentage: body.upfrontPercentage,
          method: body.paymentMethod,
          details: body.paymentDetails,
        }),

        // Dates
        start_date: body.startDate,
        end_date: body.endDate,

        // Terms
        terms_and_conditions: body.termsAndConditions,
        dispute_resolution: body.disputeResolution,

        // Delivery terms
        supporting_documents: body.supportingDocs || [],
      })
      .select()
      .single()

    if (contractError) {
      console.error("Contract creation error:", contractError)
      return NextResponse.json({ error: "Failed to create contract", details: contractError.message }, { status: 500 })
    }

    // Create delivery milestones
    if (body.deliveries && body.deliveries.length > 0) {
      const deliveryMilestones = body.deliveries.map((delivery: any, index: number) => ({
        contract_id: contract.id,
        milestone_type: "delivery",
        milestone_name: `Delivery #${index + 1}`,
        scheduled_date: delivery.date,
        description: `Deliver ${delivery.quantity} ${body.unit} to ${delivery.location}`,
        responsible_party: body.transportResponsibility,
        status: "scheduled",
      }))

      await supabase.from("contract_milestones").insert(deliveryMilestones)
    }

    // Create payment milestones
    if (body.payments && body.payments.length > 0) {
      const paymentMilestones = body.payments.map((payment: any, index: number) => ({
        contract_id: contract.id,
        milestone_type: "payment",
        milestone_name: `Payment #${index + 1} - ${payment.type}`,
        scheduled_date: payment.dueDate,
        description: `${payment.type} payment of ${body.currency} ${payment.amount}`,
        responsible_party: "buyer",
        status: "scheduled",
      }))

      await supabase.from("contract_milestones").insert(paymentMilestones)
    }

    return NextResponse.json({ success: true, id: contract.id, contractNumber: contract.contract_number })
  } catch (error) {
    console.error("Contract creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
