export type ClientStatus = 'lead' | 'prospect' | 'active' | 'inactive'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'completed'

export interface ClientContact {
  id: string
  client_id: string
  organization_id?: string
  full_name: string
  role_title?: string | null
  email: string
  phone?: string | null
  whatsapp_number?: string | null
  is_primary: boolean
  notes?: string | null
  created_at: string
}

export interface ClientNote {
  id: string
  client_id: string
  author_id: string
  note_text: string
  is_pinned: boolean
  created_at: string
  author?: {
    id?: string
    email?: string | null
    raw_user_meta_data?: {
      full_name?: string
    }
  } | null
}

export interface AgencyTask {
  id: string
  organization_id: string
  client_id?: string | null
  assigned_to_user_id?: string | null
  created_by_user_id?: string
  title: string
  description?: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date?: string | null
  created_at: string
  updated_at?: string
}

export interface Client {
  id: string
  organization_id: string
  producer_profile_id?: string | null
  company_name: string
  industry: string
  website?: string | null
  country: string
  city: string
  address?: string | null
  billing_email?: string | null
  phone?: string | null
  status: ClientStatus
  internal_notes?: string | null
  created_at: string
  updated_at?: string
  contacts?: ClientContact[]
  notes?: ClientNote[]
  tasks?: AgencyTask[]
  producer_profile?: {
    id: string
    company_name: string
    contact_email?: string | null
  } | null
}
