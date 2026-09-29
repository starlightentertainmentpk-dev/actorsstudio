import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Organization, OrganizationMember } from '@/types/organization'

export async function getUserOrganizations(): Promise<Organization[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(*)')
      .eq('user_id', user.id)

    if (error || !data) return []

    return (data.map((m: any) => m.organizations).filter(Boolean) as Organization[]) || []
  } catch {
    return []
  }
}

export async function getUserOrganizationMemberships(): Promise<OrganizationMember[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', user.id)

    if (error || !data) return []

    return (data.map((m: any) => ({
      id: m.id,
      organization_id: m.organization_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      organization: m.organizations,
    })) as OrganizationMember[]) || []
  } catch {
    return []
  }
}

export async function getCurrentActiveOrgId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const cookieOrgId = cookieStore.get('active_org_id')?.value
    const orgs = await getUserOrganizations()

    if (cookieOrgId && orgs.some((o) => o.id === cookieOrgId)) {
      return cookieOrgId
    }

    return orgs[0]?.id || null
  } catch {
    return null
  }
}

export async function getActiveOrganization(): Promise<Organization | null> {
  const activeOrgId = await getCurrentActiveOrgId()
  if (!activeOrgId) return null

  const orgs = await getUserOrganizations()
  return orgs.find((o) => o.id === activeOrgId) || null
}
