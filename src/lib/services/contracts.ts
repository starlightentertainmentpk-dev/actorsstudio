import { createClient } from '@/lib/supabase/server'
import {
  Contract,
  ContractTemplate,
  ContractSignature,
  AgencyDocument,
  ContractStatus,
  DocumentCategory,
} from '@/types/contracts'

export async function getAgencyContracts(
  orgId: string,
  filter?: { status?: ContractStatus; talentId?: string; clientId?: string }
): Promise<Contract[]> {
  try {
    const supabase = await createClient()
    let query = (supabase.from('contracts' as any) as any)
      .select(`
        *,
        client:clients(id, company_name, contact_name, email),
        talent:talent_profiles(id, full_name, stage_name, email, phone),
        deal:deals(id, deal_name, deal_value),
        booking:bookings(id, project_name, shoot_date_start, shoot_date_end, fee_amount, currency),
        signatures:contract_signatures(*)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (filter?.status) {
      query = query.eq('status', filter.status)
    }
    if (filter?.talentId) {
      query = query.eq('talent_id', filter.talentId)
    }
    if (filter?.clientId) {
      query = query.eq('client_id', filter.clientId)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Error fetching agency contracts:', error.message)
      return []
    }
    return (data || []) as Contract[]
  } catch (err) {
    console.warn('Exception in getAgencyContracts:', err)
    return []
  }
}

export async function getContractById(contractId: string): Promise<Contract | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('contracts' as any) as any)
      .select(`
        *,
        client:clients(id, company_name, contact_name, email),
        talent:talent_profiles(id, full_name, stage_name, email, phone),
        deal:deals(id, deal_name, deal_value),
        booking:bookings(id, project_name, shoot_date_start, shoot_date_end, fee_amount, currency),
        organization:organizations(id, name, logo_url),
        signatures:contract_signatures(*)
      `)
      .eq('id', contractId)
      .single()

    if (error) {
      console.warn('Error fetching contract by id:', error.message)
      return null
    }
    return data as Contract
  } catch (err) {
    console.warn('Exception in getContractById:', err)
    return null
  }
}

export async function getAgencyContractTemplates(orgId: string): Promise<ContractTemplate[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('contract_templates' as any) as any)
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Error fetching contract templates:', error.message)
      return []
    }
    return (data || []) as ContractTemplate[]
  } catch (err) {
    console.warn('Exception in getAgencyContractTemplates:', err)
    return []
  }
}

export async function getContractTemplateById(templateId: string): Promise<ContractTemplate | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('contract_templates' as any) as any)
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) {
      console.warn('Error fetching contract template by id:', error.message)
      return null
    }
    return data as ContractTemplate
  } catch (err) {
    console.warn('Exception in getContractTemplateById:', err)
    return null
  }
}

export async function getContractKPIs(orgId: string) {
  try {
    const contracts = await getAgencyContracts(orgId)

    const totalActive = contracts.filter(c => ['draft', 'sent', 'viewed'].includes(c.status)).length
    const awaitingTalent = contracts.filter(c => {
      if (!['sent', 'viewed'].includes(c.status)) return false
      const hasTalentSig = c.signatures?.some(s => s.signer_type === 'talent')
      return !hasTalentSig
    }).length
    const awaitingClient = contracts.filter(c => {
      if (!['sent', 'viewed'].includes(c.status)) return false
      const hasClientSig = c.signatures?.some(s => s.signer_type === 'client')
      return !hasClientSig
    }).length
    const executed = contracts.filter(c => c.status === 'signed').length
    const rejected = contracts.filter(c => c.status === 'rejected').length

    return {
      total: contracts.length,
      totalActive,
      awaitingTalent,
      awaitingClient,
      executed,
      rejected,
    }
  } catch (err) {
    console.warn('Exception in getContractKPIs:', err)
    return {
      total: 0,
      totalActive: 0,
      awaitingTalent: 0,
      awaitingClient: 0,
      executed: 0,
      rejected: 0,
    }
  }
}

export async function getAgencyDocuments(
  orgId: string,
  category?: DocumentCategory
): Promise<AgencyDocument[]> {
  try {
    const supabase = await createClient()
    let query = (supabase.from('agency_documents' as any) as any)
      .select(`
        *,
        uploader:users(id, email)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Error fetching agency documents:', error.message)
      return []
    }

    return (data || []).map((doc: any) => ({
      ...doc,
      uploader_name: doc.uploader?.email || 'Agency Team',
    })) as AgencyDocument[]
  } catch (err) {
    console.warn('Exception in getAgencyDocuments:', err)
    return []
  }
}
