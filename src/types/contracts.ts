export type ContractStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'rejected' | 'expired'

export type ContractType = 'representation' | 'booking' | 'model_release' | 'nda' | 'usage_rights'

export type SignerType = 'talent' | 'client' | 'agency_witness'

export type DocumentCategory =
  | 'contract'
  | 'invoice'
  | 'talent_doc'
  | 'client_doc'
  | 'legal'
  | 'production'

export interface ContractTemplate {
  id: string
  organization_id: string
  template_name: string
  contract_type: ContractType | string
  body_markdown: string
  merge_fields_json: string[]
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ContractSignature {
  id: string
  contract_id: string
  signer_type: SignerType
  signer_user_id?: string | null
  signer_name: string
  signature_image_data: string // base64 PNG canvas data
  ip_address?: string | null
  user_agent?: string | null
  signed_at: string
}

export interface Contract {
  id: string
  organization_id: string
  deal_id?: string | null
  booking_id?: string | null
  client_id: string
  talent_id: string
  contract_title: string
  rendered_body: string
  status: ContractStatus
  file_storage_path?: string | null
  sent_at?: string | null
  viewed_at?: string | null
  signed_at?: string | null
  expires_at?: string | null
  created_at: string
  updated_at: string

  // Joined fields
  client?: {
    id?: string
    company_name: string
    contact_name?: string
    email?: string
  } | null
  talent?: {
    id?: string
    full_name: string
    stage_name?: string | null
    email?: string
    phone?: string
  } | null
  deal?: {
    id?: string
    deal_name: string
    deal_value: number
  } | null
  booking?: {
    id?: string
    project_name: string
    shoot_date_start: string
    shoot_date_end: string
    fee_amount: number
    currency: string
  } | null
  organization?: {
    id?: string
    name: string
    logo_url?: string | null
  } | null
  signatures?: ContractSignature[]
}

export interface AgencyDocument {
  id: string
  organization_id: string
  category: DocumentCategory
  title: string
  file_storage_path: string
  file_size_bytes?: number | null
  mime_type?: string | null
  uploaded_by_user_id?: string | null
  is_private: boolean
  created_at: string
  uploader_name?: string | null
  download_url?: string | null
}

export interface SignatureProvider {
  name: string
  createEnvelope(params: {
    contractId: string
    title: string
    renderedBody: string
    recipientEmail: string
    recipientName: string
  }): Promise<{ envelopeId: string; signingUrl: string }>
  getEnvelopeStatus(envelopeId: string): Promise<{
    status: ContractStatus
    signedAt?: string
  }>
}
