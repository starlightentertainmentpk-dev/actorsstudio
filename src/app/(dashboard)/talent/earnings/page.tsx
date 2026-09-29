'use client'

import React, { useState } from 'react'
import { useFinance } from '@/hooks/useFinance'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  DollarSign,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  CreditCard,
  Download,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'
import { formatCurrency } from '@/lib/finance/commission'

export default function TalentEarningsPage() {
  const { getTalentEarnings } = useFinance()
  const { items, summary } = getTalentEarnings('t-zara-noor')

  const [statusFilter, setStatusFilter] = useState<'all' | 'accrued' | 'payable' | 'paid'>('all')

  const filteredItems = items.filter(
    (item) => statusFilter === 'all' || item.status === statusFilter
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Disbursed / Paid
          </span>
        )
      case 'payable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="h-3 w-3" /> Ready for Payout
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Shoot Wrap Accrual
          </span>
        )
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
            <Wallet className="h-4 w-4" /> Talent Financial Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-heading">
            My Earnings & Payout Statements
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Verified performance fees, agency commission itemization, and direct deposit settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 text-xs gap-1.5 border-border"
          >
            <Download className="h-3.5 w-3.5" /> Download Tax Statement
          </Button>
        </div>
      </div>

      {/* Top Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Bookings */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Lifetime Gross Bookings
          </span>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-foreground">
              {formatCurrency(summary.totalEarnedGross, 'PKR')}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">
              Agreed client compensation across all shoots
            </p>
          </div>
        </div>

        {/* Agency Commission Deducted */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Agency Representation (20%)
          </span>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-muted-foreground">
              -{formatCurrency(summary.totalAgencyCommission, 'PKR')}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">
              Management & legal representation fee
            </p>
          </div>
        </div>

        {/* Paid to Date */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wide">
            Net Payouts Received
          </span>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {formatCurrency(summary.paidToDate, 'PKR')}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Settled to verified bank account
            </p>
          </div>
        </div>

        {/* Pending Payout */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wide">
            Pending Disbursal
          </span>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-amber-400">
              {formatCurrency(summary.pendingBalance, 'PKR')}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">
              Scheduled upon production wrap sign-off
            </p>
          </div>
        </div>
      </div>

      {/* Verified Bank Account on File */}
      <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                Verified Remittance Account on File
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" /> Active Direct Deposit
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Habib Bank Limited • Title: Zara Noor • IBAN: PK52 HABB 0019 8201 9283 0192
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs border-border">
          Update Bank Details
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2">
        {(['all', 'payable', 'paid', 'accrued'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {s === 'all'
              ? 'All Statements'
              : s === 'payable'
              ? 'Ready for Payout'
              : s === 'paid'
              ? 'Disbursed'
              : 'Accrued'}
          </button>
        ))}
      </div>

      {/* Payout Statement Ledger */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-4 font-semibold">Production Shoot</th>
                <th className="py-3 px-4 font-semibold">Shoot Dates</th>
                <th className="py-3 px-4 font-semibold text-right">Agreed Gross Fee</th>
                <th className="py-3 px-4 font-semibold text-right">Agency Fee (20%)</th>
                <th className="py-3 px-4 font-semibold text-right">Net Talent Payout</th>
                <th className="py-3 px-4 font-semibold text-center">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No payout records found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4 font-medium text-foreground">
                      <div className="font-semibold text-sm">{item.project_name}</div>
                      <div className="text-[11px] text-muted-foreground">{item.client_name}</div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {item.shoot_dates}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-medium text-foreground">
                      {formatCurrency(item.gross_fee, item.currency)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-muted-foreground">
                      -{formatCurrency(item.agency_commission_deducted, item.currency)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(item.talent_net_payout, item.currency)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
