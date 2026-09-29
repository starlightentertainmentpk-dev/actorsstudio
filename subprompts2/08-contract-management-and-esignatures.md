# Sub-Prompt 08 — Dynamic Contract Templates, Merge Variables, Lifecycle & E-Signature Abstraction

**Phase:** Commercial & Legal Operations — Sub-Prompt 8 of 10  
**Depends on:** `06-deals-and-hold-system.md` (Deals & Bookings), `01-multi-tenant-organizations.md`  
**Delivers:** Dynamic contract template engine with token replacement (`{{talent_name}}`, `{{fee}}`), full contract lifecycle management, digital e-signature signing portal with immutable audit logging, and a central agency document vault.

---

## 🎯 Architectural Context & Additive Strategy

Sections 28, 44, and 86 of `masterprompt1.md` specify a comprehensive **Contract & Document Management Suite**:
1. **Dynamic Variable Templates:** Agencies store reusable contract templates (e.g., *Actor Representation Agreement*, *Commercial Release Form*, *Usage Rights Agreement*, *Standard NDA*) containing dynamic placeholders:
   `{{talent_name}}`, `{{client_name}}`, `{{project_name}}`, `{{fee}}`, `{{commission}}`, `{{shoot_dates}}`, `{{usage_rights}}`, `{{territory}}`.
2. **Merge Engine:** Automatically compiles deal, booking, and talent records into an executed contract markdown/HTML document.
3. **Contract Lifecycle:** `Draft` → `Sent` → `Viewed` → `Signed` → `Rejected` → `Expired`.
4. **E-Signature Provider Abstraction:** Designed with a clean interface (`SignatureProvider`) so external providers (DocuSign, Dropbox Sign) can be plugged in, while delivering a compliant **native in-app signing canvas** that logs signer name, IP address, timestamp, and signature vector data.
5. **Central Document Library:** Unified vault at `/agency/documents` organizing files into Contracts, Client Agreements, Talent Docs, and Production Briefs with secure signed URLs.

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0012_contracts_and_documents.sql`

```sql
-- ============================================================
-- CONTRACTS, TEMPLATES & DOCUMENTS SCHEMA
-- ============================================================

CREATE TYPE contract_status_enum AS ENUM (
  'draft', 'sent', 'viewed', 'signed', 'rejected', 'expired'
);

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
CREATE INDEX idx_contracts_org ON public.contracts(organization_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_signatures_contract ON public.contract_signatures(contract_id);
CREATE INDEX idx_docs_org_cat ON public.agency_documents(organization_id, category);

-- RLS: Agency members access
CREATE POLICY "templates_org_isolation" ON public.contract_templates
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "contracts_org_isolation" ON public.contracts
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "documents_org_isolation" ON public.agency_documents
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

-- RLS: Talent can view contracts assigned to them
CREATE POLICY "contracts_talent_view" ON public.contracts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = contracts.talent_id AND tp.user_id = auth.uid())
    AND status IN ('sent', 'viewed', 'signed')
  );

-- RLS: Signatures viewable by contract parties
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

-- Seed Default Model & Commercial Release Template
INSERT INTO public.contract_templates (
  organization_id,
  template_name,
  contract_type,
  body_markdown,
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
  TRUE
FROM public.organizations
WHERE slug = 'actors-studio-hq'
ON CONFLICT DO NOTHING;
```

---

### 2. Dynamic Variable Merge Engine

Create `src/lib/contracts/merge-engine.ts`:
```ts
export interface MergeData {
  talent_name: string
  client_name: string
  agency_name: string
  project_name: string
  fee: string
  commission?: string
  shoot_dates: string
  location: string
  usage_rights: string
  territory: string
  media: string
  start_date?: string
  end_date?: string
}

export function compileContractTemplate(templateMarkdown: string, data: MergeData): string {
  let compiled = templateMarkdown

  const replacements: Record<string, string> = {
    '{{talent_name}}': data.talent_name,
    '{{client_name}}': data.client_name,
    '{{agency_name}}': data.agency_name,
    '{{project_name}}': data.project_name,
    '{{fee}}': data.fee,
    '{{commission}}': data.commission || 'Standard Agency Cut',
    '{{shoot_dates}}': data.shoot_dates,
    '{{location}}': data.location,
    '{{usage_rights}}': data.usage_rights,
    '{{territory}}': data.territory,
    '{{media}}': data.media,
    '{{start_date}}': data.start_date || '',
    '{{end_date}}': data.end_date || '',
  }

  for (const [token, value] of Object.entries(replacements)) {
    compiled = compiled.replaceAll(token, value || '')
  }

  return compiled
}
```

---

### 3. Server Actions & Digital Signing

Create `src/app/(dashboard)/agency/contracts/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { compileContractTemplate } from '@/lib/contracts/merge-engine'
import { revalidatePath } from 'next/cache'

export async function generateContractFromBookingAction(data: {
  orgId: string
  templateId: string
  bookingId: string
}) {
  const supabase = await createClient()

  // 1. Fetch template
  const { data: template } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', data.templateId)
    .single()

  // 2. Fetch booking, client, talent, organization
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      client:clients(company_name),
      talent:talent_profiles(full_name),
      org:organizations(name)
    `)
    .eq('id', data.bookingId)
    .single()

  if (!template || !booking) throw new Error('Template or booking not found')

  // 3. Compile variables
  const rendered = compileContractTemplate(template.body_markdown, {
    talent_name: (booking.talent as any).full_name,
    client_name: (booking.client as any).company_name,
    agency_name: (booking.org as any).name,
    project_name: booking.project_name,
    fee: `${booking.currency} ${Number(booking.fee_amount).toLocaleString()}`,
    shoot_dates: `${booking.shoot_date_start} to ${booking.shoot_date_end}`,
    location: booking.location_address || 'To be confirmed',
    usage_rights: booking.usage_rights,
    territory: booking.territory,
    media: booking.media,
  })

  // 4. Insert contract
  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      organization_id: data.orgId,
      deal_id: booking.deal_id,
      booking_id: booking.id,
      client_id: booking.client_id,
      talent_id: booking.talent_id,
      contract_title: `${template.template_name} — ${booking.project_name}`,
      rendered_body: rendered,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/agency/contracts')
  return { success: true, contractId: contract.id }
}

export async function submitDigitalSignatureAction(contractId: string, signerData: {
  signerType: 'talent' | 'client'
  signerName: string
  signatureImageData: string
  ipAddress?: string
  userAgent?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Insert signature record
  const { error: sigError } = await supabase
    .from('contract_signatures')
    .insert({
      contract_id: contractId,
      signer_type: signerData.signerType,
      signer_user_id: user?.id || null,
      signer_name: signerData.signerName,
      signature_image_data: signerData.signatureImageData,
      ip_address: signerData.ipAddress,
      user_agent: signerData.userAgent,
    })

  if (sigError) throw new Error(sigError.message)

  // 2. Mark contract as signed
  await supabase
    .from('contracts')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
    })
    .eq('id', contractId)

  revalidatePath(`/contracts/${contractId}`)
  return { success: true }
}
```

---

### 4. Contract Builder & Signing UI

1. **Contracts Management Dashboard (`src/app/(dashboard)/agency/contracts/page.tsx`):**
   - KPI Bar: Total Active Contracts, Awaiting Talent Signature, Awaiting Client Signature, Executed.
   - List View: Contract Title, Project, Talent, Client, Status Badge (`Draft`, `Sent`, `Signed`).
   - "Generate Contract" Modal: Select Deal / Booking → Select Template → Preview dynamically rendered text → "Send for E-Signature".
2. **Template Manager (`src/app/(dashboard)/agency/contracts/templates/page.tsx`):**
   - Editor for markdown templates with a side cheat sheet of available dynamic tokens (`{{talent_name}}`, `{{fee}}`, etc.).
3. **Public Signing Portal (`src/app/(public)/contracts/[id]/sign/page.tsx`):**
   - Clean, focused layout designed for mobile and desktop signing.
   - Complete contract document preview.
   - Signer Confirmation Block: Full Legal Name input.
   - HTML5 Canvas Signature Pad: Smooth freehand drawing with "Clear" and "Adopt Signature" controls.
   - Legal acknowledgment checkbox: "I agree that my electronic signature is the legal equivalent of my manual signature."
   - "Sign & Finalize Agreement" button.
4. **Central Document Library (`src/app/(dashboard)/agency/documents/page.tsx`):**
   - Folder tabs: `Contracts`, `Client Briefs`, `Tax & Passports`, `Comp Cards`.
   - File upload dropzone with signed URL generation for secure viewing and downloading.

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0012_contracts_and_documents.sql` successfully.
- [ ] From an existing booking, generate a contract using the default commercial appearance release template.
- [ ] Verify all variables (`{{talent_name}}`, `{{project_name}}`, `{{fee}}`) are substituted cleanly.
- [ ] Open the signing page `/contracts/[id]/sign` as the talent, draw signature on canvas, and click Submit.
- [ ] Verify `contract_signatures` stores the base64 image and timestamp, and contract status transitions to `signed`.
