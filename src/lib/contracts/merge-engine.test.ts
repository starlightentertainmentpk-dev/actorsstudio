import { describe, it, expect } from 'vitest'
import {
  compileContractTemplate,
  extractTokensFromTemplate,
  AVAILABLE_MERGE_TOKENS,
  MergeData,
} from './merge-engine'

describe('Contract Template Merge Engine', () => {
  const sampleTemplate = `
# TALENT PERFORMANCE & APPEARANCE AGREEMENT
Client: {{client_name}}
Talent: {{talent_name}}
Agency: {{agency_name}}
Project: {{project_name}}
Compensation: {{fee}}
Commission: {{commission}}
Dates: {{shoot_dates}}
Location: {{location}}
Usage: {{usage_rights}}
Territory: {{territory}}
Media: {{media}}
Term: {{start_date}} to {{end_date}}
`

  const sampleData: MergeData = {
    talent_name: 'Humayun Saeed',
    client_name: 'Shan Foods Ltd',
    agency_name: "Actor's Studio Pakistan",
    project_name: 'Biryani Spice TVC 2026',
    fee: 'PKR 1,500,000',
    commission: '20% (PKR 300,000)',
    shoot_dates: '2026-11-01 to 2026-11-04',
    location: 'Karachi, Studio B',
    usage_rights: '2 Years Broadcast + Digital',
    territory: 'Worldwide',
    media: 'TV, YouTube, Billboards',
    start_date: '2026-11-01',
    end_date: '2026-11-04',
  }

  it('substitutes all dynamic tokens cleanly', () => {
    const rendered = compileContractTemplate(sampleTemplate, sampleData)

    expect(rendered).toContain('Client: Shan Foods Ltd')
    expect(rendered).toContain('Talent: Humayun Saeed')
    expect(rendered).toContain("Agency: Actor's Studio Pakistan")
    expect(rendered).toContain('Project: Biryani Spice TVC 2026')
    expect(rendered).toContain('Compensation: PKR 1,500,000')
    expect(rendered).toContain('Commission: 20% (PKR 300,000)')
    expect(rendered).toContain('Dates: 2026-11-01 to 2026-11-04')
    expect(rendered).toContain('Location: Karachi, Studio B')
    expect(rendered).toContain('Usage: 2 Years Broadcast + Digital')
    expect(rendered).toContain('Territory: Worldwide')
    expect(rendered).toContain('Media: TV, YouTube, Billboards')
    expect(rendered).toContain('Term: 2026-11-01 to 2026-11-04')

    // Confirm no raw curly tokens remain
    expect(rendered).not.toContain('{{')
    expect(rendered).not.toContain('}}')
  })

  it('falls back cleanly if optional commission or dates are missing', () => {
    const sparseData: MergeData = {
      talent_name: 'Mahira Khan',
      client_name: 'PepsiCo',
      agency_name: "Actor's Studio",
      project_name: 'Cricket World Cup Anthem',
      fee: 'PKR 3,000,000',
      shoot_dates: '2026-12-01',
      location: 'Lahore Stadium',
      usage_rights: '1 Year Digital',
      territory: 'Pakistan',
      media: 'Social Media',
    }

    const rendered = compileContractTemplate(sampleTemplate, sparseData)
    expect(rendered).toContain('Commission: Standard Agency Cut')
    expect(rendered).toContain('Talent: Mahira Khan')
    expect(rendered).not.toContain('{{talent_name}}')
  })

  it('extracts unique tokens from template body', () => {
    const tokens = extractTokensFromTemplate(
      'Agreement between {{talent_name}} and {{client_name}} for {{talent_name}} in {{territory}}'
    )
    expect(tokens).toEqual(['{{talent_name}}', '{{client_name}}', '{{territory}}'])
  })

  it('exports available tokens list with descriptions', () => {
    expect(AVAILABLE_MERGE_TOKENS.length).toBeGreaterThanOrEqual(10)
    const tokenNames = AVAILABLE_MERGE_TOKENS.map(t => t.token)
    expect(tokenNames).toContain('{{talent_name}}')
    expect(tokenNames).toContain('{{fee}}')
    expect(tokenNames).toContain('{{shoot_dates}}')
  })
})
