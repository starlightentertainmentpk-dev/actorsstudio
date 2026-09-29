"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
  Contract,
  ContractTemplate,
  AgencyDocument,
  ContractStatus,
  DocumentCategory,
} from "@/types/contracts"
import {
  generateContractFromBookingAction,
  sendContractForSignatureAction,
  submitDigitalSignatureAction,
  createContractTemplateAction,
  updateContractTemplateAction,
  deleteContractTemplateAction,
  saveAgencyDocumentRecordAction,
  deleteAgencyDocumentAction,
} from "@/app/(dashboard)/agency/contracts/actions"
import { useOrganizations } from "./useOrganizations"

export const INITIAL_DEMO_TEMPLATES: ContractTemplate[] = [
  {
    id: "tmpl-commercial-release",
    organization_id: "default-org",
    template_name: "Standard Commercial Appearance Release",
    contract_type: "booking",
    is_default: true,
    merge_fields_json: [
      "{{talent_name}}",
      "{{client_name}}",
      "{{agency_name}}",
      "{{project_name}}",
      "{{fee}}",
      "{{shoot_dates}}",
      "{{location}}",
      "{{usage_rights}}",
      "{{territory}}",
      "{{media}}",
    ],
    body_markdown: `# TALENT PERFORMANCE & APPEARANCE AGREEMENT

This Agreement is made between **{{client_name}}** ("Client") and **{{talent_name}}** ("Talent"), exclusively represented by **{{agency_name}}** ("Agency").

### 1. Engagement & Shoot Details
- **Project Name:** {{project_name}}
- **Dates of Engagement:** {{shoot_dates}}
- **Location:** {{location}}

### 2. Compensation & Payout Terms
Client agrees to pay a total gross compensation of **{{fee}}** for performance services rendered. Agency commission is calculated at master representation rates (default 20%).

### 3. Grant of Usage Rights
Talent hereby grants to Client the rights to use Talent's name, voice, image, and likeness for the following defined scope:
- **Media Rights:** {{media}}
- **Territory:** {{territory}}
- **Duration / Exclusivity:** {{usage_rights}}

### 4. Legal Warranties & Covenants
Talent warrants that they have full legal capacity to enter into this agreement. Client warrants that the production environment will comply with industry safety standards.

### 5. Signatures
Signed electronically with full legal consent:

**Talent:** {{talent_name}}  
**Client:** {{client_name}}  
**Agency Representative:** {{agency_name}}`,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "tmpl-talent-rep",
    organization_id: "default-org",
    template_name: "Exclusive Talent Representation Agreement",
    contract_type: "representation",
    is_default: false,
    merge_fields_json: [
      "{{talent_name}}",
      "{{agency_name}}",
      "{{territory}}",
      "{{shoot_dates}}",
      "{{commission}}",
      "{{fee}}",
    ],
    body_markdown: `# EXCLUSIVE TALENT REPRESENTATION AGREEMENT

This Exclusive Representation Agreement is entered into between **{{agency_name}}** ("Agency") and **{{talent_name}}** ("Talent").

### 1. Representation Scope & Authority
Talent hereby appoints Agency as their exclusive management representative for commercial, theatrical, broadcast, print, and digital engagements within **{{territory}}**.

### 2. Term of Representation
- **Effective Dates:** {{shoot_dates}}
- **Territory Scope:** {{territory}}

### 3. Commissions & Payout Schedule
Agency will collect an agreed representation commission of **{{commission}}** from gross earnings for bookings secured. Talent will receive net payout statements within 14 days of agency receipt of client funds.

### 4. Standard Covenants & Exclusivity
Talent warrants that they are free to enter into this agreement and have no conflicting representation agreements in the specified territory.

### 5. Signatures
**Talent:** {{talent_name}}  
**Agency Officer:** {{agency_name}}`,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: "tmpl-standard-nda",
    organization_id: "default-org",
    template_name: "Standard Actor Non-Disclosure Agreement (NDA)",
    contract_type: "nda",
    is_default: false,
    merge_fields_json: [
      "{{talent_name}}",
      "{{client_name}}",
      "{{project_name}}",
      "{{shoot_dates}}",
    ],
    body_markdown: `# CONFIDENTIALITY & NON-DISCLOSURE AGREEMENT

This Agreement is entered into by **{{talent_name}}** ("Recipient") in favor of **{{client_name}}** ("Discloser") concerning the production **{{project_name}}**.

### 1. Confidential Information
Recipient acknowledges that scripts, plot details, costumes, call sheets, and behind-the-scenes materials are strictly proprietary.

### 2. Non-Disclosure Obligations
Recipient agrees not to disclose, publish, photograph, or distribute any information on social media platforms until authorized post-broadcast date.

### 3. Duration
This obligation remains in effect throughout the production dates {{shoot_dates}} and for 24 months post-initial public release.`,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
]

export const INITIAL_DEMO_CONTRACTS: Contract[] = [
  {
    id: "contract-shan-signed",
    organization_id: "default-org",
    deal_id: "deal-shan-ramadan",
    booking_id: "booking-shan-shoot",
    client_id: "c4-shan-foods",
    talent_id: "t-zara-noor",
    contract_title: "Standard Commercial Appearance Release — Shan Foods Festive Ramadan TVC",
    status: "signed",
    rendered_body: `# TALENT PERFORMANCE & APPEARANCE AGREEMENT

This Agreement is made between **Shan Foods Global** ("Client") and **Zara Noor** ("Talent"), exclusively represented by **Actor's Studio Pakistan** ("Agency").

### 1. Engagement & Shoot Details
- **Project Name:** Shan Foods Festive Ramadan TVC & Digital Campaign
- **Dates of Engagement:** 2026-11-01 to 2026-11-03
- **Location:** Studio 4, Film City, Karachi

### 2. Compensation & Payout Terms
Client agrees to pay a total gross compensation of **PKR 1,200,000** for performance services rendered. Agency commission is calculated at master representation rates (default 20%).

### 3. Grant of Usage Rights
Talent hereby grants to Client the rights to use Talent's name, voice, image, and likeness for the following defined scope:
- **Media Rights:** TVC Broadcast, YouTube Pre-Roll, Billboards
- **Territory:** Pakistan & GCC Diaspora
- **Duration / Exclusivity:** 1 Year Exclusive in Food Spices Category

### 4. Signatures
Signed electronically with full legal consent:
**Talent:** Zara Noor (Verified via Digital Canvas)  
**Client:** Shan Foods Brand Operations  
**Agency Representative:** Actor's Studio Pakistan`,
    sent_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    viewed_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    signed_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    client: {
      id: "c4-shan-foods",
      company_name: "Shan Foods Global",
      contact_name: "Fahad Mustafa",
      email: "procurement@shanfoods.com",
    },
    talent: {
      id: "t-zara-noor",
      full_name: "Zara Noor",
      stage_name: "Zara Noor",
      email: "zara.noor@actorsstudio.pk",
    },
    booking: {
      id: "booking-shan-shoot",
      project_name: "Shan Foods Festive Ramadan TVC",
      shoot_date_start: "2026-11-01",
      shoot_date_end: "2026-11-03",
      fee_amount: 1200000,
      currency: "PKR",
    },
    signatures: [
      {
        id: "sig-zara-1",
        contract_id: "contract-shan-signed",
        signer_type: "talent",
        signer_name: "Zara Noor",
        signature_image_data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        ip_address: "182.188.42.10",
        user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)",
        signed_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
  },
  {
    id: "contract-pepsi-sent",
    organization_id: "default-org",
    deal_id: "deal-pepsi-series",
    booking_id: "booking-pepsi-shoot",
    client_id: "c3-multiverse",
    talent_id: "t-bilal-khan",
    contract_title: "Standard Commercial Appearance Release — Pepsi Youth Music Series",
    status: "sent",
    rendered_body: `# TALENT PERFORMANCE & APPEARANCE AGREEMENT

This Agreement is made between **Multiverse Productions (PepsiCo Account)** ("Client") and **Bilal Khan** ("Talent"), exclusively represented by **Actor's Studio Pakistan** ("Agency").

### 1. Engagement & Shoot Details
- **Project Name:** Pepsi Youth Music & Sports Anthem Series
- **Dates of Engagement:** 2026-11-15 to 2026-11-18
- **Location:** Gaddafi Stadium Complex, Lahore

### 2. Compensation & Payout Terms
Client agrees to pay a total gross compensation of **PKR 2,500,000** for performance services rendered.

### 3. Grant of Usage Rights
- **Media Rights:** Digital, Broadcast TV, Spotify & Cinema
- **Territory:** Pakistan Nationwide
- **Duration / Exclusivity:** 6 Months Beverage Category Exclusivity`,
    sent_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    viewed_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    client: {
      id: "c3-multiverse",
      company_name: "Multiverse Productions",
      contact_name: "Kamran Siddiqui",
      email: "kamran@multiverse.pk",
    },
    talent: {
      id: "t-bilal-khan",
      full_name: "Bilal Khan",
      stage_name: "Bilal Khan",
      email: "bilal.khan@actorsstudio.pk",
    },
    booking: {
      id: "booking-pepsi-shoot",
      project_name: "Pepsi Youth Music Series",
      shoot_date_start: "2026-11-15",
      shoot_date_end: "2026-11-18",
      fee_amount: 2500000,
      currency: "PKR",
    },
    signatures: [],
  },
  {
    id: "contract-khaadi-draft",
    organization_id: "default-org",
    deal_id: null,
    booking_id: "booking-khaadi-shoot",
    client_id: "c1-khaadi",
    talent_id: "t-ayesha-omar",
    contract_title: "Standard Commercial Appearance Release — Khaadi Summer Festive 2026",
    status: "draft",
    rendered_body: `# TALENT PERFORMANCE & APPEARANCE AGREEMENT

Draft Agreement prepared for **Khaadi Retail Pakistan** and **Ayesha Omar**. Shoot dates: 2026-12-05 to 2026-12-07. Compensation: PKR 850,000.`,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    client: {
      id: "c1-khaadi",
      company_name: "Khaadi Retail Pakistan",
      contact_name: "Sobia Nazir",
      email: "creative@khaadi.com",
    },
    talent: {
      id: "t-ayesha-omar",
      full_name: "Ayesha Omar",
      stage_name: "Ayesha Omar",
      email: "ayesha@actorsstudio.pk",
    },
    booking: {
      id: "booking-khaadi-shoot",
      project_name: "Khaadi Summer Festive 2026",
      shoot_date_start: "2026-12-05",
      shoot_date_end: "2026-12-07",
      fee_amount: 850000,
      currency: "PKR",
    },
    signatures: [],
  },
]

export const INITIAL_DEMO_DOCUMENTS: AgencyDocument[] = [
  {
    id: "doc-shan-executed",
    organization_id: "default-org",
    category: "contract",
    title: "Executed_Shan_Foods_Commercial_Agreement_Signed.pdf",
    file_storage_path: "/documents/contracts/Executed_Shan_Foods_Commercial_Agreement_Signed.pdf",
    file_size_bytes: 245000,
    mime_type: "application/pdf",
    is_private: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    uploader_name: "Legal Team",
  },
  {
    id: "doc-pepsi-brief",
    organization_id: "default-org",
    category: "production",
    title: "Pepsi_Music_Series_Production_Brief_v2.pdf",
    file_storage_path: "/documents/briefs/Pepsi_Music_Series_Production_Brief_v2.pdf",
    file_size_bytes: 1240000,
    mime_type: "application/pdf",
    is_private: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    uploader_name: "Client Account Manager",
  },
  {
    id: "doc-zara-passport",
    organization_id: "default-org",
    category: "talent_doc",
    title: "Zara_Noor_International_Passport_Scan.pdf",
    file_storage_path: "/documents/talent/Zara_Noor_International_Passport_Scan.pdf",
    file_size_bytes: 840000,
    mime_type: "application/pdf",
    is_private: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    uploader_name: "Talent Operations",
  },
  {
    id: "doc-shan-invoice",
    organization_id: "default-org",
    category: "invoice",
    title: "Shan_Foods_Advance_Invoice_INV-2026-081.pdf",
    file_storage_path: "/documents/invoices/Shan_Foods_Advance_Invoice_INV-2026-081.pdf",
    file_size_bytes: 115000,
    mime_type: "application/pdf",
    is_private: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    uploader_name: "Finance Desk",
  },
  {
    id: "doc-master-legal",
    organization_id: "default-org",
    category: "legal",
    title: "ActorStudio_Master_Legal_Terms_2026.pdf",
    file_storage_path: "/documents/legal/ActorStudio_Master_Legal_Terms_2026.pdf",
    file_size_bytes: 520000,
    mime_type: "application/pdf",
    is_private: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 180).toISOString(),
    uploader_name: "Managing Partner",
  },
]

export function useContracts(filter?: {
  status?: ContractStatus
  talentId?: string
  clientId?: string
}) {
  const queryClient = useQueryClient()
  const { activeOrg } = useOrganizations()
  const orgId = activeOrg?.id || "default-org"

  // 1. Fetch Contracts
  const { data: contracts = INITIAL_DEMO_CONTRACTS, isLoading: isLoadingContracts } = useQuery({
    queryKey: ["contracts", orgId, filter],
    queryFn: async () => {
      try {
        const supabase = createClient()
        let query = (supabase.from("contracts" as any) as any)
          .select(`
            *,
            client:clients(id, company_name, contact_name, email),
            talent:talent_profiles(id, full_name, stage_name, email),
            booking:bookings(id, project_name, shoot_date_start, shoot_date_end, fee_amount, currency),
            signatures:contract_signatures(*)
          `)
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })

        if (filter?.status) query = query.eq("status", filter.status)
        if (filter?.talentId) query = query.eq("talent_id", filter.talentId)
        if (filter?.clientId) query = query.eq("client_id", filter.clientId)

        const { data, error } = await query
        if (error || !data || data.length === 0) {
          return INITIAL_DEMO_CONTRACTS
        }
        return data as Contract[]
      } catch (err) {
        console.warn("Using fallback demo contracts:", err)
        return INITIAL_DEMO_CONTRACTS
      }
    },
    staleTime: 1000 * 60 * 2,
  })

  // 2. Fetch Templates
  const { data: templates = INITIAL_DEMO_TEMPLATES, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["contract-templates", orgId],
    queryFn: async () => {
      try {
        const supabase = createClient()
        const { data, error } = await (supabase.from("contract_templates" as any) as any)
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })

        if (error || !data || data.length === 0) {
          return INITIAL_DEMO_TEMPLATES
        }
        return data as ContractTemplate[]
      } catch (err) {
        console.warn("Using fallback demo templates:", err)
        return INITIAL_DEMO_TEMPLATES
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  // 3. Fetch Documents
  const { data: documents = INITIAL_DEMO_DOCUMENTS, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["agency-documents", orgId],
    queryFn: async () => {
      try {
        const supabase = createClient()
        const { data, error } = await (supabase.from("agency_documents" as any) as any)
          .select(`*, uploader:users(id, email)`)
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })

        if (error || !data || data.length === 0) {
          return INITIAL_DEMO_DOCUMENTS
        }
        return (data || []).map((doc: any) => ({
          ...doc,
          uploader_name: doc.uploader?.email || "Agency Team",
        })) as AgencyDocument[]
      } catch (err) {
        console.warn("Using fallback demo documents:", err)
        return INITIAL_DEMO_DOCUMENTS
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  // KPI Calculations
  const kpis = {
    total: contracts.length,
    active: contracts.filter(c => ["draft", "sent", "viewed"].includes(c.status)).length,
    awaitingTalent: contracts.filter(c => {
      if (!["sent", "viewed"].includes(c.status)) return false
      return !c.signatures?.some(s => s.signer_type === "talent")
    }).length,
    awaitingClient: contracts.filter(c => {
      if (!["sent", "viewed"].includes(c.status)) return false
      return !c.signatures?.some(s => s.signer_type === "client")
    }).length,
    executed: contracts.filter(c => c.status === "signed").length,
  }

  // Mutations
  const generateContractMutation = useMutation({
    mutationFn: async (payload: { templateId: string; bookingId: string }) => {
      return generateContractFromBookingAction({
        orgId,
        templateId: payload.templateId,
        bookingId: payload.bookingId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", orgId] })
    },
  })

  const sendForSignatureMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return sendContractForSignatureAction(contractId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", orgId] })
    },
  })

  const submitSignatureMutation = useMutation({
    mutationFn: async (payload: {
      contractId: string
      signerType: "talent" | "client" | "agency_witness"
      signerName: string
      signatureImageData: string
      ipAddress?: string
      userAgent?: string
    }) => {
      return submitDigitalSignatureAction(payload.contractId, payload)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contracts", orgId] })
      queryClient.invalidateQueries({ queryKey: ["contract", variables.contractId] })
    },
  })

  const createTemplateMutation = useMutation({
    mutationFn: async (payload: {
      templateName: string
      contractType: string
      bodyMarkdown: string
      isDefault?: boolean
    }) => {
      return createContractTemplateAction({
        orgId,
        ...payload,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates", orgId] })
    },
  })

  const updateTemplateMutation = useMutation({
    mutationFn: async (payload: {
      templateId: string
      templateName?: string
      contractType?: string
      bodyMarkdown?: string
      isDefault?: boolean
    }) => {
      return updateContractTemplateAction(payload.templateId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates", orgId] })
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return deleteContractTemplateAction(templateId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates", orgId] })
    },
  })

  const saveDocumentRecordMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      category: DocumentCategory
      fileStoragePath: string
      fileSizeBytes?: number
      mimeType?: string
      isPrivate?: boolean
    }) => {
      return saveAgencyDocumentRecordAction({
        orgId,
        ...payload,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-documents", orgId] })
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return deleteAgencyDocumentAction(documentId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-documents", orgId] })
    },
  })

  return {
    contracts,
    isLoadingContracts,
    templates,
    isLoadingTemplates,
    documents,
    isLoadingDocuments,
    kpis,
    generateContract: generateContractMutation.mutateAsync,
    isGenerating: generateContractMutation.isPending,
    sendForSignature: sendForSignatureMutation.mutateAsync,
    isSending: sendForSignatureMutation.isPending,
    submitSignature: submitSignatureMutation.mutateAsync,
    isSubmittingSignature: submitSignatureMutation.isPending,
    createTemplate: createTemplateMutation.mutateAsync,
    isCreatingTemplate: createTemplateMutation.isPending,
    updateTemplate: updateTemplateMutation.mutateAsync,
    isUpdatingTemplate: updateTemplateMutation.isPending,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    saveDocumentRecord: saveDocumentRecordMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
  }
}
