"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { useOrganizations } from "@/hooks/useOrganizations"
import { useClients } from "@/hooks/useClients"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  Building2,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  ExternalLink,
  MessageCircle,
  MapPin,
  ChevronRight,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  X,
  Globe,
  Loader2,
  Layers,
} from "lucide-react"
import { ClientStatus } from "@/types/client"

const INDUSTRIES = [
  "All Industries",
  "Film & Cinema",
  "Advertising & Commercials",
  "Television & OTT",
  "Fashion & Media",
  "Digital & Creator Content",
  "Music & Live Entertainment",
  "Corporate & Brand",
]

const STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  active: {
    label: "Active Client",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  lead: {
    label: "Lead",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  prospect: {
    label: "Prospect",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  inactive: {
    label: "Inactive",
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
    dotClass: "bg-zinc-400",
  },
}

export default function AgencyClientsPage() {
  const { activeOrg } = useOrganizations()
  const { clients, isLoading, createClient } = useClients(activeOrg?.id)
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedIndustry, setSelectedIndustry] = useState<string>("All Industries")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New Client Form State
  const [formData, setFormData] = useState({
    company_name: "",
    industry: "Entertainment & Film",
    status: "active" as ClientStatus,
    city: "Karachi",
    country: "Pakistan",
    website: "",
    billing_email: "",
    phone: "",
    internal_notes: "",
  })

  // KPI calculations
  const stats = useMemo(() => {
    const total = clients.length
    const activeCount = clients.filter((c) => c.status === "active").length
    const pipelineCount = clients.filter((c) => c.status === "lead" || c.status === "prospect").length
    const totalContacts = clients.reduce((acc, c) => acc + (c.contacts?.length || 0), 0)

    return { total, activeCount, pipelineCount, totalContacts }
  }, [clients])

  // Filtering
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contacts?.some(
          (ct) =>
            ct.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ct.email.toLowerCase().includes(searchQuery.toLowerCase())
        )

      const matchesStatus =
        selectedStatus === "all" || c.status === selectedStatus

      const matchesIndustry =
        selectedIndustry === "All Industries" ||
        c.industry.toLowerCase() === selectedIndustry.toLowerCase()

      return matchesSearch && matchesStatus && matchesIndustry
    })
  }, [clients, searchQuery, selectedStatus, selectedIndustry])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.company_name.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter the company name.",
        type: "error",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const data = new FormData()
      data.append("company_name", formData.company_name.trim())
      data.append("industry", formData.industry)
      data.append("status", formData.status)
      data.append("city", formData.city.trim())
      data.append("country", formData.country.trim())
      if (formData.website.trim()) data.append("website", formData.website.trim())
      if (formData.billing_email.trim()) data.append("billing_email", formData.billing_email.trim())
      if (formData.phone.trim()) data.append("phone", formData.phone.trim())
      if (formData.internal_notes.trim()) data.append("internal_notes", formData.internal_notes.trim())

      const res = await createClient(data)
      if (res.success) {
        toast({
          title: "Client account created",
          description: `${formData.company_name} has been added to your CRM dossier.`,
          type: "success",
        })
        setIsModalOpen(false)
        setFormData({
          company_name: "",
          industry: "Entertainment & Film",
          status: "active",
          city: "Karachi",
          country: "Pakistan",
          website: "",
          billing_email: "",
          phone: "",
          internal_notes: "",
        })
      } else {
        toast({
          title: "Failed to create client",
          description: (res as any).error || "Please check inputs and try again.",
          type: "error",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "An unexpected error occurred.",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardShell role="agency">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
                Client CRM & Accounts
              </h1>
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-brand-500/30 text-brand-500">
                {activeOrg?.name || "Agency"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Production companies, advertising agencies, and casting directors linked to your roster and booking deals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="gap-1.5 text-xs shadow-sm bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus className="h-4 w-4" />
              New Client Account
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Clients
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Active Retainers
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {stats.activeCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Leads & Prospects
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {stats.pipelineCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Contacts
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.totalContacts}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search clients by name, city, or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-background/70 border-border/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs */}
            <div className="flex items-center rounded-lg border border-border/60 bg-background/50 p-0.5 text-xs">
              {(["all", "active", "lead", "prospect", "inactive"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                    selectedStatus === st
                      ? "bg-brand-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Industry Selector */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-border/60 bg-background/70 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto" />
            <p className="text-xs text-muted-foreground">Loading agency client database...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="border-dashed border-border/80 p-12 text-center bg-card/30">
            <div className="max-w-md mx-auto space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {searchQuery || selectedStatus !== "all" || selectedIndustry !== "All Industries"
                  ? "No Clients Match Your Filters"
                  : "No Client Accounts Yet"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {searchQuery || selectedStatus !== "all" || selectedIndustry !== "All Industries"
                  ? "Try resetting your search query or status filter to see all agency accounts."
                  : "Add your first production company, advertising agency, or broadcast client to manage contacts, notes, and task assignments."}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                {searchQuery || selectedStatus !== "all" || selectedIndustry !== "All Industries" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedStatus("all")
                      setSelectedIndustry("All Industries")
                    }}
                    className="text-xs"
                  >
                    Clear All Filters
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add First Client
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => {
              const statusInfo = STATUS_CONFIG[client.status] || STATUS_CONFIG.active
              const primaryContact =
                client.contacts?.find((ct) => ct.is_primary) || client.contacts?.[0]
              const totalTasks = client.tasks?.length || 0
              const pendingTasks = client.tasks?.filter((t) => t.status !== "completed").length || 0

              const cleanWhatsApp = primaryContact?.whatsapp_number
                ? primaryContact.whatsapp_number.replace(/[^\d]/g, "")
                : null

              return (
                <Card
                  key={client.id}
                  className="group relative flex flex-col justify-between border-border/70 hover:border-brand-500/50 bg-card/60 backdrop-blur-xs transition-all duration-200 hover:shadow-md overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-linear-to-br from-brand-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {client.company_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/agency/clients/${client.id}`}
                            className="font-semibold text-sm text-foreground hover:text-brand-500 truncate block transition-colors"
                          >
                            {client.company_name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                            <span className="truncate">
                              {client.city}, {client.country}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium px-2 py-0.5 shrink-0 ${statusInfo.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${statusInfo.dotClass}`} />
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Industry and Website */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-y border-border/40 py-2">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        {client.industry}
                      </span>
                      {client.website ? (
                        <a
                          href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline text-[11px]"
                        >
                          <Globe className="h-3 w-3" />
                          Website
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60">No URL</span>
                      )}
                    </div>

                    {/* Primary Contact Dossier */}
                    <div className="rounded-lg bg-background/50 border border-border/50 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Primary Contact
                        </span>
                        {client.contacts && client.contacts.length > 1 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{client.contacts.length - 1} more
                          </span>
                        )}
                      </div>

                      {primaryContact ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-foreground">
                              {primaryContact.full_name}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              {primaryContact.role_title || "Liaison"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={`mailto:${primaryContact.email}`}
                              title={primaryContact.email}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand-500 transition-colors truncate max-w-[140px]"
                            >
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{primaryContact.email}</span>
                            </a>

                            {cleanWhatsApp && (
                              <a
                                href={`https://wa.me/${cleanWhatsApp}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Open WhatsApp Chat"
                                className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded transition-colors"
                              >
                                <MessageCircle className="h-3 w-3" />
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/70 italic">
                          No contact assigned yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="px-5 py-3 bg-muted/20 border-t border-border/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-500" />
                        {pendingTasks} {pendingTasks === 1 ? "task" : "tasks"}
                      </span>
                      <span>•</span>
                      <span>{client.notes?.length || 0} notes</span>
                    </div>

                    <Link
                      href={`/agency/clients/${client.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 group-hover:translate-x-0.5 transition-all"
                    >
                      Dossier
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    Add New Client Account
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Create a company dossier for casting, bookings, and contact management.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Dawn Films, Ogilvy Pakistan, Hum TV"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-border/80 bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Film & Cinema">Film & Cinema</option>
                    <option value="Advertising & Commercials">Advertising & Commercials</option>
                    <option value="Television & OTT">Television & OTT</option>
                    <option value="Fashion & Media">Fashion & Media</option>
                    <option value="Digital & Creator Content">Digital & Creator Content</option>
                    <option value="Music & Live Entertainment">Music & Live Entertainment</option>
                    <option value="Corporate & Brand">Corporate & Brand</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Client Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ClientStatus })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-border/80 bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="active">Active Retainer / Client</option>
                    <option value="lead">Lead (Initial outreach)</option>
                    <option value="prospect">Prospect (Pitching / In discussion)</option>
                    <option value="inactive">Inactive / Past Client</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">City</label>
                  <Input
                    placeholder="e.g. Karachi, Lahore, Islamabad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Country</label>
                  <Input
                    placeholder="Pakistan"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Website</label>
                  <Input
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Billing Email</label>
                  <Input
                    type="email"
                    placeholder="accounts@company.com"
                    value={formData.billing_email}
                    onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Company Phone</label>
                  <Input
                    placeholder="+92 21 3584 9200"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Internal Agency Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Client preferences, upcoming casting campaigns, credit terms..."
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border/80 bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500 resize-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-border/50 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating Client...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Save Client Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
