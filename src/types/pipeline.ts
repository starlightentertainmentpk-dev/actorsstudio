export type PipelineStage =
  | 'new_brief'
  | 'searching'
  | 'shortlisted'
  | 'submitted'
  | 'client_review'
  | 'audition'
  | 'callback'
  | 'selected'
  | 'offer'
  | 'booked'
  | 'completed'

export interface CastingRole {
  id: string
  casting_call_id: string
  organization_id?: string
  role_name: string
  role_type: string // 'lead' | 'supporting' | 'extra' | 'voiceover'
  gender_requirement?: string | null
  age_min?: number | null
  age_max?: number | null
  height_cm_min?: number | null
  height_cm_max?: number | null
  pay_rate?: string | null
  description?: string | null
  created_at?: string
}

export interface PipelineCandidate {
  id: string
  casting_call_id: string
  casting_role_id?: string | null
  talent_id: string
  stage: PipelineStage
  proposed_fee?: number | null
  currency: string
  agent_pitch_note?: string | null
  client_id?: string | null
  client_decision?: string | null
  client_feedback?: string | null
  client_reviewed_at?: string | null
  created_at?: string
  updated_at?: string
  talent: {
    id: string
    full_name: string
    stage_name?: string | null
    city?: string | null
    height_cm?: number | null
    is_available: boolean
    user_id: string
    avatar_url?: string | null
    skills?: string[]
    bio?: string | null
    showreel_url?: string | null
    voice_sample_url?: string | null
  }
  role?: CastingRole | null
}

export interface CastingProject {
  id: string
  title: string
  project_type?: string
  client_id?: string | null
  client_name?: string | null
  organization_id?: string
  status: string
  shoot_dates?: string | null
  location?: string | null
  budget_range?: string | null
  roles: CastingRole[]
  candidates: PipelineCandidate[]
  created_at: string
}

export interface Shortlist {
  id: string
  organization_id: string
  title: string
  description?: string | null
  client_id?: string | null
  created_by: string
  created_at: string
  items?: ShortlistItem[]
}

export interface ShortlistItem {
  id: string
  shortlist_id: string
  talent_id: string
  added_at: string
  notes?: string | null
  talent?: PipelineCandidate['talent']
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  new_brief: 'New Brief',
  searching: 'Searching',
  shortlisted: 'Shortlisted',
  submitted: 'Submitted to Client',
  client_review: 'Client Review',
  audition: 'Audition / Self-Tape',
  callback: 'Callback',
  selected: 'Selected',
  offer: 'Offer Sent',
  booked: 'Booked',
  completed: 'Completed',
}

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, { bg: string; text: string; border: string }> = {
  new_brief: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
  searching: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  shortlisted: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  submitted: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  client_review: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  audition: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  callback: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  selected: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  offer: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  booked: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  completed: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
}
