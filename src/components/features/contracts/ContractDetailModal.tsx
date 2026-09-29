"use client"

import React, { useState } from "react"
import { Contract } from "@/types/contracts"
import { ContractStatusBadge } from "./ContractStatusBadge"
import { useContracts } from "@/hooks/useContracts"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  X,
  FileCheck,
  Send,
  Link2,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  Clock,
  ExternalLink,
  Printer,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { ContractAnalysisDrawer } from "./ContractAnalysisDrawer"

interface ContractDetailModalProps {
  contract: Contract | null
  isOpen: boolean
  onClose: () => void
}

export function ContractDetailModal({
  contract,
  isOpen,
  onClose,
}: ContractDetailModalProps) {
  const { toast } = useToast()
  const { sendForSignature, isSending } = useContracts()
  const [copiedLink, setCopiedLink] = useState(false)
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false)

  if (!isOpen || !contract) return null

  const handleCopySigningLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const link = `${origin}/contracts/${contract.id}/sign`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 3000)

    toast({
      title: "Signing Portal Link Copied",
      description: "Direct signing URL copied to clipboard. Share with talent or client.",
    })
  }

  const handleSendNow = async () => {
    try {
      await sendForSignature(contract.id)
      toast({
        title: "Dispatched for E-Signature",
        description: "Status updated to Sent. The signer can now execute this contract online.",
      })
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to dispatch contract.",
        variant: "destructive",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {contract.contract_title}
                </h2>
                <ContractStatusBadge status={contract.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Contract ID: <span className="font-mono">{contract.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/60">
            <div>
              <span className="text-[11px] text-muted-foreground block">Client Party</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {contract.client?.company_name || "Client Account"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Talent Party</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {contract.talent?.full_name || "Talent Name"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Booking Value</span>
              <span className="font-semibold text-emerald-400 mt-0.5 block">
                {contract.booking?.currency || "PKR"}{" "}
                {Number(contract.booking?.fee_amount || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Last Updated</span>
              <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {new Date(contract.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Audit Trail & Digital Signatures Banner */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              Digital Signatures & Legal Audit Trail
            </h3>

            {(!contract.signatures || contract.signatures.length === 0) ? (
              <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/10 text-center">
                <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground font-medium">
                  Awaiting electronic signature from parties
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  Share the public signing link below with talent or client to capture their legal sign-off.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contract.signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold text-foreground">
                          {sig.signer_name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {sig.signer_type}
                      </Badge>
                    </div>

                    {/* Signature Preview Canvas Image */}
                    <div className="h-20 bg-background/80 border border-border/80 rounded-lg p-2 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sig.signature_image_data}
                        alt={`Signature of ${sig.signer_name}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                      <span>IP: {sig.ip_address || "Logged via Portal"}</span>
                      <span className="text-right">
                        {new Date(sig.signed_at).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rendered Markdown Agreement */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Executed Agreement Text
            </h3>
            <div className="p-5 bg-background border border-border/80 rounded-xl max-h-[350px] overflow-y-auto text-xs whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed shadow-xs">
              {contract.rendered_body}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopySigningLink}
              className="text-xs h-9"
            >
              <Link2 className="h-3.5 w-3.5 mr-1.5" />
              {copiedLink ? "Link Copied!" : "Copy Signing Link"}
            </Button>

            <a
              href={`/contracts/${contract.id}/sign`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Signing Portal
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAIDrawerOpen(true)}
              className="text-xs h-9 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
              Analyze Clauses (AI)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-9"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print
            </Button>

            {contract.status === "draft" && (
              <Button
                type="button"
                disabled={isSending}
                onClick={handleSendNow}
                className="h-9 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {isSending ? "Dispatching..." : "Send for E-Signature"}
              </Button>
            )}

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onClose}
              className="text-xs h-9"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* AI Contract Analysis Drawer */}
      <ContractAnalysisDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        contractTitle={contract.contract_title}
        contractText={`CONTRACT TITLE: ${contract.contract_title}\nCLIENT: ${contract.client?.company_name || 'Client Account'}\nTALENT: ${contract.talent?.full_name || 'Represented Talent'}\nCOMPENSATION: PKR ${contract.booking?.fee_amount || '350,000'}\nTERMS: ${contract.rendered_body ? contract.rendered_body.replace(/<[^>]+>/g, ' ') : 'Standard talent exclusivity and performance clauses apply.'}`}
        parties={{
          client: contract.client?.company_name || "Client Account",
          talent: contract.talent?.full_name || "Represented Talent",
        }}
      />
    </div>
  )
}
