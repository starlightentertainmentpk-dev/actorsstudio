import { createClient } from '@/lib/supabase/server'
import { Client, ClientContact, ClientNote, AgencyTask } from '@/types/client'

export async function getAgencyClients(orgId: string): Promise<Client[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*, contacts:client_contacts(*)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Error fetching agency clients:', error.message)
      return []
    }
    return (data || []) as unknown as Client[]
  } catch (err) {
    console.warn('Exception in getAgencyClients:', err)
    return []
  }
}

export async function getClientById(clientId: string): Promise<Client | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        contacts:client_contacts(*),
        notes:client_notes(*, author:users(id, email)),
        tasks:agency_tasks(*),
        producer_profile:producer_profiles(id, company_name, contact_email)
      `)
      .eq('id', clientId)
      .single()

    if (error) {
      console.warn('Error fetching client by id:', error.message)
      return null
    }
    return data as unknown as Client
  } catch (err) {
    console.warn('Exception in getClientById:', err)
    return null
  }
}

export async function getClientCastingCalls(producerProfileId?: string | null, orgId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase.from('casting_calls').select('*')
    if (producerProfileId) {
      query = query.eq('producer_id', producerProfileId)
    } else if (orgId) {
      query = query.eq('organization_id', orgId)
    } else {
      return []
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function getAvailableProducerProfiles() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('producer_profiles')
      .select('id, company_name, contact_email, contact_phone, city')
      .order('company_name', { ascending: true })

    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function getClientBriefs(clientId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('client_briefs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) return []
    return data || []
  } catch {
    return []
  }
}

