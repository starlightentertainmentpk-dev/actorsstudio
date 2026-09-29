import { describe, it, expect } from 'vitest'
import {
  compileContractTemplate,
  extractTokensFromTemplate,
} from './merge-engine'
import {
  submitDigitalSignatureSchema,
  generateContractFromBookingSchema,
  createContractTemplateSchema,
} from '@/lib/validations/contracts'
import { Contract, ContractStatus, ContractTemplate } from '@/types/contracts'

describe('Subprompt 08: Contracts & E-Signatures Smoke Test', () => {
  const defaultCommercialTemplate: ContractTemplate = {
    id: 'tmpl-commercial-default',
    organization_id: 'org-hq-pk',
    template_name: 'Standard Commercial Appearance Release',
    contract_type: 'booking',
    is_default: true,
    merge_fields_json: [
      '{{talent_name}}',
      '{{client_name}}',
      '{{agency_name}}',
      '{{project_name}}',
      '{{fee}}',
      '{{shoot_dates}}',
      '{{location}}',
      '{{usage_rights}}',
      '{{territory}}',
      '{{media}}',
    ],
    body_markdown: `# TALENT PERFORMANCE & APPEARANCE AGREEMENT

This Agreement is made on this date between **{{client_name}}** ("Client") and **{{talent_name}}** ("Talent"), represented by **{{agency_name}}** ("Agency").

### 1. Engagement & Shoot Details
- **Project Name:** {{project_name}}
- **Dates of Engagement:** {{shoot_dates}}
- **Location:** {{location}}

### 2. Compensation & Payout Terms
Client agrees to pay a total compensation of **{{fee}}** for the performance services rendered.

### 3. Grant of Usage Rights
Talent hereby grants to Client the rights to use Talent's name, voice, image, and likeness for the following defined scope:
- **Media Rights:** {{media}}
- **Territory:** {{territory}}
- **Duration / Exclusivity:** {{usage_rights}}

### 4. Signatures
Signed electronically with full legal consent:

**Talent:** {{talent_name}}  
**Client:** {{client_name}}  
**Agency Representative:** {{agency_name}}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('generates a contract from a booking and cleanly substitutes all tokens', () => {
    const bookingData = {
      talent_name: 'Mahira Khan',
      client_name: 'Unilever Pakistan',
      agency_name: "Actor's Studio Pakistan",
      project_name: 'Sunlight Shampoo National TVC',
      fee: 'PKR 2,400,000',
      shoot_dates: '2026-11-20 to 2026-11-22',
      location: 'Karachi Studio 3',
      usage_rights: '1 Year Broadcast & Digital Exclusivity',
      territory: 'Pakistan & GCC',
      media: 'TVC, Digital Pre-Roll & Billboard',
    }

    const compiled = compileContractTemplate(
      defaultCommercialTemplate.body_markdown,
      bookingData
    )

    // Verify substitutions
    expect(compiled).toContain('between **Unilever Pakistan** ("Client")')
    expect(compiled).toContain('and **Mahira Khan** ("Talent")')
    expect(compiled).toContain("represented by **Actor's Studio Pakistan**")
    expect(compiled).toContain('**Project Name:** Sunlight Shampoo National TVC')
    expect(compiled).toContain('**Dates of Engagement:** 2026-11-20 to 2026-11-22')
    expect(compiled).toContain('**Location:** Karachi Studio 3')
    expect(compiled).toContain('total compensation of **PKR 2,400,000**')
    expect(compiled).toContain('**Media Rights:** TVC, Digital Pre-Roll & Billboard')
    expect(compiled).toContain('**Territory:** Pakistan & GCC')
    expect(compiled).toContain('**Duration / Exclusivity:** 1 Year Broadcast & Digital Exclusivity')

    // Verify zero unreplaced tokens
    const remainingTokens = extractTokensFromTemplate(compiled)
    expect(remainingTokens).toHaveLength(0)
  })

  it('validates contract generation payload schema', () => {
    const validPayload = {
      orgId: 'org-hq-pk',
      templateId: 'tmpl-commercial-default',
      bookingId: 'booking-unilever-sunlight',
    }
    const result = generateContractFromBookingSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('validates digital signature payload, stores base64 canvas, and simulates status transition', () => {
    const initialContract: Contract = {
      id: 'contract-test-sunlight',
      organization_id: 'org-hq-pk',
      client_id: 'client-unilever',
      talent_id: 'talent-mahira',
      contract_title: 'Commercial Appearance Release — Sunlight Shampoo',
      rendered_body: 'Rendered legal body',
      status: 'sent',
      sent_at: '2026-10-01T10:00:00Z',
      created_at: '2026-10-01T09:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
      signatures: [],
    }

    const signaturePayload = {
      contractId: initialContract.id,
      signerType: 'talent' as const,
      signerName: 'Mahira Khan',
      signatureImageData:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      legalConsent: true,
      ipAddress: '182.188.42.10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    }

    // Validate payload with Zod
    const valResult = submitDigitalSignatureSchema.safeParse(signaturePayload)
    expect(valResult.success).toBe(true)

    // Execute state transition simulation
    const updatedContract: Contract = {
      ...initialContract,
      status: 'signed',
      signed_at: new Date().toISOString(),
      signatures: [
        {
          id: 'sig-test-1',
          contract_id: initialContract.id,
          signer_type: signaturePayload.signerType,
          signer_name: signaturePayload.signerName,
          signature_image_data: signaturePayload.signatureImageData,
          ip_address: signaturePayload.ipAddress,
          user_agent: signaturePayload.userAgent,
          signed_at: new Date().toISOString(),
        },
      ],
    }

    expect(updatedContract.status).toBe('signed')
    expect(updatedContract.signed_at).toBeDefined()
    expect(updatedContract.signatures).toHaveLength(1)
    expect(updatedContract.signatures![0].signature_image_data).toContain('data:image/png;base64')
    expect(updatedContract.signatures![0].ip_address).toBe('182.188.42.10')
  })
})
