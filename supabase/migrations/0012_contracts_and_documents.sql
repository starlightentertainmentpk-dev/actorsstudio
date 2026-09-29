-- ============================================================
-- CONTRACTS, TEMPLATES & DOCUMENTS SCHEMA
-- Migration: 0012_contracts_and_documents.sql
-- ============================================================

DO $$ BEGIN
  CREATE TYPE contract_status_enum AS ENUM (
    'draft', 'sent', 'viewed', 'signed', 'rejected', 'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Contract Templates Table
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_name     TEXT NOT NULL,
  contract_type     TEXT NOT NULL, -- representation | booking | model_release | nda | usage_rights
  body_markdown     TEXT NOT NULL,
  merge_fields_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contracts Table
CREATE TABLE IF NOT EXISTS public.contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id           UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  booking_id        UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  talent_id         UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  contract_title    TEXT NOT NULL,
  rendered_body     TEXT NOT NULL,
  status            contract_status_enum NOT NULL DEFAULT 'draft',
  file_storage_path TEXT,
  sent_at           TIMESTAMPTZ,
  viewed_at         TIMESTAMPTZ,
  signed_at         TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contract Signatures & Legal Audit Trail
CREATE TABLE IF NOT EXISTS public.contract_signatures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id           UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_type           TEXT NOT NULL, -- talent | client | agency_witness
  signer_user_id        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  signer_name           TEXT NOT NULL,
  signature_image_data  TEXT NOT NULL, -- base64 png canvas
  ip_address            TEXT,
  user_agent            TEXT,
  signed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Central Agency Documents Vault
CREATE TABLE IF NOT EXISTS public.agency_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category            TEXT NOT NULL, -- contract | invoice | talent_doc | client_doc | legal | production
  title               TEXT NOT NULL,
  file_storage_path   TEXT NOT NULL,
  file_size_bytes     BIGINT,
  mime_type           TEXT,
  uploaded_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_private          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_documents ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_org ON public.contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_talent ON public.contracts(talent_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_booking ON public.contracts(booking_id);
CREATE INDEX IF NOT EXISTS idx_signatures_contract ON public.contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_docs_org_cat ON public.agency_documents(organization_id, category);

-- RLS: Agency members access
DROP POLICY IF EXISTS "templates_org_isolation" ON public.contract_templates;
CREATE POLICY "templates_org_isolation" ON public.contract_templates
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "contracts_org_isolation" ON public.contracts;
CREATE POLICY "contracts_org_isolation" ON public.contracts
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "documents_org_isolation" ON public.agency_documents;
CREATE POLICY "documents_org_isolation" ON public.agency_documents
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

-- RLS: Talent can view contracts assigned to them
DROP POLICY IF EXISTS "contracts_talent_view" ON public.contracts;
CREATE POLICY "contracts_talent_view" ON public.contracts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = contracts.talent_id AND tp.user_id = auth.uid())
    AND status IN ('sent', 'viewed', 'signed')
  );

-- RLS: Signatures viewable by contract parties
DROP POLICY IF EXISTS "signatures_view" ON public.contract_signatures;
CREATE POLICY "signatures_view" ON public.contract_signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_signatures.contract_id
        AND (
          c.organization_id IN (SELECT public.get_auth_user_org_ids())
          OR EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = c.talent_id AND tp.user_id = auth.uid())
        )
    )
  );

-- RLS: Allow signing of contracts (insert signature)
DROP POLICY IF EXISTS "signatures_insert" ON public.contract_signatures;
CREATE POLICY "signatures_insert" ON public.contract_signatures
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_signatures.contract_id
    )
  );

-- Seed Default Model & Commercial Release Template
INSERT INTO public.contract_templates (
  organization_id,
  template_name,
  contract_type,
  body_markdown,
  merge_fields_json,
  is_default
)
SELECT
  id,
  'Standard Commercial Appearance Release',
  'booking',
  '# TALENT PERFORMANCE & APPEARANCE AGREEMENT

This Agreement is made on this date between **{{client_name}}** ("Client") and **{{talent_name}}** ("Talent"), represented by **{{agency_name}}** ("Agency").

### 1. Engagement & Shoot Details
- **Project Name:** {{project_name}}
- **Dates of Engagement:** {{shoot_dates}}
- **Location:** {{location}}

### 2. Compensation & Payout Terms
Client agrees to pay a total compensation of **{{fee}}** for the performance services rendered. Agency commission is calculated according to the master representation terms.

### 3. Grant of Usage Rights
Talent hereby grants to Client the rights to use Talent''s name, voice, image, and likeness for the following defined scope:
- **Media Rights:** {{media}}
- **Territory:** {{territory}}
- **Duration / Exclusivity:** {{usage_rights}}

### 4. Signatures
Signed electronically with full legal consent:

**Talent:** {{talent_name}}  
**Client:** {{client_name}}  
**Agency Representative:** {{agency_name}}',
  '["talent_name", "client_name", "agency_name", "project_name", "fee", "shoot_dates", "location", "usage_rights", "territory", "media"]'::jsonb,
  TRUE
FROM public.organizations
WHERE slug = 'actors-studio-hq'
ON CONFLICT DO NOTHING;

-- Also seed Actor Representation Agreement
INSERT INTO public.contract_templates (
  organization_id,
  template_name,
  contract_type,
  body_markdown,
  merge_fields_json,
  is_default
)
SELECT
  id,
  'Exclusive Talent Representation Agreement',
  'representation',
  '# EXCLUSIVE TALENT REPRESENTATION AGREEMENT

This Exclusive Agency Representation Agreement is entered into between **{{agency_name}}** ("Agency") and **{{talent_name}}** ("Talent").

### 1. Representation Scope & Authority
Talent hereby appoints Agency as their exclusive management representative for commercial, theatrical, broadcast, print, and digital engagements within **{{territory}}**.

### 2. Term & Territory
- **Effective Dates:** {{shoot_dates}}
- **Territory Scope:** {{territory}}

### 3. Commissions & Fees
Agency will collect an agreed representation commission of **{{commission}}** from gross earnings for bookings secured. Talent will receive net payout of **{{fee}}** or remainder as specified per booking statement.

### 4. Standard Covenants & Exclusivity
Talent warrants that they are free to enter into this agreement and have no conflicting representation agreements in the specified territory.

### 5. Signatures
**Talent:** {{talent_name}}  
**Agency Officer:** {{agency_name}}',
  '["talent_name", "agency_name", "territory", "shoot_dates", "commission", "fee"]'::jsonb,
  FALSE
FROM public.organizations
WHERE slug = 'actors-studio-hq'
ON CONFLICT DO NOTHING;
