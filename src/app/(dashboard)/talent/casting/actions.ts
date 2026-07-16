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

export async function applyToCastingCall(castingCallId: string, coverNote?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get talent profile
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id, verification_status')
    .eq('user_id', user.id)
    .single()

  if (!talent) throw new Error('Talent profile not found')
  if (talent.verification_status !== 'approved') {
    throw new Error('Only approved talent can apply to casting calls')
  }

  // Check not already applied
  const { data: existing } = await supabase
    .from('applications')
    .select('id, status')
    .eq('casting_call_id', castingCallId)
    .eq('talent_id', talent.id)
    .maybeSingle()

  if (existing && existing.status !== 'withdrawn') {
    throw new Error('You have already applied to this casting call')
  }

  let appId = existing?.id

  // Insert or re-insert if withdrawn
  if (existing?.status === 'withdrawn') {
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'applied',
        cover_note: coverNote || null,
        withdrawn_at: null,
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
    
    if (updateError) throw new Error(updateError.message)
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('applications')
      .insert({
        casting_call_id: castingCallId,
        talent_id: talent.id,
        status: 'applied',
        cover_note: coverNote || null,
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) throw new Error(insertError.message)
    appId = inserted.id
  }

  // Fetch producer user_id to notify them
  const { data: call } = await supabase
    .from('casting_calls')
    .select('producer_profiles(user_id)')
    .eq('id', castingCallId)
    .single()
  
  const producerUserId = (call as any)?.producer_profiles?.user_id || null

  await dispatchNotification({
    targetUserId: producerUserId,
    type: 'new_application',
    channel: 'email',
    payload: { casting_call_id: castingCallId }
  })

  await logAudit(user.id, 'apply', appId || castingCallId, { talent_id: talent.id })

  revalidatePath(`/casting/${castingCallId}`)
  revalidatePath('/talent/applications')
  
  return { id: appId, status: 'applied', applied_at: new Date().toISOString() }
}

export async function withdrawApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!talent) throw new Error('Talent profile not found')

  // Verify ownership
  const { data: app } = await supabase
    .from('applications')
    .select('id, status, talent_id')
    .eq('id', applicationId)
    .single()

  if (!app) throw new Error('Application not found')
  if (app.talent_id !== talent.id) throw new Error('Forbidden')

  if (['selected', 'audition'].includes(app.status)) {
    throw new Error('Cannot withdraw an application that is already in audition/selected stage. Contact the studio.')
  }

  const { error: updateError } = await supabase
    .from('applications')
    .update({
      status: 'withdrawn',
      withdrawn_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)

  if (updateError) throw new Error(updateError.message)

  await logAudit(user.id, 'withdraw', applicationId, { talent_id: talent.id })

  revalidatePath('/talent/applications')
  return { success: true }
}
