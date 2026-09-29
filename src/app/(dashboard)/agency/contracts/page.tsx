"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useContracts } from "@/hooks/useContracts"
import { Contract, ContractStatus } from "@/types/contracts"
import { ContractStatusBadge } from "@/components/features/contracts/ContractStatusBadge"
import { GenerateContractModal } from "@/components/features/contracts/GenerateContractModal"
import { ContractDetailModal } from "@/components/features/contracts/ContractDetailModal"
import { ContractAnalysisDrawer } from "@/components/features/contracts/ContractAnalysisDrawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  ExternalLink,
} from "lucide-react"

export default function AgencyContractsPage() {
  const { contracts, kpis, isLoadingContracts } = useContracts()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false)

  // Filter contracts
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.contract_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.talent?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || c.status === (statusFilter as ContractStatus)

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Contract & E-Signature Operations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dynamic template compilation, commercial releases, multi-party e-signatures, and legal audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAIDrawerOpen(true)}
            className="text-xs h-9 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
            AI Clause Analyzer
          </Button>

          <Link href="/agency/contracts/templates">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <Layers className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
              Manage Templates
            </Button>
          </Link>

          <Link href="/agency/documents">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <FolderOpen className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              Document Vault
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsGenerateModalOpen(true)}
            className="text-xs h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Generate Contract
          </Button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Total Active Contracts
            </span>
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{kpis.active}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Drafts & in-flight signing
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Awaiting Talent Signature
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">{kpis.awaitingTalent}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Pending talent mobile review
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Awaiting Client Signature
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{kpis.awaitingClient}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Pending brand / producer sign-off
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Executed Agreements
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{kpis.executed}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            100% digitally executed
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contracts, talent, clients..."
            className="pl-9 text-xs h-9 bg-background"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "draft", "sent", "signed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s === "all" ? "All Contracts" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table View */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Contract Title</th>
                <th className="py-3 px-4 font-semibold">Talent</th>
                <th className="py-3 px-4 font-semibold">Client</th>
                <th className="py-3 px-4 font-semibold">Project & Booking</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Signatures</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingContracts ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Loading contract registry...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">No contracts found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Generate your first legal agreement from an active booking.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setIsGenerateModalOpen(true)}
                      className="mt-4 text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Generate Contract
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => {
                  const signaturesCount = contract.signatures?.length || 0
                  return (
                    <tr
                      key={contract.id}
                      onClick={() => setSelectedContract(contract)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-[260px] truncate">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span className="truncate">{contract.contract_title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{contract.talent?.full_name || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{contract.client?.company_name || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {contract.booking?.project_name ? (
                          <span>
                            {contract.booking.project_name} (
                            {contract.booking.currency}{" "}
                            {Number(contract.booking.fee_amount).toLocaleString()})
                          </span>
                        ) : (
                          <span>Direct Agreement</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <ContractStatusBadge status={contract.status} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                          <ShieldCheck
                            className={`h-3.5 w-3.5 ${
                              signaturesCount > 0 ? "text-emerald-400" : "text-muted-foreground"
                            }`}
                          />
                          {signaturesCount} recorded
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={`/contracts/${contract.id}/sign`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Open Public Signing Portal"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedContract(contract)}
                            className="text-xs h-7 px-2"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <GenerateContractModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
      />

      <ContractDetailModal
        contract={selectedContract}
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
      />

      {/* AI Contract Clause Risk Analyzer */}
      <ContractAnalysisDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        contractTitle="Sample Agency Standard Commercial Release"
      />
    </div>
  )
}
