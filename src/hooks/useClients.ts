"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Client, ClientContact, ClientNote, AgencyTask } from "@/types/client"
import {
  createClientAction,
  updateClientAction,
  deleteClientAction,
  addContactAction,
  deleteContactAction,
  addClientNoteAction,
  togglePinNoteAction,
  deleteClientNoteAction,
  createAgencyTaskAction,
  updateAgencyTaskStatusAction,
  deleteAgencyTaskAction,
} from "@/app/(dashboard)/agency/clients/actions"

export const INITIAL_DEMO_CLIENTS: Client[] = [
  {
    id: "c1-dawn-films",
    organization_id: "default-org",
    company_name: "Dawn Films & Media",
    industry: "Film & Cinema",
    website: "https://dawnfilms.pk",
    country: "Pakistan",
    city: "Karachi",
    address: "Phase 6, DHA, Karachi",
    billing_email: "accounts@dawnfilms.pk",
    phone: "+92 21 3584 9200",
    status: "active",
    internal_notes:
      "Key production house for feature films and Ramadan television serials. High budget allocations.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    contacts: [
      {
        id: "cc-1",
        client_id: "c1-dawn-films",
        full_name: "Mustafa Qureshi",
        role_title: "Head of Casting & Talent",
        email: "mustafa.q@dawnfilms.pk",
        phone: "+92 300 8291034",
        whatsapp_number: "+923008291034",
        is_primary: true,
        notes: "Prefers communication over WhatsApp for quick talent submissions.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      },
      {
        id: "cc-2",
        client_id: "c1-dawn-films",
        full_name: "Ayesha Malik",
        role_title: "Executive Producer",
        email: "ayesha@dawnfilms.pk",
        phone: "+92 321 4455667",
        whatsapp_number: "+923214455667",
        is_primary: false,
        notes: "Signs off on contracts and commercial terms.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
      },
    ],
    notes: [
      {
        id: "cn-1",
        client_id: "c1-dawn-films",
        author_id: "u-1",
        note_text:
          "Meeting scheduled with Mustafa for upcoming commercial campaign casting. Requested 5 female leads aged 22-28.",
        is_pinned: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        author: { email: "agent@actorsstudio.pk" },
      },
      {
        id: "cn-2",
        client_id: "c1-dawn-films",
        author_id: "u-1",
        note_text: "Finalized invoice #INV-2026-089 for talent buyout rights.",
        is_pinned: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
        author: { email: "finance@actorsstudio.pk" },
      },
    ],
    tasks: [
      {
        id: "ct-1",
        organization_id: "default-org",
        client_id: "c1-dawn-films",
        title: "Send shortlisted audition reels for Ramadan Serial",
        description: "Package top 4 female lead auditions into client presentation deck.",
        priority: "urgent",
        status: "todo",
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      },
      {
        id: "ct-2",
        organization_id: "default-org",
        client_id: "c1-dawn-films",
        title: "Follow up on signed exclusivity deal",
        description: "Confirm courier delivery of wet-ink contracts.",
        priority: "medium",
        status: "in_progress",
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "c2-nexus-creative",
    organization_id: "default-org",
    company_name: "Nexus Ad Agency",
    industry: "Advertising & Commercials",
    website: "https://nexuscreative.com",
    country: "Pakistan",
    city: "Lahore",
    address: "Gulberg III, Lahore",
    billing_email: "media@nexuscreative.com",
    phone: "+92 42 3578 1122",
    status: "prospect",
    internal_notes: "Top-tier FMCG ad agency. Running major summer beverage campaign.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    contacts: [
      {
        id: "cc-3",
        client_id: "c2-nexus-creative",
        full_name: "Bilal Farooq",
        role_title: "Creative Director",
        email: "bilal@nexuscreative.com",
        phone: "+92 333 1122334",
        whatsapp_number: "+923331122334",
        is_primary: true,
        notes: "Wants energetic commercial actors.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      },
    ],
    notes: [],
    tasks: [],
  },
  {
    id: "c3-hum-entertainment",
    organization_id: "default-org",
    company_name: "Hum Television Network",
    industry: "Broadcast Television",
    website: "https://hum.tv",
    country: "Pakistan",
    city: "Karachi",
    address: "I.I. Chundrigar Road, Karachi",
    billing_email: "casting@hum.tv",
    phone: "+92 21 111 486 111",
    status: "active",
    internal_notes: "Regular casting partner for prime-time dramas and reality shows.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    contacts: [
      {
        id: "cc-4",
        client_id: "c3-hum-entertainment",
        full_name: "Sarah Tareen",
        role_title: "Senior Casting Producer",
        email: "sarah.t@hum.tv",
        phone: "+92 301 9876543",
        whatsapp_number: "+923019876543",
        is_primary: true,
        notes: "Direct contact for prime time slots.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
      },
    ],
    notes: [],
    tasks: [],
  },
]

// Fallback in-memory storage for development / instant responsiveness
let localClientsStore: Client[] = [...INITIAL_DEMO_CLIENTS]

export function useClients(orgId?: string | null) {
  const queryClient = useQueryClient()
  const effectiveOrgId = orgId || "default-org"

  const {
    data: clients = localClientsStore,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["agency-clients", effectiveOrgId],
    initialData: () => localClientsStore,
    queryFn: async (): Promise<Client[]> => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("clients")
          .select("*, contacts:client_contacts(*)")
          .eq("organization_id", effectiveOrgId)
          .order("created_at", { ascending: false })

        if (error || !data || data.length === 0) {
          // If remote table not migrated or empty, provide fallback
          return localClientsStore
        }

        return data as unknown as Client[]
      } catch {
        return localClientsStore
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  })

  // Create Client Mutation
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await createClientAction(effectiveOrgId, formData)
      if (!res.success) {
        // Fallback for dev / unmigrated remote db
        const company_name = formData.get("company_name")?.toString() || "New Client"
        const industry = formData.get("industry")?.toString() || "Entertainment & Film"
        const city = formData.get("city")?.toString() || "Karachi"
        const country = formData.get("country")?.toString() || "Pakistan"
        const status = (formData.get("status")?.toString() as any) || "active"
        const website = formData.get("website")?.toString() || null
        const billing_email = formData.get("billing_email")?.toString() || null
        const phone = formData.get("phone")?.toString() || null
        const internal_notes = formData.get("internal_notes")?.toString() || null

        const newClient: Client = {
          id: `client-${Date.now()}`,
          organization_id: effectiveOrgId,
          company_name,
          industry,
          city,
          country,
          status,
          website,
          billing_email,
          phone,
          internal_notes,
          created_at: new Date().toISOString(),
          contacts: [],
          notes: [],
          tasks: [],
        }
        localClientsStore = [newClient, ...localClientsStore]
        return { success: true, clientId: newClient.id }
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-clients"] })
    },
  })

  return {
    clients,
    isLoading,
    refetch,
    createClient: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

export function useClientDetail(clientId: string, orgId?: string | null) {
  const queryClient = useQueryClient()
  const effectiveOrgId = orgId || "default-org"

  const {
    data: client,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["agency-client-detail", clientId],
    initialData: () => localClientsStore.find((c) => c.id === clientId) || null,
    queryFn: async (): Promise<Client | null> => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("clients")
          .select(`
            *,
            contacts:client_contacts(*),
            notes:client_notes(*, author:users(id, email)),
            tasks:agency_tasks(*),
            producer_profile:producer_profiles(id, company_name, contact_email)
          `)
          .eq("id", clientId)
          .single()

        if (error || !data) {
          const found = localClientsStore.find((c) => c.id === clientId)
          return found || null
        }

        return data as unknown as Client
      } catch {
        const found = localClientsStore.find((c) => c.id === clientId)
        return found || null
      }
    },
  })

  // Add Contact Mutation
  const addContactMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await addContactAction(effectiveOrgId, formData)
      if (!res.success) {
        // Fallback update
        const full_name = formData.get("full_name")?.toString() || "New Contact"
        const role_title = formData.get("role_title")?.toString() || "Team Member"
        const email = formData.get("email")?.toString() || ""
        const phone = formData.get("phone")?.toString() || null
        const whatsapp_number = formData.get("whatsapp_number")?.toString() || null
        const is_primary = formData.get("is_primary") === "true" || formData.get("is_primary") === "on"
        const notes = formData.get("notes")?.toString() || null

        const newContact: ClientContact = {
          id: `contact-${Date.now()}`,
          client_id: clientId,
          full_name,
          role_title,
          email,
          phone,
          whatsapp_number,
          is_primary,
          notes,
          created_at: new Date().toISOString(),
        }

        localClientsStore = localClientsStore.map((c) => {
          if (c.id === clientId) {
            const currentContacts = c.contacts || []
            const updated = is_primary
              ? currentContacts.map((ct) => ({ ...ct, is_primary: false }))
              : currentContacts
            return {
              ...c,
              contacts: [newContact, ...updated],
            }
          }
          return c
        })
        return { success: true }
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-client-detail", clientId] })
      queryClient.invalidateQueries({ queryKey: ["agency-clients"] })
    },
  })

  // Delete Contact Mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const res = await deleteContactAction(contactId, clientId)
      if (!res.success) {
        localClientsStore = localClientsStore.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              contacts: (c.contacts || []).filter((ct) => ct.id !== contactId),
            }
          }
          return c
        })
        return { success: true }
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-client-detail", clientId] })
      queryClient.invalidateQueries({ queryKey: ["agency-clients"] })
    },
  })

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const res = await addClientNoteAction(clientId, noteText)
      if (!res.success) {
        const newNote: ClientNote = {
          id: `note-${Date.now()}`,
          client_id: clientId,
          author_id: "current-user",
          note_text: noteText,
          is_pinned: false,
          created_at: new Date().toISOString(),
          author: { email: "agent@actorsstudio.pk" },
        }

        localClientsStore = localClientsStore.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              notes: [newNote, ...(c.notes || [])],
            }
          }
          return c
        })
        return { success: true }
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-client-detail", clientId] })
    },
  })

  // Toggle Pin Note Mutation
  const togglePinMutation = useMutation({
    mutationFn: async ({ noteId, currentPinned }: { noteId: string; currentPinned: boolean }) => {
      const res = await togglePinNoteAction(noteId, clientId, currentPinned)
      if (!res.success) {
        localClientsStore = localClientsStore.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              notes: (c.notes || []).map((n) =>
                n.id === noteId ? { ...n, is_pinned: !currentPinned } : n
              ),
            }
          }
          return c
        })
        return { success: true }
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-client-detail", clientId] })
    },
  })

  // Add Task Mutation
  const addTaskMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await createAgencyTaskAction(effectiveOrgId, formData)
      if (!res.success) {
        const title = formData.get("title")?.toString() || "Task"
        const description = formData.get("description")?.toString() || null
        const priority = (formData.get("priority")?.toString() as any) || "medium"
        const status = (formData.get("status")?.toString() as any) || "todo"
        const due_date = formData.get("due_date")?.toString() || null

        const newTask: AgencyTask = {
          id: `task-${Date.now()}`,
          organization_id: effectiveOrgId,
          client_id: clientId,
          title,
          description,
          priority,
          status,
          due_date,
          created_at: new Date().toISOString(),
        }

        localClientsStore = localClientsStore.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              tasks: [newTask, ...(c.tasks || [])],
            }
          }
          return c
        })
        return { success: true }
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-client-detail", clientId] })
    },
  })

  // Update Task Status Mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string
      status: "todo" | "in_progress" | "completed"
    }) => {
      const res = await updateAgencyTaskStatusAction(taskId, clientId, status)
      if (!res.success) {
        localClientsStore = localClientsStore.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              tasks: (c.tasks || []).map((t) => (t.id === taskId ? { ...t, status } : t)),
            }
          }
          return c
        })
        return { success: true }
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-client-detail", clientId] })
    },
  })

  return {
    client,
    isLoading,
    refetch,
    addContact: addContactMutation.mutateAsync,
    isAddingContact: addContactMutation.isPending,
    deleteContact: deleteContactMutation.mutateAsync,
    addNote: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,
    togglePinNote: togglePinMutation.mutateAsync,
    addTask: addTaskMutation.mutateAsync,
    isAddingTask: addTaskMutation.isPending,
    updateTaskStatus: updateTaskStatusMutation.mutateAsync,
  }
}
