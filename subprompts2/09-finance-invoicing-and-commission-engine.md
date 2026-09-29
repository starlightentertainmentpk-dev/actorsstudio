# Sub-Prompt 09 — Multi-Currency Invoicing, Automated Commission Engine & Payment Tracking

**Phase:** Commercial & Financial Operations — Sub-Prompt 9 of 10  
**Depends on:** `06-deals-and-hold-system.md` (Deals & Bookings), `01-multi-tenant-organizations.md`  
**Delivers:** Configurable agency commission engine, multi-currency invoicing system, downloadable PDF invoices (`@react-pdf/renderer`), partial payment tracking, and financial analytics.

---

## 🎯 Architectural Context & Additive Strategy

Sections 30, 31, 32, 33, and 34 of `masterprompt1.md` specify an enterprise **Financial Operating Engine**:
1. **Automated Commission Engine:** Eliminates manual spreadsheet errors by automatically calculating financial splits upon booking confirmation:
   - **Gross Client Fee** (e.g. `PKR 500,000`)
   - **Agency Commission** (e.g. 20% = `PKR 100,000`)
   - **Agent Split** (e.g. 10% of agency commission = `PKR 10,000`)
   - **Talent Net Payout** (e.g. 80% = `PKR 400,000`)
   - Custom overrides per talent, per client, or per category.
2. **Multi-Currency Invoicing:** Supports standard currencies (`PKR`, `USD`, `AED`, `GBP`, `EUR`) with automatic invoice numbering (`INV-YYYY-XXXX`), tax calculation, discounts, and payment terms (`Net 15`, `Net 30`, `Due on Receipt`).
3. **High-Fidelity PDF Generation:** Utilizes `@react-pdf/renderer` (already installed in `package.json`) to dynamically render professional invoices with agency branding, remittance bank details, and line-item breakdowns.
4. **Payment & Balance Tracking:** Allows logging partial or full payments, tracking outstanding balance aging, and recording payment methods (`Bank Transfer`, `Stripe`, `JazzCash`, `EasyPaisa`).

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0013_finance_and_commissions.sql`

```sql
-- ============================================================
-- FINANCE, INVOICES & COMMISSION SCHEMA
-- ============================================================

CREATE TYPE invoice_status_enum AS ENUM (
  'draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled'
);

CREATE TYPE payment_method_enum AS ENUM (
  'bank_transfer', 'stripe', 'jazzcash', 'easypaisa', 'cheque', 'cash', 'other'
);

CREATE TYPE commission_status_enum AS ENUM ('accrued', 'payable', 'paid');

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id         UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number  TEXT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'PKR',
  subtotal        NUMERIC(12,2) NOT NULL,
  tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_amount    NUMERIC(12,2) NOT NULL,
  amount_paid     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status          invoice_status_enum NOT NULL DEFAULT 'draft',
  due_date        DATE NOT NULL,
  notes           TEXT,
  payment_terms   TEXT DEFAULT 'Net 30',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, invoice_number)
);

-- Invoice Line Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    NUMERIC(8,2) NOT NULL DEFAULT 1.00,
  unit_price  NUMERIC(12,2) NOT NULL,
  line_total  NUMERIC(12,2) NOT NULL
);

-- Payments Table (Tracking cash flow & partial settlements)
CREATE TABLE IF NOT EXISTS public.payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id            UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount_paid           NUMERIC(12,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'PKR',
  payment_method        payment_method_enum NOT NULL DEFAULT 'bank_transfer',
  transaction_reference TEXT,
  payment_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commission Records Table (Audit of agency vs. talent splits)
CREATE TABLE IF NOT EXISTS public.commission_records (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id                 UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  booking_id              UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  talent_id               UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  gross_amount            NUMERIC(12,2) NOT NULL,
  agency_commission_pct   NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  agency_commission_amount NUMERIC(12,2) NOT NULL,
  agent_commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  talent_net_amount       NUMERIC(12,2) NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'PKR',
  status                  commission_status_enum NOT NULL DEFAULT 'accrued',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id      UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  category        TEXT NOT NULL, -- travel | wardrobe | accommodation | production | marketing | other
  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'PKR',
  description     TEXT,
  receipt_url     TEXT,
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_commissions_talent ON public.commission_records(talent_id);

-- RLS: Agency members access
CREATE POLICY "invoices_org_isolation" ON public.invoices
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "invoice_items_access" ON public.invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

CREATE POLICY "payments_org_isolation" ON public.payments
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "commission_records_org_isolation" ON public.commission_records
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "expenses_org_isolation" ON public.expenses
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

-- Talent can view their own payout commissions
CREATE POLICY "commissions_talent_view" ON public.commission_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = commission_records.talent_id AND tp.user_id = auth.uid())
  );
```

---

### 2. Commission Calculation Engine

Create `src/lib/finance/commission.ts`:
```ts
export interface CommissionSplitInput {
  grossAmount: number
  agencyRatePct?: number // default 20%
  agentRatePctOfAgency?: number // default 10% of agency commission
  expensesDeducted?: number
}

export interface CommissionSplitResult {
  grossAmount: number
  agencyCommissionAmount: number
  agentCutAmount: number
  talentGrossAmount: number
  talentNetAmount: number
  effectiveTalentPct: number
}

export function calculateCommissionSplit(input: CommissionSplitInput): CommissionSplitResult {
  const agencyPct = input.agencyRatePct ?? 20.0
  const agentPctOfAgency = input.agentRatePctOfAgency ?? 10.0
  const expenses = input.expensesDeducted ?? 0

  const agencyCommissionAmount = (input.grossAmount * agencyPct) / 100
  const agentCutAmount = (agencyCommissionAmount * agentPctOfAgency) / 100
  const talentGrossAmount = input.grossAmount - agencyCommissionAmount
  const talentNetAmount = Math.max(0, talentGrossAmount - expenses)
  const effectiveTalentPct = (talentNetAmount / input.grossAmount) * 100

  return {
    grossAmount: input.grossAmount,
    agencyCommissionAmount: Math.round(agencyCommissionAmount * 100) / 100,
    agentCutAmount: Math.round(agentCutAmount * 100) / 100,
    talentGrossAmount: Math.round(talentGrossAmount * 100) / 100,
    talentNetAmount: Math.round(talentNetAmount * 100) / 100,
    effectiveTalentPct: Math.round(effectiveTalentPct * 10) / 10,
  }
}
```

---

### 3. Server Actions & Invoicing

Create `src/app/(dashboard)/agency/finance/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInvoiceAction(data: {
  orgId: string
  clientId: string
  dealId?: string
  currency: string
  dueDate: string
  paymentTerms: string
  items: { description: string; quantity: number; unitPrice: number }[]
  taxRate?: number
  discountAmount?: number
  notes?: string
}) {
  const supabase = await createClient()

  // 1. Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxRate = data.taxRate || 0
  const taxAmount = (subtotal * taxRate) / 100
  const discount = data.discountAmount || 0
  const totalAmount = Math.max(0, subtotal + taxAmount - discount)

  // 2. Generate sequential invoice number
  const year = new Date().getFullYear()
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const invoiceNumber = `INV-${year}-${randomSuffix}`

  // 3. Insert invoice
  const { data: inv, error: invError } = await supabase
    .from('invoices')
    .insert({
      organization_id: data.orgId,
      client_id: data.clientId,
      deal_id: data.dealId || null,
      invoice_number: invoiceNumber,
      currency: data.currency,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount_amount: discount,
      total_amount: totalAmount,
      due_date: data.dueDate,
      payment_terms: data.paymentTerms,
      notes: data.notes,
      status: 'draft',
    })
    .select('id')
    .single()

  if (invError) throw new Error(invError.message)

  // 4. Insert items
  const itemsToInsert = data.items.map((i) => ({
    invoice_id: inv.id,
    description: i.description,
    quantity: i.quantity,
    unit_price: i.unitPrice,
    line_total: i.quantity * i.unitPrice,
  }))

  await supabase.from('invoice_items').insert(itemsToInsert)

  revalidatePath('/agency/finance')
  return { success: true, invoiceId: inv.id, invoiceNumber }
}

export async function recordPaymentAction(data: {
  orgId: string
  invoiceId: string
  clientId: string
  amountPaid: number
  currency: string
  paymentMethod: string
  transactionReference?: string
  paymentDate: string
  notes?: string
}) {
  const supabase = await createClient()

  // 1. Insert payment record
  const { error: payError } = await supabase
    .from('payments')
    .insert({
      organization_id: data.orgId,
      invoice_id: data.invoiceId,
      client_id: data.clientId,
      amount_paid: data.amountPaid,
      currency: data.currency,
      payment_method: data.paymentMethod as any,
      transaction_reference: data.transactionReference,
      payment_date: data.paymentDate,
      notes: data.notes,
    })

  if (payError) throw new Error(payError.message)

  // 2. Update invoice amount_paid and status
  const { data: inv } = await supabase
    .from('invoices')
    .select('total_amount, amount_paid')
    .eq('id', data.invoiceId)
    .single()

  if (inv) {
    const newAmountPaid = Number(inv.amount_paid) + Number(data.amountPaid)
    const newStatus =
      newAmountPaid >= Number(inv.total_amount) ? 'paid' : 'partially_paid'

    await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.invoiceId)
  }

  revalidatePath('/agency/finance')
  return { success: true }
}
```

---

### 4. PDF Generation & Finance Dashboard UI

1. **PDF Invoice Document (`src/lib/pdf/invoice-pdf.tsx`):**
   - Utilizes `@react-pdf/renderer` (`Document`, `Page`, `Text`, `View`, `StyleSheet`) to build a clean corporate layout:
     - Header: Agency Logo, Agency Legal Name, Tax ID, Invoice Number, Issue Date, Due Date.
     - Bill To: Client Company Name, Attention To, Address, Billing Email.
     - Line Items Table: Description, Qty, Rate, Line Total.
     - Summary Box: Subtotal, Tax %, Discount, Total Due, Balance Paid, Balance Due.
     - Remittance Advice: Agency Bank Name, Account Title, IBAN, Swift Code.
2. **Finance Overview Dashboard (`src/app/(dashboard)/agency/finance/page.tsx`):**
   - Top Stat Cards:
     - **Total Invoiced** (e.g. `PKR 2,450,000`)
     - **Payments Collected** (e.g. `PKR 1,800,000`)
     - **Outstanding Aging** (e.g. `PKR 650,000` with 30d/60d breakdown)
     - **Agency Revenue Earned** (e.g. `PKR 360,000`)
     - **Talent Payouts Pending** (e.g. `PKR 1,440,000`)
   - Tabs: `All Invoices`, `Payments Recorded`, `Commission Ledger`, `Expenses`.
3. **Record Payment Modal (`src/components/features/finance/RecordPaymentModal.tsx`):**
   - Displays invoice total and remaining balance.
   - Input for Amount Paid, Date, Payment Method (`Bank Transfer`, `Stripe`, `JazzCash`, `Cash`), and Transaction Reference.
4. **Talent Earnings Statement (`src/app/(dashboard)/talent/earnings/page.tsx`):**
   - Talent can view their historical completed shoots, gross fee, agency commission deducted, and net payout status (`accrued`, `payable`, `paid`).

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0013_finance_and_commissions.sql` without errors.
- [ ] Create an invoice for `PKR 300,000` with 2 line items for a client.
- [ ] Record a partial payment of `PKR 150,000`; verify the invoice status transitions to `partially_paid` with balance `PKR 150,000`.
- [ ] Record the remaining `PKR 150,000`; verify the invoice status transitions to `paid`.
- [ ] Trigger PDF generation and verify `@react-pdf/renderer` outputs a downloadable invoice document.
- [ ] Log in as talent and confirm `/talent/earnings` accurately reflects payout splits without exposing confidential agency margins.
