export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled'

export type PaymentMethod =
  | 'bank_transfer'
  | 'stripe'
  | 'jazzcash'
  | 'easypaisa'
  | 'cheque'
  | 'cash'
  | 'other'

export type CommissionStatus = 'accrued' | 'payable' | 'paid'

export type CurrencyCode = 'PKR' | 'USD' | 'AED' | 'GBP' | 'EUR'

export type ExpenseCategory =
  | 'travel'
  | 'wardrobe'
  | 'accommodation'
  | 'production'
  | 'marketing'
  | 'other'

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface Invoice {
  id: string
  organization_id: string
  deal_id?: string | null
  client_id: string
  invoice_number: string
  currency: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  amount_paid: number
  status: InvoiceStatus
  due_date: string
  notes?: string | null
  payment_terms: string
  created_at: string
  updated_at: string

  // Joined fields
  client?: {
    id: string
    company_name: string
    billing_email?: string
    address?: string
    city?: string
    country?: string
    phone?: string
  }
  deal?: {
    id: string
    deal_name: string
  }
  items?: InvoiceItem[]
  payments?: Payment[]
}

export interface Payment {
  id: string
  organization_id: string
  invoice_id: string
  client_id: string
  amount_paid: number
  currency: string
  payment_method: PaymentMethod
  transaction_reference?: string | null
  payment_date: string
  notes?: string | null
  created_at: string

  // Joined fields
  client?: {
    id: string
    company_name: string
  }
  invoice?: {
    id: string
    invoice_number: string
    total_amount: number
  }
}

export interface CommissionRecord {
  id: string
  organization_id: string
  deal_id?: string | null
  booking_id?: string | null
  talent_id: string
  gross_amount: number
  agency_commission_pct: number
  agency_commission_amount: number
  agent_commission_amount: number
  talent_net_amount: number
  currency: string
  status: CommissionStatus
  created_at: string

  // Joined fields
  talent?: {
    id: string
    full_name: string
    stage_name?: string
    avatar_url?: string | null
  }
  deal?: {
    id: string
    deal_name: string
  }
  booking?: {
    id: string
    project_name: string
    shoot_date_start: string
    shoot_date_end: string
  }
}

export interface Expense {
  id: string
  organization_id: string
  booking_id?: string | null
  category: ExpenseCategory | string
  amount: number
  currency: string
  description?: string | null
  receipt_url?: string | null
  expense_date: string
  created_at: string

  // Joined fields
  booking?: {
    id: string
    project_name: string
  }
}

export interface AgingBuckets {
  current30Days: number
  days31To60: number
  days61Plus: number
  overdueTotal: number
}

export interface FinanceOverviewStats {
  totalInvoiced: number
  paymentsCollected: number
  outstandingBalance: number
  collectionRatePct: number
  agencyRevenueEarned: number
  talentPayoutsPending: number
  totalExpenses: number
  netProfit: number
  aging: AgingBuckets
}

export interface TalentEarningItem {
  id: string
  commission_record_id: string
  booking_id?: string | null
  deal_id?: string | null
  project_name: string
  client_name: string
  shoot_dates: string
  gross_fee: number
  agency_commission_pct: number
  agency_commission_deducted: number
  talent_net_payout: number
  currency: string
  status: CommissionStatus
  created_at: string
  paid_at?: string | null
}
