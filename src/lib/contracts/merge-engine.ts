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

export interface MergeTokenInfo {
  token: string
  label: string
  example: string
  description: string
}

export const AVAILABLE_MERGE_TOKENS: MergeTokenInfo[] = [
  {
    token: '{{talent_name}}',
    label: 'Talent Name',
    example: 'Zara Noor',
    description: 'Full legal/stage name of the booked actor or model',
  },
  {
    token: '{{client_name}}',
    label: 'Client / Brand',
    example: 'Khaadi Apparel Ltd',
    description: 'Corporate client or brand name hiring the talent',
  },
  {
    token: '{{agency_name}}',
    label: 'Agency Name',
    example: "Actor's Studio HQ",
    description: 'Representing management organization name',
  },
  {
    token: '{{project_name}}',
    label: 'Project Name',
    example: 'Eid Festive Campaign 2026',
    description: 'Commercial title or production name',
  },
  {
    token: '{{fee}}',
    label: 'Compensation Fee',
    example: 'PKR 450,000',
    description: 'Total agreed talent fee or gross compensation',
  },
  {
    token: '{{commission}}',
    label: 'Agency Commission',
    example: '20% (PKR 90,000)',
    description: 'Agency fee cut or master representation commission',
  },
  {
    token: '{{shoot_dates}}',
    label: 'Shoot Dates',
    example: '2026-10-15 to 2026-10-18',
    description: 'Dates of principal photography or rehearsal',
  },
  {
    token: '{{location}}',
    label: 'Production Location',
    example: 'Studio 4, Film City, Karachi',
    description: 'Set address, studio, or on-location city',
  },
  {
    token: '{{usage_rights}}',
    label: 'Usage Scope & Duration',
    example: '1 Year Digital + TVC Broadcast',
    description: 'License duration and usage rights parameters',
  },
  {
    token: '{{territory}}',
    label: 'Territory',
    example: 'Pakistan & GCC',
    description: 'Geographic region where media may be exhibited',
  },
  {
    token: '{{media}}',
    label: 'Media Channels',
    example: 'Social Media, OOH Billboards, Cinema & Broadcast TV',
    description: 'Broadcast and distribution mediums permitted',
  },
  {
    token: '{{start_date}}',
    label: 'Engagement Start',
    example: '2026-10-15',
    description: 'Commencement date of services',
  },
  {
    token: '{{end_date}}',
    label: 'Engagement End',
    example: '2026-10-18',
    description: 'Final date of service delivery',
  },
]

export function compileContractTemplate(templateMarkdown: string, data: MergeData): string {
  let compiled = templateMarkdown

  const replacements: Record<string, string> = {
    '{{talent_name}}': data.talent_name || '',
    '{{client_name}}': data.client_name || '',
    '{{agency_name}}': data.agency_name || '',
    '{{project_name}}': data.project_name || '',
    '{{fee}}': data.fee || '',
    '{{commission}}': data.commission || 'Standard Agency Cut',
    '{{shoot_dates}}': data.shoot_dates || '',
    '{{location}}': data.location || '',
    '{{usage_rights}}': data.usage_rights || '',
    '{{territory}}': data.territory || '',
    '{{media}}': data.media || '',
    '{{start_date}}': data.start_date || '',
    '{{end_date}}': data.end_date || '',
  }

  for (const [token, value] of Object.entries(replacements)) {
    compiled = compiled.replaceAll(token, value ?? '')
  }

  return compiled
}

export function extractTokensFromTemplate(templateMarkdown: string): string[] {
  const matches = templateMarkdown.match(/\{\{[a-zA-Z0-9_]+\}\}/g)
  if (!matches) return []
  return Array.from(new Set(matches))
}
