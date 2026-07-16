'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function logAudit(actorId: string, action: string, entityId: string, payload: any) {
  const { error } = await adminClient.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity: 'applications',
    entity_id: entityId,
    payload_json: payload,
  })
  if (error) {
    console.error('Audit log insertion failed:', error)
  }
}

export async function applyToCastingCall(castingCallId: string, coverNote?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in to apply.')

  // Fetch user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'talent') {
    throw new Error('Only talent profiles can apply to casting calls.')
  }

  // Fetch talent profile
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id, verification_status')
    .eq('user_id', user.id)
    .single()

  if (!talent) throw new Error('Talent profile not found. Please complete onboarding.')

  // Insert application (unique constraint will prevent duplicate applications)
  const { data: app, error } = await supabase
    .from('applications')
    .insert({
      casting_call_id: castingCallId,
      talent_id: talent.id,
      status: 'applied',
      cover_note: coverNote || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already applied to this casting call.')
    }
    throw new Error(error.message)
  }

  await logAudit(user.id, 'apply', app.id, { casting_call_id: castingCallId, talent_id: talent.id })
  revalidatePath(`/casting/${castingCallId}`)
  revalidatePath('/producer/casting')
  return app
}

export async function withdrawFromCastingCall(applicationId: string, castingCallId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in to withdraw.')

  // Fetch talent profile
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!talent) throw new Error('Talent profile not found.')

  // Fetch application to verify ownership
  const { data: app } = await supabase
    .from('applications')
    .select('talent_id')
    .eq('id', applicationId)
    .single()

  if (!app) throw new Error('Application not found.')
  if (app.talent_id !== talent.id) throw new Error('Forbidden')

  // Set status = 'withdrawn'
  const { error } = await supabase
    .from('applications')
    .update({
      status: 'withdrawn',
      withdrawn_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) throw new Error(error.message)

  await logAudit(user.id, 'withdraw', applicationId, { casting_call_id: castingCallId, talent_id: talent.id })
  revalidatePath(`/casting/${castingCallId}`)
  revalidatePath('/producer/casting')
  return { success: true }
}
