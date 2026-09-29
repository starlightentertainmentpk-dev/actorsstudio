"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { INITIAL_DEMO_BRIEFS } from "@/hooks/useClientPortal"
import { useOrganizations } from "@/hooks/useOrganizations"
import { useClientDetail } from "@/hooks/useClients"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  Building2,
  Plus,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Pin,
  Trash2,
  Briefcase,
  Tv,
  Users,
  FileText,
  AlertCircle,
  ExternalLink,
  Loader2,
  Star,
  Check,
  X,
  Filter,
  UserCheck,
  Sparkles,
  DollarSign,
} from "lucide-react"
import { ClientStatus, TaskPriority, TaskStatus } from "@/types/client"

interface ClientDossierViewProps {
  clientId: string
}

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

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; badgeClass: string }> = {
  urgent: {
    label: "Urgent",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  high: {
    label: "High",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  low: {
    label: "Low",
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  },
}

export function ClientDossierView({ clientId }: ClientDossierViewProps) {
  const { activeOrg } = useOrganizations()
  const {
    client,
    isLoading,
    addContact,
    deleteContact,
    addNote,
    isAddingNote,
    togglePinNote,
    addTask,
    updateTaskStatus,
  } = useClientDetail(clientId, activeOrg?.id)

  const { data: clientBriefs = [] } = useQuery({
    queryKey: ["agency-client-briefs", clientId],
    queryFn: async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("client_briefs")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })

        if (error || !data || data.length === 0) {
          return INITIAL_DEMO_BRIEFS.filter(
            (b) => b.client_id === clientId || clientId === "c1-dawn-films"
          )
        }
        return data
      } catch {
        return INITIAL_DEMO_BRIEFS.filter(
          (b) => b.client_id === clientId || clientId === "c1-dawn-films"
        )
      }
    },
  })

  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<"contacts" | "notes" | "tasks" | "projects">(
    "contacts"
  )

  // Modals state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [newNoteText, setNewNoteText] = useState("")
  const [taskFilter, setTaskFilter] = useState<"all" | "todo" | "in_progress" | "completed">("all")

  // Contact form state
  const [contactForm, setContactForm] = useState({
    full_name: "",
    role_title: "",
    email: "",
    phone: "",
    whatsapp_number: "",
    is_primary: false,
    notes: "",
  })

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    status: "todo" as TaskStatus,
    due_date: "",
  })

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!client?.tasks) return []
    if (taskFilter === "all") return client.tasks
    return client.tasks.filter((t) => t.status === taskFilter)
  }, [client?.tasks, taskFilter])

  // Sorted notes (pinned first, then chronological)
  const sortedNotes = useMemo(() => {
    if (!client?.notes) return []
    return [...client.notes].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [client?.notes])

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.full_name.trim() || !contactForm.email.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please provide a contact name and valid email address.",
        type: "error",
      })
      return
    }

    try {
      const data = new FormData()
      data.append("client_id", clientId)
      data.append("full_name", contactForm.full_name.trim())
      if (contactForm.role_title.trim()) data.append("role_title", contactForm.role_title.trim())
      data.append("email", contactForm.email.trim())
      if (contactForm.phone.trim()) data.append("phone", contactForm.phone.trim())
      if (contactForm.whatsapp_number.trim())
        data.append("whatsapp_number", contactForm.whatsapp_number.trim())
      data.append("is_primary", contactForm.is_primary ? "true" : "false")
      if (contactForm.notes.trim()) data.append("notes", contactForm.notes.trim())

      const res = await addContact(data)
      if (res.success) {
        toast({
          title: "Contact added",
          description: `${contactForm.full_name} has been added to this client.`,
          type: "success",
        })
        setIsContactModalOpen(false)
        setContactForm({
          full_name: "",
          role_title: "",
          email: "",
          phone: "",
          whatsapp_number: "",
          is_primary: false,
          notes: "",
        })
      } else {
        toast({
          title: "Failed to add contact",
          description: (res as any).error || "Please check inputs.",
          type: "error",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to add contact.",
        type: "error",
      })
    }
  }

  const handleDeleteContact = async (contactId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this client?`)) return
    try {
      await deleteContact(contactId)
      toast({
        title: "Contact removed",
        description: `${name} has been removed.`,
        type: "info",
      })
    } catch {
      toast({ title: "Failed to delete contact", type: "error" })
    }
  }

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    try {
      const res = await addNote(newNoteText.trim())
      if (res.success) {
        toast({
          title: "Note logged",
          description: "Internal interaction recorded on client timeline.",
          type: "success",
        })
        setNewNoteText("")
      }
    } catch (err: any) {
      toast({
        title: "Failed to post note",
        description: err?.message,
        type: "error",
      })
    }
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskForm.title.trim()) {
      toast({ title: "Task title required", type: "error" })
      return
    }

    try {
      const data = new FormData()
      data.append("client_id", clientId)
      data.append("title", taskForm.title.trim())
      if (taskForm.description.trim()) data.append("description", taskForm.description.trim())
      data.append("priority", taskForm.priority)
      data.append("status", taskForm.status)
      if (taskForm.due_date.trim()) data.append("due_date", taskForm.due_date.trim())

      const res = await addTask(data)
      if (res.success) {
        toast({
          title: "Task created",
          description: "Agency task added to client workflow.",
          type: "success",
        })
        setIsTaskModalOpen(false)
        setTaskForm({
          title: "",
          description: "",
          priority: "medium",
          status: "todo",
          due_date: "",
        })
      }
    } catch (err: any) {
      toast({ title: "Failed to create task", description: err?.message, type: "error" })
    }
  }

  const handleToggleTask = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === "completed" ? "todo" : "completed"
    try {
      await updateTaskStatus({ taskId, status: nextStatus })
      toast({
        title: nextStatus === "completed" ? "Task marked completed" : "Task marked to-do",
        type: "success",
      })
    } catch {
      toast({ title: "Failed to update task", type: "error" })
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto" />
        <p className="text-xs text-muted-foreground">Loading client dossier...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <Card className="p-12 text-center border-dashed max-w-md mx-auto my-12 space-y-3">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-semibold text-foreground">Client Dossier Not Found</h3>
        <p className="text-xs text-muted-foreground">
          This client record may have been removed or belongs to another organization.
        </p>
        <div className="pt-2">
          <Link href="/agency/clients">
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Client Directory
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  const statusInfo = STATUS_CONFIG[client.status] || STATUS_CONFIG.active

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/agency/clients"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Client Accounts
        </Link>
      </div>

      {/* Main Dossier Header Banner */}
      <Card className="border-border/70 bg-card/60 backdrop-blur-xs p-6 overflow-hidden relative shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-brand-600 via-indigo-600 to-purple-700 text-white font-bold flex items-center justify-center text-xl shadow-md shrink-0">
              {client.company_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
                  {client.company_name}
                </h1>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-medium px-2.5 py-0.5 ${statusInfo.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${statusInfo.dotClass}`} />
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                <span className="inline-flex items-center gap-1 text-foreground/90 font-medium">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  {client.industry}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {client.city}, {client.country}
                </span>
                {client.website && (
                  <a
                    href={
                      client.website.startsWith("http")
                        ? client.website
                        : `https://${client.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {client.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsContactModalOpen(true)}
              className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Contact
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTaskModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Company Meta Strip */}
        <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Billing Email
            </span>
            <p className="font-medium text-foreground truncate mt-0.5">
              {client.billing_email ? (
                <a
                  href={`mailto:${client.billing_email}`}
                  className="hover:text-brand-500 text-brand-600 dark:text-brand-400"
                >
                  {client.billing_email}
                </a>
              ) : (
                <span className="text-muted-foreground/60 italic">Not set</span>
              )}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Phone
            </span>
            <p className="font-medium text-foreground truncate mt-0.5">
              {client.phone ? (
                <a href={`tel:${client.phone}`} className="hover:text-brand-500">
                  {client.phone}
                </a>
              ) : (
                <span className="text-muted-foreground/60 italic">Not set</span>
              )}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Office Location
            </span>
            <p className="font-medium text-foreground truncate mt-0.5">
              {client.address || `${client.city}, ${client.country}`}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Self-Registered Producer
            </span>
            <p className="font-medium text-foreground truncate mt-0.5">
              {client.producer_profile ? (
                <Badge variant="outline" className="text-[10px] text-brand-500 border-brand-500/30">
                  Linked Account
                </Badge>
              ) : (
                <span className="text-muted-foreground/60 italic">Manual Account</span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border/60 gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab("contacts")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "contacts"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Contacts ({client.contacts?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "notes"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Timeline & Notes ({client.notes?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "tasks"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Agency Tasks ({client.tasks?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("projects")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "projects"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tv className="h-4 w-4" />
          Projects & Briefs ({clientBriefs.length})
        </button>
      </div>

      {/* Tab 1: Contacts Directory */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Key personnel, executive producers, casting directors, and accounts managers for this client.
            </p>
            <Button
              size="sm"
              onClick={() => setIsContactModalOpen(true)}
              className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Contact Person
            </Button>
          </div>

          {!client.contacts || client.contacts.length === 0 ? (
            <Card className="border-dashed p-10 text-center bg-card/40">
              <Users className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-foreground">No Contacts Listed</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Add executive producers or casting managers to quickly email or trigger WhatsApp conversations.
              </p>
              <Button
                size="sm"
                onClick={() => setIsContactModalOpen(true)}
                className="mt-4 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Contact
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {client.contacts.map((contact) => {
                const cleanWhatsApp = contact.whatsapp_number
                  ? contact.whatsapp_number.replace(/[^\d]/g, "")
                  : null

                return (
                  <Card
                    key={contact.id}
                    className="p-5 border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between space-y-4 relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-sm text-foreground">
                              {contact.full_name}
                            </h4>
                            {contact.is_primary && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium px-1.5 py-0"
                              >
                                <Star className="h-2.5 w-2.5 fill-amber-500 mr-1" />
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {contact.role_title || "Team Liaison"}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteContact(contact.id, contact.full_name)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity p-1"
                          title="Delete contact"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1.5 pt-3 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="hover:text-brand-500 truncate"
                          >
                            {contact.email}
                          </a>
                        </div>

                        {contact.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                            <a href={`tel:${contact.phone}`} className="hover:text-brand-500">
                              {contact.phone}
                            </a>
                          </div>
                        )}

                        {contact.notes && (
                          <p className="text-[11px] text-muted-foreground/80 bg-muted/30 rounded p-2 mt-2 italic">
                            &quot;{contact.notes}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Trigger Links */}
                    <div className="pt-3 border-t border-border/50 flex items-center gap-2">
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg border border-border/80 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        Email
                      </a>

                      {cleanWhatsApp ? (
                        <a
                          href={`https://wa.me/${cleanWhatsApp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      ) : (
                        <span className="flex-1 inline-flex items-center justify-center h-8 px-2.5 rounded-lg border border-border/30 text-[11px] text-muted-foreground/50">
                          No WhatsApp
                        </span>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Activity Timeline & Notes */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          {/* Note Composer */}
          <Card className="p-4 border-border/70 bg-card/60 backdrop-blur-xs">
            <form onSubmit={handleNoteSubmit} className="space-y-3">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Post Internal Note / Communication Log</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Visible to agency members only
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Log notes from client call, casting director briefing, contract negotiation, or payment follow-up..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border/80 bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500 resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAddingNote || !newNoteText.trim()}
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white gap-1.5"
                >
                  {isAddingNote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  Save Note to Timeline
                </Button>
              </div>
            </form>
          </Card>

          {/* Timeline List */}
          <div className="space-y-3">
            {sortedNotes.length === 0 ? (
              <Card className="border-dashed p-10 text-center bg-card/40">
                <Clock className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-foreground">Timeline Is Empty</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  Log the first phone call, creative brief, or meeting notes above to preserve institutional memory.
                </p>
              </Card>
            ) : (
              sortedNotes.map((note) => (
                <Card
                  key={note.id}
                  className={`p-4 border transition-all ${
                    note.is_pinned
                      ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
                      : "border-border/60 bg-card/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {note.is_pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <Pin className="h-3 w-3 fill-amber-500" />
                            Pinned Note
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-foreground/90">
                          {note.author?.email || "Agency Staff"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">•</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap pt-1">
                        {note.note_text}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        togglePinNote({ noteId: note.id, currentPinned: note.is_pinned })
                      }
                      title={note.is_pinned ? "Unpin note" : "Pin to top"}
                      className={`p-1 rounded-md hover:bg-muted/80 transition-colors ${
                        note.is_pinned
                          ? "text-amber-500"
                          : "text-muted-foreground/60 hover:text-foreground"
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Agency Tasks & Reminders */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center rounded-lg border border-border/60 bg-background/50 p-0.5 text-xs">
              {(["all", "todo", "in_progress", "completed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTaskFilter(filter)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                    taskFilter === filter
                      ? "bg-brand-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter.replace("_", " ")}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => setIsTaskModalOpen(true)}
              className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              New Agency Task
            </Button>
          </div>

          {filteredTasks.length === 0 ? (
            <Card className="border-dashed p-10 text-center bg-card/40">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-foreground">No Tasks Scheduled</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Keep the agency team accountable by adding follow-up tasks, contract checks, and auditions reviews.
              </p>
              <Button
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
                className="mt-4 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Schedule Task
              </Button>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map((task) => {
                const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
                const isDone = task.status === "completed"

                return (
                  <Card
                    key={task.id}
                    className={`p-4 border transition-all flex items-start gap-3.5 ${
                      isDone
                        ? "border-border/40 bg-muted/20 opacity-75"
                        : "border-border/70 bg-card/60 backdrop-blur-xs hover:border-brand-500/40"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors mt-0.5 ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-border/80 hover:border-brand-500 text-transparent"
                      }`}
                      title={isDone ? "Mark incomplete" : "Mark completed"}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            isDone ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium px-1.5 py-0 ${priorityInfo.badgeClass}`}
                        >
                          {priorityInfo.label}
                        </Badge>

                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize text-muted-foreground border-border/50"
                        >
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      )}

                      {task.due_date && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-0.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>Due: {task.due_date}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Projects & Castings */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-heading font-bold text-foreground">
                Client Casting Briefs & Intake Queue
              </h4>
              <p className="text-xs text-muted-foreground">
                External briefs submitted by {client.company_name} via the Client Portal.
              </p>
            </div>
            <Link href="/agency/casting">
              <Button size="sm" className="text-xs gap-1.5 bg-brand-600 hover:bg-brand-700 text-white">
                <Plus className="h-3.5 w-3.5" />
                <span>Go to Casting Pipeline</span>
              </Button>
            </Link>
          </div>

          {clientBriefs.length === 0 ? (
            <Card className="border-dashed p-10 text-center bg-card/40 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                <Tv className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                No Casting Briefs Logged Yet
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                When {client.company_name} submits casting briefs through the Client Portal, they will instantly appear here for your agency agents to review and convert into auditions.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {clientBriefs.map((brief: any) => (
                <Card
                  key={brief.id}
                  className="rounded-2xl border-border/60 bg-card/70 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          brief.status === "converted"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : brief.status === "under_review"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}
                      >
                        {brief.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Submitted: {new Date(brief.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h5 className="text-sm font-bold font-heading text-foreground">
                      {brief.project_title}
                    </h5>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {brief.raw_brief_text}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
                      {brief.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-brand-500" />
                          {brief.location}
                        </span>
                      )}
                      {brief.shoot_dates && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-brand-500" />
                          {brief.shoot_dates}
                        </span>
                      )}
                      {brief.budget_range && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-emerald-500" />
                          {brief.budget_range}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Link href={`/agency/casting?client_id=${clientId}`}>
                      <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                        <span>Match Talent</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Add Client Contact Person
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Assign a producer or casting director to {client.company_name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="h-7 w-7 rounded-lg hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Mustafa Qureshi"
                  value={contactForm.full_name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, full_name: e.target.value })
                  }
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Role / Title</label>
                <Input
                  placeholder="e.g. Senior Producer, Casting Director, Accounts Payable"
                  value={contactForm.role_title}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, role_title: e.target.value })
                  }
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="contact@company.com"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <Input
                    placeholder="+92 300 1234567"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phone: e.target.value })
                    }
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  WhatsApp Number (with country code)
                </label>
                <Input
                  placeholder="+923001234567"
                  value={contactForm.whatsapp_number}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, whatsapp_number: e.target.value })
                  }
                  className="text-xs h-9"
                />
                <p className="text-[10px] text-muted-foreground">
                  Enables 1-click WhatsApp messaging for quick reel dispatch.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_primary_checkbox"
                  checked={contactForm.is_primary}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, is_primary: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border/80 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="is_primary_checkbox" className="text-xs font-medium text-foreground cursor-pointer">
                  Mark as Primary Contact for this company
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Communication preferences, best times to call..."
                  value={contactForm.notes}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border/80 bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsContactModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white"
                >
                  Save Contact
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Create Agency Follow-Up Task
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Assign a task associated with {client.company_name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="h-7 w-7 rounded-lg hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Follow up on contract signed copy"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details of what needs to be verified..."
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border/80 bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-border/80 bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Due Date</label>
                  <Input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white"
                >
                  Save Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
