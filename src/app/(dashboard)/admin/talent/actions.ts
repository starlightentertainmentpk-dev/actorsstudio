'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/types/database'

// Verify Admin Permissions helper
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (
    userError ||
    !userData ||
    !['super_admin', 'studio_admin', 'studio_staff'].includes(userData.role)
  ) {
    throw new Error('Forbidden')
  }

  return { user, supabase }
}

// Audit logging helper using adminClient
async function logAudit(
  actorId: string,
  action: string,
  entityId: string,
  payload: Record<string, unknown>
) {
  const { error } = await adminClient.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity: 'talent_profiles',
    entity_id: entityId,
    payload_json: payload as Json,
  })
  if (error) {
    console.error('Audit log insertion failed:', error)
  }
}

export async function updateTalentVerificationStatus(
  profileId: string,
  newStatus: 'approved' | 'rejected' | 'under_review' | 'interview_scheduled' | 'blacklisted' | 'inactive',
  rejectionReason?: string
) {
  const { user, supabase } = await verifyAdmin()

  // Perform the update on talent_profiles
  const updatePayload: any = {
    verification_status: newStatus,
    updated_at: new Date().toISOString(),
  }

  // If rejectionReason is provided, we can pass it to audit logs and save it/keep it.
  const { error } = await supabase
    .from('talent_profiles')
    .update(updatePayload)
    .eq('id', profileId)

  if (error) throw error

  // Log the audit activity using adminClient to bypass user RLS inserts
  await logAudit(user.id, `talent_verification_${newStatus}`, profileId, {
    reason: rejectionReason || null,
  })

  // Revalidate cache paths
  revalidatePath('/admin/talent')
  revalidatePath('/producer/talent-search')
  return { success: true }
}
