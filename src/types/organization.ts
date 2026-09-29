export type AgencyType =
  | 'talent_agency'
  | 'modeling_agency'
  | 'casting_agency'
  | 'entertainment_agency'
  | 'influencer_agency'
  | 'creator_management'
  | 'sports_talent'
  | 'other'

export type OrganizationRole =
  | 'super_admin'
  | 'agency_owner'
  | 'agency_admin'
  | 'agent'
  | 'casting_manager'
  | 'talent_manager'
  | 'finance_manager'
  | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  agency_type: AgencyType
  country: string
  currency: string
  timezone: string
  logo_url?: string | null
  brand_color?: string | null
  website?: string | null
  bio?: string | null
  is_active: boolean
  created_at: string
}

export interface OrganizationSettings {
  organization_id: string
  default_commission_rate: number
  public_directory_enabled: boolean
  custom_domain?: string | null
  email_from_name?: string | null
  email_reply_to?: string | null
  invoice_notes_default?: string | null
  settings_json: Record<string, unknown>
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole
  joined_at: string
  user?: {
    email: string
    role: string
  }
  organization?: Organization
}
