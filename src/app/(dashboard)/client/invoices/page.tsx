"use client"

import { useState } from "react"
import { useClientPortal } from "@/hooks/useClientPortal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { ClientInvoice } from "@/types/client-portal"
import {
  FileCheck,
  DollarSign,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  X,
  FileText,
} from "lucide-react"

export default function ClientInvoicesPage() {
  const { invoices, clientInfo } = useClientPortal()
  const { toast } = useToast()
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null)

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.amount, 0)
  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + inv.amount, 0)
  const totalPending = invoices
    .filter((inv) => inv.status === "pending")
    .reduce((acc, inv) => acc + inv.amount, 0)

  const handleDownloadPdf = (invoice: ClientInvoice) => {
    toast({
      title: "Invoice Download",
      description: `Downloading commercial invoice statement #${invoice.invoice_number}...`,
      type: "info",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 text-xs font-semibold"
          >
            Commercial Billing & Statements
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mt-1">
          Client Invoices & Statements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Access commercial talent booking invoices, casting retainers, and settlement receipts for {clientInfo.company_name}.
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Invoiced */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs p-5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Total Billed To Date
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground mt-2">
            PKR {totalInvoiced.toLocaleString()}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">
            Across {invoices.length} commercial engagements
          </span>
        </Card>

        {/* Paid Amount */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs p-5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 block">
            Settled & Paid
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-500 mt-2">
            PKR {totalPaid.toLocaleString()}
          </div>
          <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Receipts confirmed by agency
          </span>
        </Card>

        {/* Pending Balance */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs p-5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500 block">
            Current Outstanding Balance
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-500 mt-2">
            PKR {totalPending.toLocaleString()}
          </div>
          <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            Payable via bank transfer
          </span>
        </Card>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        <h2 className="text-base font-heading font-bold text-foreground">
          Billing Documents ({invoices.length})
        </h2>

        <div className="space-y-3">
          {invoices.map((invoice) => {
            const isPaid = invoice.status === "paid"

            return (
              <Card
                key={invoice.id}
                className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xs p-6 hover:border-brand-500/40 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-foreground">
                      #{invoice.invoice_number}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        isPaid
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {isPaid ? "Paid in Full" : "Pending Settlement"}
                    </Badge>
                  </div>

                  <h3 className="text-base font-heading font-bold text-foreground">
                    {invoice.project_title}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {invoice.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      Issued: {invoice.issue_date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      Due: {invoice.due_date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <div className="text-lg font-bold font-heading text-foreground">
                      {invoice.currency} {invoice.amount.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Inclusive of talent fees
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setSelectedInvoice(invoice)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-border/70 text-xs font-medium gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Line Items</span>
                    </Button>

                    <Button
                      onClick={() => handleDownloadPdf(invoice)}
                      size="sm"
                      className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-medium gap-1.5 shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Invoice Breakdown Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-xl bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className={
                    selectedInvoice.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs"
                  }
                >
                  #{selectedInvoice.invoice_number} • {selectedInvoice.status.toUpperCase()}
                </Badge>
                <h3 className="text-xl font-heading font-bold text-foreground">
                  {selectedInvoice.project_title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Line items list */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Itemized Breakdown
              </span>
              <div className="divide-y divide-border/50 border border-border/50 rounded-2xl overflow-hidden bg-muted/20">
                {selectedInvoice.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground block">{item.description}</span>
                      <span className="text-[10px] text-muted-foreground">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-foreground">
                      {selectedInvoice.currency} {item.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Row */}
            <div className="p-4 rounded-2xl bg-muted/40 flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">Total Invoiced Amount</span>
              <span className="font-mono text-lg font-bold text-foreground">
                {selectedInvoice.currency} {selectedInvoice.amount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
                <span>Verified Commercial Audit</span>
              </div>
              <Button
                onClick={() => handleDownloadPdf(selectedInvoice)}
                className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-medium gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF Statement</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
