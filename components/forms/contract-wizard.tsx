"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Plus, Trash2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const STEPS = [
  { id: 1, title: "Contract Type", description: "Choose type and template" },
  { id: 2, title: "Parties", description: "Buyer and seller information" },
  { id: 3, title: "Product Details", description: "Crop and quality specs" },
  { id: 4, title: "Pricing", description: "Price and payment structure" },
  { id: 5, title: "Payment Terms", description: "Payment schedule" },
  { id: 6, title: "Delivery Schedule", description: "Delivery dates and locations" },
  { id: 7, title: "Terms & Conditions", description: "Legal terms" },
  { id: 8, title: "Review & Sign", description: "Final review and signatures" },
]

interface ContractData {
  // Step 1
  contractType: string
  templateId?: string

  // Step 2
  buyerOrgName: string
  buyerContactPerson: string
  buyerEmail: string
  buyerPhone: string
  buyerAddress: string
  sellerType: string
  sellerId: string
  sellerName: string

  // Step 3
  cropType: string
  variety: string
  totalQuantity: number
  unit: string
  qualityGrade: string
  qualitySpecs: string
  packagingType: string

  // Step 4
  pricePerUnit: number
  currency: string
  totalValue: number
  pricingStructure: string
  incentives: string
  penalties: string

  // Step 5
  paymentSchedule: string
  upfrontPercentage: number
  paymentMethod: string
  paymentDetails: string
  payments: Array<{
    type: string
    dueDate: Date | undefined
    amount: number
    conditions: string
  }>

  // Step 6
  startDate: Date | undefined
  endDate: Date | undefined
  deliveryTerms: string
  transportResponsibility: string
  deliveries: Array<{
    date: Date | undefined
    quantity: number
    location: string
  }>

  // Step 7
  termsAndConditions: string
  disputeResolution: string

  // Step 8
  sellerSignature: string
  sellerSignatureDate: Date | undefined
  supportingDocs: string[]
}

interface ContractWizardProps {
  userId?: string
  organizationId?: string
}

export function ContractWizard({ userId, organizationId }: ContractWizardProps = {}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [contractData, setContractData] = useState<ContractData>({
    contractType: "",
    buyerOrgName: "",
    buyerContactPerson: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerAddress: "",
    sellerType: "",
    sellerId: "",
    sellerName: "",
    cropType: "",
    variety: "",
    totalQuantity: 0,
    unit: "kg",
    qualityGrade: "",
    qualitySpecs: "",
    packagingType: "",
    pricePerUnit: 0,
    currency: "NGN",
    totalValue: 0,
    pricingStructure: "fixed",
    incentives: "",
    penalties: "",
    paymentSchedule: "on_delivery",
    upfrontPercentage: 0,
    paymentMethod: "bank_transfer",
    paymentDetails: "",
    payments: [],
    startDate: undefined,
    endDate: undefined,
    deliveryTerms: "ex_works",
    transportResponsibility: "buyer",
    deliveries: [],
    termsAndConditions: "",
    disputeResolution: "",
    sellerSignature: "",
    sellerSignatureDate: undefined,
    supportingDocs: [],
  })

  const updateData = (field: string, value: any) => {
    setContractData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/contracts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contractData,
          userId,
          organizationId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create contract")
      }

      const data = await response.json()
      toast.success("Contract created successfully!")
      router.push(`/dashboard/contracts/${data.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create contract")
      console.error("[v0] Contract creation error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 text-xs transition-colors",
                    step.id === currentStep && "text-primary font-medium",
                    step.id < currentStep && "text-green-600",
                    step.id > currentStep && "text-muted-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      step.id === currentStep && "border-primary bg-primary text-primary-foreground",
                      step.id < currentStep && "border-green-600 bg-green-600 text-white",
                      step.id > currentStep && "border-muted-foreground",
                    )}
                  >
                    {step.id < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <span className="hidden md:block max-w-[80px] text-center">{step.title}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Contract Type */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contractType">Contract Type *</Label>
                <Select value={contractData.contractType} onValueChange={(value) => updateData("contractType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase_agreement">Purchase Agreement</SelectItem>
                    <SelectItem value="supply_agreement">Supply Agreement</SelectItem>
                    <SelectItem value="offtake_agreement">Offtake Agreement</SelectItem>
                    <SelectItem value="forward_contract">Forward Contract</SelectItem>
                    <SelectItem value="custom">Custom Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Use Template (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Select a pre-built template to speed up contract creation
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-base">Maize Purchase Template</CardTitle>
                      <CardDescription>Standard maize purchase agreement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-base">Rice Supply Template</CardTitle>
                      <CardDescription>Long-term rice supply contract</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Parties */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Buyer Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="buyerOrgName">Organization Name *</Label>
                    <Input
                      id="buyerOrgName"
                      value={contractData.buyerOrgName}
                      onChange={(e) => updateData("buyerOrgName", e.target.value)}
                      placeholder="Enter buyer organization name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerContactPerson">Contact Person *</Label>
                    <Input
                      id="buyerContactPerson"
                      value={contractData.buyerContactPerson}
                      onChange={(e) => updateData("buyerContactPerson", e.target.value)}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerEmail">Email *</Label>
                    <Input
                      id="buyerEmail"
                      type="email"
                      value={contractData.buyerEmail}
                      onChange={(e) => updateData("buyerEmail", e.target.value)}
                      placeholder="buyer@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerPhone">Phone *</Label>
                    <Input
                      id="buyerPhone"
                      value={contractData.buyerPhone}
                      onChange={(e) => updateData("buyerPhone", e.target.value)}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerAddress">Address *</Label>
                  <Textarea
                    id="buyerAddress"
                    value={contractData.buyerAddress}
                    onChange={(e) => updateData("buyerAddress", e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Seller Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="sellerType">Seller Type *</Label>
                  <Select value={contractData.sellerType} onValueChange={(value) => updateData("sellerType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seller type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Farmer</SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                      <SelectItem value="aggregator">Aggregator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerName">Seller Name *</Label>
                  <Input
                    id="sellerName"
                    value={contractData.sellerName}
                    onChange={(e) => updateData("sellerName", e.target.value)}
                    placeholder="Search and select seller"
                  />
                  <p className="text-sm text-muted-foreground">Start typing to search for farmers or cooperatives</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Product Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cropType">Crop Type *</Label>
                  <Select value={contractData.cropType} onValueChange={(value) => updateData("cropType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maize">Maize</SelectItem>
                      <SelectItem value="rice">Rice</SelectItem>
                      <SelectItem value="cassava">Cassava</SelectItem>
                      <SelectItem value="soybean">Soybean</SelectItem>
                      <SelectItem value="tomato">Tomato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variety">Variety</Label>
                  <Input
                    id="variety"
                    value={contractData.variety}
                    onChange={(e) => updateData("variety", e.target.value)}
                    placeholder="e.g., Yellow Maize"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalQuantity">Total Quantity *</Label>
                  <Input
                    id="totalQuantity"
                    type="number"
                    value={contractData.totalQuantity}
                    onChange={(e) => updateData("totalQuantity", Number.parseFloat(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select value={contractData.unit} onValueChange={(value) => updateData("unit", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="tons">Metric Tons</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualityGrade">Quality Grade *</Label>
                <Select value={contractData.qualityGrade} onValueChange={(value) => updateData("qualityGrade", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium Grade</SelectItem>
                    <SelectItem value="grade_a">Grade A</SelectItem>
                    <SelectItem value="grade_b">Grade B</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualitySpecs">Quality Specifications *</Label>
                <Textarea
                  id="qualitySpecs"
                  value={contractData.qualitySpecs}
                  onChange={(e) => updateData("qualitySpecs", e.target.value)}
                  placeholder="Describe quality requirements, moisture content, purity, etc."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="packagingType">Packaging Type</Label>
                <Input
                  id="packagingType"
                  value={contractData.packagingType}
                  onChange={(e) => updateData("packagingType", e.target.value)}
                  placeholder="e.g., 50kg bags, bulk"
                />
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">Price Per Unit *</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    value={contractData.pricePerUnit}
                    onChange={(e) => {
                      const price = Number.parseFloat(e.target.value)
                      updateData("pricePerUnit", price)
                      updateData("totalValue", price * contractData.totalQuantity)
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select value={contractData.currency} onValueChange={(value) => updateData("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Contract Value</span>
                    <span className="text-2xl font-bold text-primary">
                      {contractData.currency} {contractData.totalValue.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="pricingStructure">Pricing Structure *</Label>
                <Select
                  value={contractData.pricingStructure}
                  onValueChange={(value) => updateData("pricingStructure", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="market_linked">Market-Linked</SelectItem>
                    <SelectItem value="tiered">Tiered Pricing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incentives">Incentives & Bonuses</Label>
                <Textarea
                  id="incentives"
                  value={contractData.incentives}
                  onChange={(e) => updateData("incentives", e.target.value)}
                  placeholder="Describe quality bonuses, early delivery incentives, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="penalties">Penalties</Label>
                <Textarea
                  id="penalties"
                  value={contractData.penalties}
                  onChange={(e) => updateData("penalties", e.target.value)}
                  placeholder="Describe penalties for late delivery, quality shortfalls, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 5: Payment Terms */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentSchedule">Payment Schedule *</Label>
                <Select
                  value={contractData.paymentSchedule}
                  onValueChange={(value) => updateData("paymentSchedule", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upfront">Upfront Payment</SelectItem>
                    <SelectItem value="on_delivery">On Delivery</SelectItem>
                    <SelectItem value="installments">Installments</SelectItem>
                    <SelectItem value="net_30">Net 30 Days</SelectItem>
                    <SelectItem value="net_60">Net 60 Days</SelectItem>
                    <SelectItem value="custom">Custom Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contractData.paymentSchedule === "upfront" && (
                <div className="space-y-2">
                  <Label htmlFor="upfrontPercentage">Upfront Payment Percentage</Label>
                  <Input
                    id="upfrontPercentage"
                    type="number"
                    value={contractData.upfrontPercentage}
                    onChange={(e) => updateData("upfrontPercentage", Number.parseFloat(e.target.value))}
                    placeholder="0"
                    max="100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={contractData.paymentMethod}
                  onValueChange={(value) => updateData("paymentMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="letter_of_credit">Letter of Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDetails">Payment Details</Label>
                <Textarea
                  id="paymentDetails"
                  value={contractData.paymentDetails}
                  onChange={(e) => updateData("paymentDetails", e.target.value)}
                  placeholder="Bank account details, payment terms, etc."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 6: Delivery Schedule */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !contractData.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {contractData.startDate ? format(contractData.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={contractData.startDate}
                        onSelect={(date) => updateData("startDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !contractData.endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {contractData.endDate ? format(contractData.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={contractData.endDate}
                        onSelect={(date) => updateData("endDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTerms">Delivery Terms *</Label>
                <Select
                  value={contractData.deliveryTerms}
                  onValueChange={(value) => updateData("deliveryTerms", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ex_works">Ex-Works</SelectItem>
                    <SelectItem value="fob">FOB (Free on Board)</SelectItem>
                    <SelectItem value="cif">CIF (Cost, Insurance, Freight)</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transportResponsibility">Transport Responsibility *</Label>
                <Select
                  value={contractData.transportResponsibility}
                  onValueChange={(value) => updateData("transportResponsibility", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Delivery Schedule</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateData("deliveries", [
                        ...contractData.deliveries,
                        { date: undefined, quantity: 0, location: "" },
                      ])
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Delivery
                  </Button>
                </div>
                {contractData.deliveries.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">No deliveries scheduled yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click "Add Delivery" to create a delivery schedule
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {contractData.deliveries.map((delivery, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">Delivery #{index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newDeliveries = contractData.deliveries.filter((_, i) => i !== index)
                                  updateData("deliveries", newDeliveries)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="space-y-2">
                                <Label>Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !delivery.date && "text-muted-foreground",
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {delivery.date ? format(delivery.date, "PPP") : "Pick a date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={delivery.date}
                                      onSelect={(date) => {
                                        const newDeliveries = [...contractData.deliveries]
                                        newDeliveries[index].date = date
                                        updateData("deliveries", newDeliveries)
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <Label>Quantity ({contractData.unit})</Label>
                                <Input
                                  type="number"
                                  value={delivery.quantity}
                                  onChange={(e) => {
                                    const newDeliveries = [...contractData.deliveries]
                                    newDeliveries[index].quantity = Number.parseFloat(e.target.value)
                                    updateData("deliveries", newDeliveries)
                                  }}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Location</Label>
                                <Input
                                  value={delivery.location}
                                  onChange={(e) => {
                                    const newDeliveries = [...contractData.deliveries]
                                    newDeliveries[index].location = e.target.value
                                    updateData("deliveries", newDeliveries)
                                  }}
                                  placeholder="Delivery location"
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Terms & Conditions */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="termsAndConditions">Terms & Conditions *</Label>
                  <Button type="button" variant="outline" size="sm">
                    Use Standard Terms
                  </Button>
                </div>
                <Textarea
                  id="termsAndConditions"
                  value={contractData.termsAndConditions}
                  onChange={(e) => updateData("termsAndConditions", e.target.value)}
                  placeholder="Enter contract terms and conditions..."
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disputeResolution">Dispute Resolution *</Label>
                <Textarea
                  id="disputeResolution"
                  value={contractData.disputeResolution}
                  onChange={(e) => updateData("disputeResolution", e.target.value)}
                  placeholder="Describe dispute resolution process, arbitration, applicable law, etc."
                  rows={4}
                />
              </div>

              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900">Legal Review Recommended</p>
                      <p className="text-sm text-amber-700">
                        It's recommended to have these terms reviewed by a legal professional before finalizing the
                        contract.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 8: Review & Sign */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-900">Contract Ready for Review</p>
                      <p className="text-sm text-green-700">
                        Please review all details carefully before submitting the contract.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contract Summary</h3>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contract Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract Type:</span>
                      <span className="font-medium">{contractData.contractType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buyer:</span>
                      <span className="font-medium">{contractData.buyerOrgName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seller:</span>
                      <span className="font-medium">{contractData.sellerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product:</span>
                      <span className="font-medium">
                        {contractData.cropType} - {contractData.variety}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">
                        {contractData.totalQuantity} {contractData.unit}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Value:</span>
                      <span className="font-bold text-lg text-primary">
                        {contractData.currency} {contractData.totalValue.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="font-medium">
                        {contractData.startDate ? format(contractData.startDate, "PPP") : "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span className="font-medium">
                        {contractData.endDate ? format(contractData.endDate, "PPP") : "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deliveries:</span>
                      <span className="font-medium">{contractData.deliveries.length} scheduled</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Digital Signature</h3>
                <div className="space-y-2">
                  <Label>Seller Signature</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground">Signature capture will be implemented here</p>
                    <Button type="button" variant="outline" size="sm" className="mt-4 bg-transparent">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Signature
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              Previous
            </Button>
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating Contract..." : "Create Contract"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
