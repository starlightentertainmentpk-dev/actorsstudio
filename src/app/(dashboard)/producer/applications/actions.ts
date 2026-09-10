'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { dispatchNotification } from '@/lib/notifications'

async function logAudit(
  actorId: string,
  action: string,
  entityId: string,
  payload: unknown,
  entity: string = 'applications'
) {
  const { error } = await adminClient.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity,
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
    .select('title, producer_id, producer_profiles(user_id)')
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
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', talentUserId)
      .single()

    if (userData?.email) {
      if (newStatus === 'shortlisted') {
        await dispatchNotification({
          targetEmail: userData.email,
          type: 'application_shortlisted',
          payload: { call_title: call.title }
        })
      } else if (newStatus === 'selected') {
        await dispatchNotification({
          targetEmail: userData.email,
          type: 'talent_selected',
          payload: { call_title: call.title }
        })
      }
    }
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

export async function scheduleAudition(params: {
  castingCallId: string
  talentId: string
  mode: 'in_person' | 'self_tape' | 'video_call'
  scheduledAt: string
  locationOrLink?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify ownership of the casting call
  const { data: call } = await supabase
    .from('casting_calls')
    .select('id, producer_id, producer_profiles(user_id)')
    .eq('id', params.castingCallId)
    .single()

  if ((call as any)?.producer_profiles?.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // 1. Insert row in auditions table
  const { data: audition, error: auditErr } = await supabase
    .from('auditions')
    .insert({
      casting_call_id: params.castingCallId,
      talent_id: params.talentId,
      mode: params.mode,
      scheduled_at: params.scheduledAt,
      location_or_link: params.locationOrLink || null,
      result: 'pending'
    })
    .select()
    .single()

  if (auditErr) throw auditErr

  // 2. Update application status to 'audition'
  const { error: appErr } = await supabase
    .from('applications')
    .update({ status: 'audition', updated_at: new Date().toISOString() })
    .eq('casting_call_id', params.castingCallId)
    .eq('talent_id', params.talentId)

  if (appErr) throw appErr

  // 3. Log Audit (using the updated logAudit helper)
  await logAudit(user.id, 'schedule_audition', audition.id, {
    casting_call_id: params.castingCallId,
    talent_id: params.talentId,
    mode: params.mode,
    scheduled_at: params.scheduledAt
  }, 'auditions')

  // 4. Look up talent user_id from profile to notify
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', params.talentId)
    .single()

  const talentUserId = talent?.user_id || null

  if (talentUserId) {
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', talentUserId)
      .single()

    if (userData?.email) {
      await dispatchNotification({
        targetEmail: userData.email,
        type: 'audition_scheduled',
        payload: {
          mode: params.mode,
          time: params.scheduledAt,
          link: params.locationOrLink || ''
        }
      })
    }
  }

  revalidatePath(`/producer/casting/${params.castingCallId}/applications`)
  revalidatePath('/talent/applications')
  revalidatePath('/producer/auditions')
  revalidatePath('/talent/auditions')

  return { success: true, auditionId: audition.id }
}

export async function submitAuditionResult(
  auditionId: string,
  score: number,
  feedback: string,
  result: 'pass' | 'fail'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Retrieve audition details to get casting_call_id and talent_id
  const { data: audition, error: audErr } = await supabase
    .from('auditions')
    .select('casting_call_id, talent_id')
    .eq('id', auditionId)
    .single()

  if (audErr || !audition) throw new Error('Audition not found')

  // Verify ownership of the casting call by the logged in producer
  const { data: call, error: callErr } = await supabase
    .from('casting_calls')
    .select('title, id, producer_id, producer_profiles(user_id)')
    .eq('id', audition.casting_call_id)
    .single()

  if (callErr || !call) throw new Error('Casting call not found')

  if ((call as any)?.producer_profiles?.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // 1. Update the audition record
  const { error } = await supabase
    .from('auditions')
    .update({
      score,
      feedback,
      result,
      updated_at: new Date().toISOString()
    })
    .eq('id', auditionId)

  if (error) throw error

  // 2. Update application status based on result
  const newAppStatus = result === 'pass' ? 'selected' : 'rejected'
  const { error: appErr } = await supabase
    .from('applications')
    .update({
      status: newAppStatus,
      updated_at: new Date().toISOString()
    })
    .eq('casting_call_id', audition.casting_call_id)
    .eq('talent_id', audition.talent_id)

  if (appErr) throw appErr

  // 3. Log Audit
  await logAudit(user.id, 'submit_audition_result', auditionId, { score, feedback, result }, 'auditions')

  // 4. Fetch talent user_id and email to notify if selected
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', audition.talent_id)
    .single()

  if (talent?.user_id && result === 'pass') {
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', talent.user_id)
      .single()

    if (userData?.email) {
      await dispatchNotification({
        targetEmail: userData.email,
        type: 'talent_selected',
        payload: { call_title: call.title }
      })
    }
  }

  revalidatePath('/producer/auditions')
  revalidatePath('/talent/auditions')
  revalidatePath(`/producer/casting/${audition.casting_call_id}/applications`)
  revalidatePath('/talent/applications')

  return { success: true }
}
