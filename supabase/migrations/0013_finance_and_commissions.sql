-- ============================================================
-- FINANCE, INVOICES & COMMISSION SCHEMA
-- Migration: 0013_finance_and_commissions.sql
-- ============================================================

DO $$ BEGIN
  CREATE TYPE invoice_status_enum AS ENUM (
    'draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM (
    'bank_transfer', 'stripe', 'jazzcash', 'easypaisa', 'cheque', 'cash', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_status_enum AS ENUM (
    'accrued', 'payable', 'paid'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Invoices Table
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

-- 2. Invoice Line Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    NUMERIC(8,2) NOT NULL DEFAULT 1.00,
  unit_price  NUMERIC(12,2) NOT NULL,
  line_total  NUMERIC(12,2) NOT NULL
);

-- 3. Payments Table (Tracking cash flow & partial settlements)
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

-- 4. Commission Records Table (Audit of agency vs. talent splits)
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

-- 5. Expenses Table (Operational & shoot expense tracking)
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
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_deal ON public.invoices(deal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON public.invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_org ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_commissions_org ON public.commission_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_commissions_talent ON public.commission_records(talent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_deal ON public.commission_records(deal_id);
CREATE INDEX IF NOT EXISTS idx_commissions_booking ON public.commission_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commission_records(status);

CREATE INDEX IF NOT EXISTS idx_expenses_org ON public.expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_booking ON public.expenses(booking_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);

-- RLS: Agency members access (multi-tenant org isolation)
DROP POLICY IF EXISTS "invoices_org_isolation" ON public.invoices;
CREATE POLICY "invoices_org_isolation" ON public.invoices
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "invoice_items_access" ON public.invoice_items;
CREATE POLICY "invoice_items_access" ON public.invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

DROP POLICY IF EXISTS "payments_org_isolation" ON public.payments;
CREATE POLICY "payments_org_isolation" ON public.payments
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "commission_records_org_isolation" ON public.commission_records;
CREATE POLICY "commission_records_org_isolation" ON public.commission_records
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "expenses_org_isolation" ON public.expenses;
CREATE POLICY "expenses_org_isolation" ON public.expenses
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

-- Talent can view their own payout commissions
DROP POLICY IF EXISTS "commissions_talent_view" ON public.commission_records;
CREATE POLICY "commissions_talent_view" ON public.commission_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.talent_profiles tp
      WHERE tp.id = commission_records.talent_id
        AND tp.user_id = auth.uid()
    )
  );

-- Clients can view invoices issued to them
DROP POLICY IF EXISTS "invoices_client_view" ON public.invoices;
CREATE POLICY "invoices_client_view" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = invoices.client_id
        AND c.portal_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "invoice_items_client_view" ON public.invoice_items;
CREATE POLICY "invoice_items_client_view" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.clients c ON c.id = i.client_id
      WHERE i.id = invoice_items.invoice_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- Initial seed data for Actors Studio HQ if organization exists
INSERT INTO public.invoices (
  id,
  organization_id,
  client_id,
  invoice_number,
  currency,
  subtotal,
  tax_rate,
  tax_amount,
  discount_amount,
  total_amount,
  amount_paid,
  status,
  due_date,
  payment_terms,
  notes
)
SELECT
  '11111111-1111-4111-8111-111111111101'::uuid,
  o.id,
  c.id,
  'INV-2026-1042',
  'PKR',
  1200000.00,
  0.00,
  0.00,
  0.00,
  1200000.00,
  600000.00,
  'partially_paid'::invoice_status_enum,
  (CURRENT_DATE + INTERVAL '15 days')::DATE,
  '50% Advance, 50% on Wrap',
  'Ramadan 2026 TVC Lead Performance & Usage License'
FROM public.organizations o
CROSS JOIN public.clients c
WHERE o.slug = 'actors-studio-hq' AND c.company_name ILIKE '%Shan%'
LIMIT 1
ON CONFLICT (organization_id, invoice_number) DO NOTHING;

-- Seed line items for the above invoice
INSERT INTO public.invoice_items (
  id,
  invoice_id,
  description,
  quantity,
  unit_price,
  line_total
)
SELECT
  '22222222-2222-4222-8222-222222222201'::uuid,
  '11111111-1111-4111-8111-111111111101'::uuid,
  'Lead Actor Performance Fee (Zara Noor) — 3 Shoot Days',
  1.00,
  1000000.00,
  1000000.00
WHERE EXISTS (SELECT 1 FROM public.invoices WHERE id = '11111111-1111-4111-8111-111111111101'::uuid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoice_items (
  id,
  invoice_id,
  description,
  quantity,
  unit_price,
  line_total
)
SELECT
  '22222222-2222-4222-8222-222222222202'::uuid,
  '11111111-1111-4111-8111-111111111101'::uuid,
  'Digital & Broadcast Media Usage Rights (1 Year Territory)',
  1.00,
  200000.00,
  200000.00
WHERE EXISTS (SELECT 1 FROM public.invoices WHERE id = '11111111-1111-4111-8111-111111111101'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Seed advance payment
INSERT INTO public.payments (
  id,
  organization_id,
  invoice_id,
  client_id,
  amount_paid,
  currency,
  payment_method,
  transaction_reference,
  payment_date,
  notes
)
SELECT
  '33333333-3333-4333-8333-333333333301'::uuid,
  i.organization_id,
  i.id,
  i.client_id,
  600000.00,
  'PKR',
  'bank_transfer'::payment_method_enum,
  'SCB-PKR-98471203',
  (CURRENT_DATE - INTERVAL '3 days')::DATE,
  'Advance 50% retainer paid via Standard Chartered Wire'
FROM public.invoices i
WHERE i.id = '11111111-1111-4111-8111-111111111101'::uuid
ON CONFLICT (id) DO NOTHING;
