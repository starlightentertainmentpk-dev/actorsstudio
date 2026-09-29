"use client"

import React, { useState, useEffect } from "react"
import { analyzeContractAction } from "@/app/actions/ai"
import type { ContractAnalysisResult } from "@/types/ai"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import {
  FileCheck,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  ShieldAlert,
  Sparkles,
  Info,
  DollarSign,
  Globe2,
  Lock,
} from "lucide-react"

interface ContractAnalysisDrawerProps {
  isOpen: boolean
  onClose: () => void
  contractTitle?: string
  contractText?: string
  parties?: { client: string; talent: string }
}

export function ContractAnalysisDrawer({
  isOpen,
  onClose,
  contractTitle = "Talent Performance Agreement",
  contractText = "",
  parties,
}: ContractAnalysisDrawerProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<ContractAnalysisResult | null>(null)

  const defaultSampleContract = `BETWEEN:
Client: Shan Foods Production Ltd, Karachi
Talent: Amina Khan, Represented by Actor's Studio Pakistan
PROJECT: Ramadan 2026 Commercial TVC & Digital Campaign
COMPENSATION: PKR 500,000 net fee
TERRITORY: Pakistan and GCC Broadcast
RIGHTS: Digital and Television broadcast for 12 months from first release.
EXCLUSIVITY: Talent shall not appear in or endorse any competing culinary, spice, or recipe food product brand for a period of 12 months.
PAYMENT SCHEDULE: 50% upon contract signing, 50% upon wrap of principal photography.
OVERTIME: Overtime shall be compensated at standard day rates.`

  const effectiveText = contractText || defaultSampleContract

  useEffect(() => {
    if (isOpen && !analysis) {
      handleAnalyze()
    }
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleAnalyze = async () => {
    setIsLoading(true)
    try {
      const res = await analyzeContractAction(effectiveText)
      if (res.success && res.analysis) {
        setAnalysis(res.analysis)
      } else {
        toast({
          title: "Analysis Failed",
          description: res.error || "Could not analyze contract terms.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Service Error",
        description: err.message || "Failed to reach AI contract analyzer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clientName = parties?.client || analysis?.parties?.client || "Client Production House"
  const talentName = parties?.talent || analysis?.parties?.talent || "Represented Talent"

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-2xl bg-card border-l border-border/80 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border/60 bg-gradient-to-r from-card via-card/90 to-indigo-500/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-heading text-foreground">
                  AI Contract Clause Analyzer
                </h2>
                <Badge
                  variant="outline"
                  className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]"
                >
                  Clause Audit
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm">
                Document: <span className="text-foreground font-medium">{contractTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Legal Disclaimer Alert */}
        <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 shrink-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Legal Notice:</strong> AI Analysis is for informational agency review only and does not constitute formal legal counsel.
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="text-center py-16 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
              <p className="text-xs font-medium text-foreground">Scanning clauses, exclusivity, and dates...</p>
              <p className="text-[11px] text-muted-foreground">Synthesizing risk flags against standard entertainment terms.</p>
            </div>
          ) : analysis ? (
            <>
              {/* Parties & Financial Terms Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/20 p-4 rounded-xl border border-border/60 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Client Principal</span>
                  <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    {clientName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Talent Signatory</span>
                  <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {talentName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Compensation Fee</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">
                    {analysis.feeAmount || "PKR 350,000"}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-3 pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground block font-medium">Usage Rights Scope</span>
                  <p className="text-[11px] text-foreground font-medium mt-0.5">
                    {analysis.usageRightsSummary}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-3">
                  <span className="text-[10px] text-muted-foreground block font-medium">Geographic Territory</span>
                  <span className="text-[11px] text-foreground flex items-center gap-1 mt-0.5">
                    <Globe2 className="h-3 w-3 text-indigo-400" />
                    {analysis.territory}
                  </span>
                </div>
              </div>

              {/* Exclusivity Notice Section */}
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                    <Lock className="h-3.5 w-3.5 text-indigo-400" />
                    Exclusivity & Non-Compete Review
                  </h4>
                  <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                    High Importance
                  </Badge>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {analysis.exclusivityNotice || "No restrictive exclusivity clauses identified."}
                </p>
              </div>

              {/* Key Dates & Milestones */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                  Key Performance Dates & Milestones
                </h4>
                <div className="space-y-1.5">
                  {analysis.keyDates.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Flags & Items to Review */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                    Potential Risks & Points to Clarify
                  </h4>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      analysis.riskLevel === "high"
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    Risk: {analysis.riskLevel ? analysis.riskLevel.toUpperCase() : "MODERATE"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {analysis.potentialIssuesToReview.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200/90 flex items-start gap-2.5"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="leading-snug">{issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No analysis data generated yet. Click &ldquo;Re-Analyze Terms&rdquo; to process this document.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Re-Analyze Terms
          </Button>

          <Button
            size="sm"
            onClick={onClose}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            Done Reviewing
          </Button>
        </div>
      </div>
    </div>
  )
}
