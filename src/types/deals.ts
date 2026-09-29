export type DealStatus =
  | 'lead'
  | 'proposal'
  | 'negotiation'
  | 'approved'
  | 'contract'
  | 'booked'
  | 'completed'
  | 'invoiced'
  | 'paid'
  | 'cancelled'

export type BookingStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'

export type HoldStatus = 'active' | 'challenged' | 'confirmed' | 'released' | 'expired'

export interface Deal {
  id: string
  organization_id: string
  client_id: string
  client_name?: string
  casting_call_id?: string | null
  talent_id: string
  talent_name?: string
  talent_avatar?: string | null
  deal_name: string
  deal_value: number
  agency_commission_amount: number
  agency_commission_rate?: number // percentage e.g. 20
  talent_payout_amount: number
  currency: string
  payment_terms?: string
  status: DealStatus
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  organization_id: string
  deal_id?: string | null
  client_id: string
  client_name?: string
  talent_id: string
  talent_name?: string
  talent_avatar?: string | null
  project_name: string
  shoot_date_start: string
  shoot_date_end: string
  call_time?: string | null
  wrap_time?: string | null
  location_address?: string | null
  fee_amount: number
  currency: string
  usage_rights: string
  territory: string
  media: string
  status: BookingStatus
  conflict_override: boolean
  created_at: string
  updated_at: string
}

export interface Hold {
  id: string
  organization_id: string
  client_id: string
  client_name?: string
  talent_id: string
  talent_name?: string
  talent_avatar?: string | null
  hold_date_start: string
  hold_date_end: string
  priority_level: number // 1 = 1st Hold, 2 = 2nd Hold, 3 = 3rd Hold
  project_title: string
  status: HoldStatus
  challenged_at?: string | null
  challenge_expires_at?: string | null
  notes?: string | null
  created_at: string
}

export interface ConflictItem {
  type: 'booking' | 'hold' | 'audition' | 'blackout'
  id: string
  title: string
  startDate: string
  endDate: string
  details: string
  priorityLevel?: number
}

export interface ConflictResult {
  hasConflict: boolean
  conflicts: ConflictItem[]
}

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  lead: 'Lead Prospect',
  proposal: 'Proposal Sent',
  negotiation: 'In Negotiation',
  approved: 'Deal Approved',
  contract: 'Contract Issued',
  booked: 'Confirmed & Booked',
  completed: 'Shoot Completed',
  invoiced: 'Invoiced',
  paid: 'Paid in Full',
  cancelled: 'Cancelled',
}

export const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  lead: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  proposal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  negotiation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  contract: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  booked: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  completed: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  invoiced: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

export const HOLD_STATUS_LABELS: Record<HoldStatus, string> = {
  active: 'Active Hold',
  challenged: '24h Challenge Active',
  confirmed: 'Confirmed to Booking',
  released: 'Released',
  expired: 'Expired',
}

export const HOLD_STATUS_COLORS: Record<HoldStatus, string> = {
  active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  challenged: 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  released: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  expired: 'bg-muted text-muted-foreground border-border/50',
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  draft: 'Draft Call Sheet',
  confirmed: 'Confirmed Shoot',
  completed: 'Wrapped & Completed',
  cancelled: 'Cancelled',
}

export const USAGE_MEDIA_OPTIONS = [
  'TV Commercial (National)',
  'Digital & Social Media',
  'Print & Press',
  'Billboards & Outdoor (OOH)',
  'Cinema & Theatrical',
  'Radio & Audio Ads',
  'In-Store POS / Merchandising',
]

export const USAGE_TERRITORY_OPTIONS = [
  'Pakistan Only',
  'Pakistan + GCC / Middle East',
  'South Asia & GCC',
  'Worldwide',
]

export const USAGE_DURATION_OPTIONS = [
  '3 Months Digital',
  '6 Months Digital + Social',
  '1 Year Digital + TVC',
  '2 Years Full Media',
  '3 Years Regional',
  'Perpetual / Buyout',
]
