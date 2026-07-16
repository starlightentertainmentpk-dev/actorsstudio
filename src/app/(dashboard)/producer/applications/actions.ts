'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function dispatchNotification(params: {
  targetUserId: string | null
  type: string
  channel: 'email' | 'in_app' | 'whatsapp' | 'sms'
  payload: Record<string, unknown>
}) {
  console.log('Notification dispatched:', params)
}

async function logAudit(actorId: string, action: string, entityId: string, payload: unknown) {
  const { error } = await adminClient.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity: 'applications',
    entity_id: entityId,
    payload_json: payload as any,
  })
  if (error) {
    console.error('Audit log insertion failed:', error)
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: 'shortlisted' | 'audition' | 'selected' | 'rejected'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify application exists
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('id, casting_call_id, talent_id, status')
    .eq('id', applicationId)
    .single()

  if (appError || !app) throw new Error('Application not found')

  // Verify producer owns the casting call
  const { data: call, error: callError } = await supabase
    .from('casting_calls')
    .select('producer_id, producer_profiles(user_id)')
    .eq('id', app.casting_call_id)
    .single()

  if (callError || !call) throw new Error('Casting call not found')

  const producerUserId = (call as any)?.producer_profiles?.user_id
  if (producerUserId !== user.id) throw new Error('Forbidden')

  // Validate status transition
  const VALID_TRANSITIONS: Record<string, string[]> = {
    applied:     ['shortlisted', 'rejected'],
    shortlisted: ['audition', 'rejected'],
    audition:    ['selected', 'rejected'],
    selected:    [],
    rejected:    ['shortlisted'], // allow re-consideration
    withdrawn:   [],
  }

  if (!VALID_TRANSITIONS[app.status]?.includes(newStatus)) {
    throw new Error(`Cannot transition from ${app.status} to ${newStatus}`)
  }

  const { error: updateError } = await supabase
    .from('applications')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)

  if (updateError) throw new Error(updateError.message)

  // Fetch talent user_id to notify
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', app.talent_id)
    .single()

  const talentUserId = talent?.user_id || null

  if (talentUserId) {
    await dispatchNotification({
      targetUserId: talentUserId,
      type: 'application_status_changed',
      channel: 'email',
      payload: { new_status: newStatus }
    })
  }

  await logAudit(user.id, 'update_application_status', applicationId, { from: app.status, to: newStatus })

  revalidatePath(`/producer/casting/${app.casting_call_id}/applications`)
  revalidatePath('/talent/applications')
  
  return { success: true }
}

export async function bulkUpdateApplicationStatus(
  applicationIds: string[],
  newStatus: 'shortlisted' | 'rejected'
) {
  const results = []
  for (const id of applicationIds) {
    try {
      await updateApplicationStatus(id, newStatus)
      results.push({ id, success: true })
    } catch (error) {
      results.push({ id, success: false, error: (error as Error).message })
    }
  }
  return results
}
