'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData || !['super_admin', 'studio_admin', 'studio_staff'].includes(userData.role)) {
    throw new Error('Forbidden')
  }

  return { user, supabase }
}

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

export async function adminCloseCastingCall(id: string) {
  const { user, supabase } = await verifyAdmin()

  const { data: call, error: fetchError } = await supabase
    .from('casting_calls')
    .select('title')
    .eq('id', id)
    .single()

  if (fetchError || !call) throw new Error('Casting call not found')

  const { error: updateError } = await supabase
    .from('casting_calls')
    .update({ status: 'closed' })
    .eq('id', id)

  if (updateError) throw new Error(updateError.message)

  await logAudit(user.id, 'admin_close_casting_call', id, { title: call.title })
  revalidatePath('/producer/casting')
  revalidatePath(`/casting/${id}`)
  revalidatePath('/casting')
  return { success: true }
}

export async function adminToggleFlagCastingCall(id: string, currentFlagState: boolean) {
  const { user, supabase } = await verifyAdmin()

  const { data: call, error: fetchError } = await supabase
    .from('casting_calls')
    .select('title, requirements_json')
    .eq('id', id)
    .single()

  if (fetchError || !call) throw new Error('Casting call not found')

  const existingRequirements = (call.requirements_json as Record<string, unknown>) || {}
  const nextFlagState = !currentFlagState

  const updatedRequirements = {
    ...existingRequirements,
    admin_flagged: nextFlagState,
  }

  const { error: updateError } = await supabase
    .from('casting_calls')
    .update({ requirements_json: updatedRequirements })
    .eq('id', id)

  if (updateError) throw new Error(updateError.message)

  const actionName = nextFlagState ? 'admin_flag_casting_call' : 'admin_unflag_casting_call'
  await logAudit(user.id, actionName, id, { title: call.title, flagged: nextFlagState })
  revalidatePath('/producer/casting')
  revalidatePath(`/casting/${id}`)
  revalidatePath('/casting')
  return { success: true }
}
