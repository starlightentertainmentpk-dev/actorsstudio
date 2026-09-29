export type SelfTapeStatus =
  | 'requested'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'retape_requested'
  | 'expired'

export interface SelfTapeRequest {
  id: string
  organization_id: string
  casting_call_id: string
  casting_role_id?: string | null
  talent_id: string
  instructions: string
  sides_script_url?: string | null
  deadline_at: string
  status: SelfTapeStatus
  created_at: string
  updated_at?: string
  client_id?: string | null
  requested_by_user_id?: string
  casting_call?: {
    id?: string
    title: string
  }
  role?: {
    id?: string
    role_name: string
  }
  talent?: {
    id: string
    full_name: string
    stage_name?: string | null
    avatar_url?: string | null
    city?: string | null
    height_cm?: number | null
  }
  submission?: SelfTapeSubmission | null
}

export interface SelfTapeSubmission {
  id: string
  self_tape_request_id: string
  talent_id: string
  video_storage_path: string
  video_signed_url?: string
  video_duration_sec?: number | null
  file_size_bytes?: number | null
  talent_notes?: string | null
  submitted_at: string
  status: SelfTapeStatus
  reviews?: SelfTapeReview[]
}

export interface SelfTapeReview {
  id: string
  self_tape_submission_id: string
  reviewer_user_id: string
  reviewer_type: 'agency' | 'client'
  score?: number | null
  timestamp_sec?: number | null
  comments: string
  decision?: 'shortlist' | 'pass' | 're_tape' | 'select' | string | null
  created_at: string
  reviewer?: {
    email: string
    name?: string
  }
}
