import { ContractWizard } from "@/components/forms/contract-wizard"

export const metadata = {
  title: "New Contract - FarmWise",
  description: "Create a new contract agreement",
}

export const dynamic = "force-dynamic"

export default function NewContractPage() {
  return (
    <div className="flex-1 bg-[#F5F5F5]">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-poppins font-semibold text-[#000000]">New Contract</h1>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter mt-1">
            Create a comprehensive contract agreement with our 8-step wizard
          </p>
        </div>

        <div className="max-w-5xl">
          <ContractWizard />
        </div>
      </div>
    </div>
  )
}
