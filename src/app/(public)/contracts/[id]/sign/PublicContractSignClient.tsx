"use client"

import React, { useState, useEffect } from "react"
import { Contract, SignerType } from "@/types/contracts"
import { SignatureCanvas } from "@/components/features/contracts/SignatureCanvas"
import { ContractStatusBadge } from "@/components/features/contracts/ContractStatusBadge"
import {
  submitDigitalSignatureAction,
  markContractViewedAction,
} from "@/app/(dashboard)/agency/contracts/actions"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  DollarSign,
  Printer,
  Sparkles,
  FileCheck,
  AlertCircle,
} from "lucide-react"

interface PublicContractSignClientProps {
  contract: Contract
}

export function PublicContractSignClient({ contract: initialContract }: PublicContractSignClientProps) {
  const { toast } = useToast()
  const [contract, setContract] = useState<Contract>(initialContract)
  const [signerType, setSignerType] = useState<SignerType>("talent")
  const [signerName, setSignerName] = useState(
    initialContract.talent?.full_name || ""
  )
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [legalConsent, setLegalConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(initialContract.status === "signed")

  // Mark viewed if sent
  useEffect(() => {
    if (initialContract.status === "sent") {
      markContractViewedAction(initialContract.id).catch((err) =>
        console.warn("View tracking failed:", err)
      )
    }
  }, [initialContract.id, initialContract.status])

  // Adjust prefilled name when switching signer role
  const handleRoleChange = (role: SignerType) => {
    setSignerType(role)
    if (role === "talent") {
      setSignerName(contract.talent?.full_name || "")
    } else if (role === "client") {
      setSignerName(contract.client?.company_name || "")
    } else {
      setSignerName("Agency Representative")
    }
  }

  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signerName.trim() || signerName.trim().length < 2) {
      toast({
        title: "Signer Name Required",
        description: "Please enter your full legal name.",
        variant: "destructive",
      })
      return
    }

    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please draw your signature or adopt a styled script signature.",
        variant: "destructive",
      })
      return
    }

    if (!legalConsent) {
      toast({
        title: "Legal Acknowledgment Required",
        description: "You must confirm that your digital signature is legally binding.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await submitDigitalSignatureAction(contract.id, {
        signerType,
        signerName: signerName.trim(),
        signatureImageData: signatureData,
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      })

      setIsSuccess(true)
      setContract((prev) => ({
        ...prev,
        status: "signed",
        signed_at: new Date().toISOString(),
        signatures: [
          ...(prev.signatures || []),
          {
            id: "sig-now",
            contract_id: prev.id,
            signer_type: signerType,
            signer_name: signerName.trim(),
            signature_image_data: signatureData,
            signed_at: new Date().toISOString(),
          },
        ],
      }))

      toast({
        title: "Contract Digitally Executed",
        description: "Your electronic signature has been authenticated and recorded in the audit trail.",
      })
    } catch (err: any) {
      toast({
        title: "Signing Failed",
        description: err.message || "Failed to submit digital signature.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Trust Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              AS
            </div>
            <div>
              <span className="font-heading font-bold text-sm text-foreground block">
                Actor&apos;s Studio E-Signature Portal
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3 text-emerald-400" />
                256-Bit Encrypted & Legally Enforceable
              </span>
            </div>
          </div>

          <ContractStatusBadge status={contract.status} />
        </div>

        {/* Success Confirmation Card if already executed */}
        {isSuccess && (
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Contract Agreement Successfully Executed
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  This document has been finalized and certified with legal digital signatures. A copy has been delivered to agency records and all signers.
                </p>
              </div>
            </div>

            {/* Signature Showcase */}
            {contract.signatures && contract.signatures.length > 0 && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contract.signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-3 bg-background/90 rounded-xl border border-emerald-500/20 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{sig.signer_name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {sig.signer_type}
                      </Badge>
                    </div>
                    <div className="h-16 bg-muted/20 rounded p-1 flex items-center justify-center border border-border/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sig.signature_image_data}
                        alt="Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Timestamp: {new Date(sig.signed_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs h-9 bg-background"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print Certificate & Document
              </Button>
            </div>
          </div>
        )}

        {/* Contract Key Summary Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {contract.contract_title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review terms below and execute signature to finalize booking commitment.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/50">
            <div>
              <span className="text-[11px] text-muted-foreground block">Talent / Performer</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {contract.talent?.full_name || "Talent Party"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Client / Production</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {contract.client?.company_name || "Client Account"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Compensation Fee</span>
              <span className="font-semibold text-emerald-400 mt-0.5 block">
                {contract.booking?.currency || "PKR"}{" "}
                {Number(contract.booking?.fee_amount || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Engagement Dates</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {contract.booking?.shoot_date_start || "Scheduled"}
              </span>
            </div>
          </div>
        </div>

        {/* Rendered Legal Document Container */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-indigo-400" />
              Official Agreement Terms
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Scroll to review all articles
            </span>
          </div>

          <div className="p-5 bg-background border border-border/60 rounded-xl max-h-[380px] overflow-y-auto text-xs whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed shadow-inner">
            {contract.rendered_body}
          </div>
        </div>

        {/* Digital Signature Execution Section (Only if not already signed) */}
        {!isSuccess && (
          <form
            onSubmit={handleSignSubmit}
            className="rounded-2xl border border-indigo-500/40 bg-card p-6 shadow-lg space-y-5"
          >
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                Signer Verification & Electronic Signature
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confirm your identity, provide your legal digital signature, and finalize.
              </p>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                I am signing this contract as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleChange("talent")}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors flex items-center gap-2.5 ${
                    signerType === "talent"
                      ? "border-indigo-500 bg-indigo-500/10 text-foreground font-semibold"
                      : "border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <User className="h-4 w-4 text-indigo-400" />
                  <div>
                    <span className="block">Talent / Performer</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Individual performer or model
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("client")}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors flex items-center gap-2.5 ${
                    signerType === "client"
                      ? "border-indigo-500 bg-indigo-500/10 text-foreground font-semibold"
                      : "border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Building2 className="h-4 w-4 text-indigo-400" />
                  <div>
                    <span className="block">Client / Brand Officer</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Authorized hiring party
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Full Legal Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Full Legal Name of Signer <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter legal name (e.g. Zara Noor Abbas)"
                className="text-xs h-10 bg-background"
              />
            </div>

            {/* Signature Drawing Canvas */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Digital Signature <span className="text-rose-500">*</span>
              </label>
              <SignatureCanvas
                signerName={signerName}
                onSignatureChange={(dataUrl) => setSignatureData(dataUrl)}
                height={180}
              />
            </div>

            {/* Legal Consent Checkbox */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-normal">
                <input
                  type="checkbox"
                  checked={legalConsent}
                  onChange={(e) => setLegalConsent(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <span className="text-foreground text-[11px]">
                  <strong>Legal Acknowledgment:</strong> I agree that my electronic signature is the legal equivalent of my manual handwritten signature under the Electronic Transactions Ordinance (ETO 2002) and international digital signature standards.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !signatureData || !legalConsent || !signerName.trim()}
              className="w-full h-11 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
            >
              {isSubmitting ? (
                "Encrypting & Finalizing Agreement..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Sign & Finalize Agreement
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
