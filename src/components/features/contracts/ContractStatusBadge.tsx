"use client"

import React from "react"
import { ContractStatus } from "@/types/contracts"
import {
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"

interface ContractStatusBadgeProps {
  status: ContractStatus
  className?: string
}

export function ContractStatusBadge({ status, className = "" }: ContractStatusBadgeProps) {
  const configs: Record<
    ContractStatus,
    { label: string; icon: React.ComponentType<{ className?: string }>; classes: string }
  > = {
    draft: {
      label: "Draft",
      icon: FileText,
      classes: "bg-muted/40 text-muted-foreground border-border/60",
    },
    sent: {
      label: "Sent for Sign",
      icon: Send,
      classes: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    viewed: {
      label: "Viewed",
      icon: Eye,
      classes: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    signed: {
      label: "Executed / Signed",
      icon: CheckCircle2,
      classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      classes: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    },
    expired: {
      label: "Expired",
      icon: Clock,
      classes: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    },
  }

  const config = configs[status] || configs.draft
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${config.classes} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </span>
  )
}
