'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { CastingCallFormData } from '@/lib/validations/casting-call'

import type { Database } from '@/types/database'

async function logAudit(actorId: string, action: string, entityId: string, payload: unknown) {
  const { error } = await adminClient.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity: 'casting_calls',
    entity_id: entityId,
    payload_json: payload as any,
  })
  if (error) {
    console.error('Audit log insertion failed:', error)
  }
}

export async function createCastingCall(data: CastingCallFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch producer_profile to get producer_id
  const { data: producer, error: prodError } = await supabase
    .from('producer_profiles')
    .select('id, verified')
    .eq('user_id', user.id)
    .single()

  if (prodError || !producer) throw new Error('Producer profile not found')
  if (data.status === 'open' && !producer.verified) {
    throw new Error('Your company must be verified to publish casting calls')
  }

  const { data: call, error } = await supabase
    .from('casting_calls')
    .insert({
      producer_id: producer.id,
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      location: data.location,
      shoot_date: data.shoot_date || null,
      application_deadline: data.application_deadline || null,
      compensation: data.compensation || null,
      requirements_json: data.requirements_json || {},
      status: data.status,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await logAudit(user.id, 'create_casting_call', call.id, { title: data.title })
  revalidatePath('/producer/casting')
  revalidatePath('/casting')
  return call
}

export async function updateCastingCall(id: string, data: Partial<CastingCallFormData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch producer_profile to get producer_id
  const { data: producer, error: prodError } = await supabase
    .from('producer_profiles')
    .select('id, verified')
    .eq('user_id', user.id)
    .single()

  if (prodError || !producer) throw new Error('Producer profile not found')

  // Fetch existing casting call to check ownership
  const { data: existingCall, error: fetchError } = await supabase
    .from('casting_calls')
    .select('producer_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !existingCall) throw new Error('Casting call not found')
  if (existingCall.producer_id !== producer.id) throw new Error('Forbidden')

  // Enforce verification if publishing
  const newStatus = data.status || existingCall.status
  if (newStatus === 'open' && !producer.verified) {
    throw new Error('Your company must be verified to publish casting calls')
  }

  // Update object
  const updateData: Partial<Database['public']['Tables']['casting_calls']['Update']> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.category_id !== undefined) updateData.category_id = data.category_id
  if (data.location !== undefined) updateData.location = data.location
  if (data.shoot_date !== undefined) updateData.shoot_date = data.shoot_date || null
  if (data.application_deadline !== undefined) updateData.application_deadline = data.application_deadline || null
  if (data.compensation !== undefined) updateData.compensation = data.compensation || null
  if (data.requirements_json !== undefined) updateData.requirements_json = data.requirements_json
  if (data.status !== undefined) updateData.status = data.status

  const { data: updatedCall, error: updateError } = await supabase
    .from('casting_calls')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) throw new Error(updateError.message)

  await logAudit(user.id, 'update_casting_call', id, { title: updatedCall.title, changed_fields: Object.keys(updateData) })
  revalidatePath('/producer/casting')
  revalidatePath(`/casting/${id}`)
  revalidatePath('/casting')
  return updatedCall
}

export async function deleteCastingCall(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch producer_profile
  const { data: producer, error: prodError } = await supabase
    .from('producer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (prodError || !producer) throw new Error('Producer profile not found')

  // Fetch casting call to verify ownership
  const { data: existingCall, error: fetchError } = await supabase
    .from('casting_calls')
    .select('producer_id, title')
    .eq('id', id)
    .single()

  if (fetchError || !existingCall) throw new Error('Casting call not found')
  if (existingCall.producer_id !== producer.id) throw new Error('Forbidden')

  // Check if there are active applications (i.e. not withdrawn)
  const { count, error: countError } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('casting_call_id', id)
    .neq('status', 'withdrawn')

  if (countError) throw new Error(countError.message)
  if (count && count > 0) {
    throw new Error('Cannot delete casting call because it already has active applications.')
  }

  const { error: deleteError } = await supabase
    .from('casting_calls')
    .delete()
    .eq('id', id)

  if (deleteError) throw new Error(deleteError.message)

  await logAudit(user.id, 'delete_casting_call', id, { title: existingCall.title })
  revalidatePath('/producer/casting')
  revalidatePath('/casting')
  return { success: true }
}

export async function closeCastingCall(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch producer_profile
  const { data: producer, error: prodError } = await supabase
    .from('producer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (prodError || !producer) throw new Error('Producer profile not found')

  // Fetch casting call to verify ownership
  const { data: existingCall, error: fetchError } = await supabase
    .from('casting_calls')
    .select('producer_id, title')
    .eq('id', id)
    .single()

  if (fetchError || !existingCall) throw new Error('Casting call not found')
  if (existingCall.producer_id !== producer.id) throw new Error('Forbidden')

  const { error: updateError } = await supabase
    .from('casting_calls')
    .update({ status: 'closed' })
    .eq('id', id)

  if (updateError) throw new Error(updateError.message)

  await logAudit(user.id, 'close_casting_call', id, { title: existingCall.title })
  revalidatePath('/producer/casting')
  revalidatePath(`/casting/${id}`)
  revalidatePath('/casting')
  return { success: true }
}
