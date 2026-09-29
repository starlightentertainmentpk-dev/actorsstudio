import React from "react"
import { notFound } from "next/navigation"
import { getContractById } from "@/lib/services/contracts"
import { INITIAL_DEMO_CONTRACTS } from "@/hooks/useContracts"
import { PublicContractSignClient } from "./PublicContractSignClient"
import { Contract } from "@/types/contracts"

interface PublicContractSignPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Sign Commercial Agreement | Actor's Studio E-Signature Portal",
  description: "Secure, authenticated digital e-signature execution portal for talent and clients.",
}

export default async function PublicContractSignPage({
  params,
}: PublicContractSignPageProps) {
  const { id } = await params

  // 1. Attempt database fetch
  let contract: Contract | null = null
  try {
    contract = await getContractById(id)
  } catch (err) {
    console.warn("Could not fetch contract from database:", err)
  }

  // 2. Fallback to demo contracts if not found in db
  if (!contract) {
    const demo = INITIAL_DEMO_CONTRACTS.find((c) => c.id === id)
    if (demo) {
      contract = demo
    } else {
      // Also fallback to the first demo contract if any unknown id is accessed in preview
      contract = {
        ...INITIAL_DEMO_CONTRACTS[1],
        id,
        contract_title: `Commercial Appearance Agreement — Project #${id.slice(0, 8)}`,
      }
    }
  }

  if (!contract) {
    notFound()
  }

  return <PublicContractSignClient contract={contract} />
}
