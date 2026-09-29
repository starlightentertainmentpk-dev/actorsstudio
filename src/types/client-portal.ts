export interface ClientUser {
  id: string
  client_id: string
  user_id: string
  can_submit_briefs: boolean
  can_approve_talent: boolean
  can_view_invoices: boolean
  client?: {
    id?: string
    company_name: string
    organization_id: string
    industry?: string
    logo_url?: string | null
  }
}

export type ClientBriefStatus = 'submitted' | 'under_review' | 'converted' | 'declined'

export interface ClientBrief {
  id: string
  client_id: string
  organization_id: string
  submitted_by_user_id?: string
  project_title: string
  target_category_id?: string | null
  gender_preference?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | string | null
  age_range_min?: number | null
  age_range_max?: number | null
  shoot_dates?: string | null
  budget_range?: string | null
  location?: string | null
  raw_brief_text: string
  status: ClientBriefStatus
  converted_casting_id?: string | null
  created_at: string
  updated_at?: string
}

export type CandidateDecision = 'shortlist' | 'reject' | 'audition_request' | 'pending' | 'selected'

export interface CandidateSubmission {
  id: string
  casting_call_id: string
  project_title: string
  role_name?: string
  talent_id: string
  talent_name: string
  stage_name?: string
  headshot_url?: string
  gender?: string
  age?: number
  age_range?: string
  height_cm?: number | string
  location?: string
  skills?: string[]
  bio?: string
  showreel_url?: string | null
  voice_sample_url?: string | null
  client_decision: CandidateDecision
  client_feedback?: string | null
  client_reviewed_at?: string | null
  proposed_fee?: number | null
  currency?: string
  agent_pitch_note?: string
}

export interface ClientProjectPresentation {
  id: string
  title: string
  description: string
  status: 'active' | 'in_review' | 'finalized'
  shoot_dates?: string
  location?: string
  submission_count: number
  reviewed_count: number
  shortlisted_count: number
  created_at: string
  submissions: CandidateSubmission[]
}

export interface ClientInvoice {
  id: string
  invoice_number: string
  project_title: string
  issue_date: string
  due_date: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'overdue'
  description?: string
  items?: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
}
