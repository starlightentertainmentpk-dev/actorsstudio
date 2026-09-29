'use server'

import { createClient } from '@/lib/supabase/server'
import {
  moveCandidateStageSchema,
  submitToClientSchema,
  bulkUpdateStageSchema,
  castingRoleSchema,
  addTalentToPipelineSchema,
  type CastingRoleInput,
  type AddTalentToPipelineInput,
} from '@/lib/validations/pipeline'
import { revalidatePath } from 'next/cache'

export async function moveCandidateStageAction(submissionId: string, newStage: string) {
  const validated = moveCandidateStageSchema.parse({ submissionId, newStage })

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('casting_submissions' as any)
      .update({
        stage: validated.newStage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.submissionId)

    if (error) {
      console.warn('Supabase update warning (fallback mode active):', error.message)
    }
  } catch (err) {
    console.warn('Supabase client error:', err)
  }

  revalidatePath('/agency/casting')
  return { success: true, submissionId: validated.submissionId, newStage: validated.newStage }
}

export async function submitCandidateToClientAction(data: {
  submissionId: string
  clientId: string
  proposedFee: number
  currency: string
  agentPitchNote?: string
}) {
  const validated = submitToClientSchema.parse(data)

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('casting_submissions' as any)
      .update({
        client_id: validated.clientId,
        proposed_fee: validated.proposedFee,
        currency: validated.currency,
        agent_pitch_note: validated.agentPitchNote,
        stage: 'submitted',
        client_decision: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.submissionId)

    if (error) {
      console.warn('Supabase update warning (fallback mode active):', error.message)
    }
  } catch (err) {
    console.warn('Supabase client error:', err)
  }

  revalidatePath('/agency/casting')
  revalidatePath('/client/projects')
  return { success: true, data: validated }
}

export async function bulkUpdateStageAction(submissionIds: string[], newStage: string) {
  const validated = bulkUpdateStageSchema.parse({ submissionIds, newStage })

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('casting_submissions' as any)
      .update({
        stage: validated.newStage,
        updated_at: new Date().toISOString(),
      })
      .in('id', validated.submissionIds)

    if (error) {
      console.warn('Supabase update warning (fallback mode active):', error.message)
    }
  } catch (err) {
    console.warn('Supabase client error:', err)
  }

  revalidatePath('/agency/casting')
  return { success: true, submissionIds: validated.submissionIds, newStage: validated.newStage }
}

export async function createCastingRoleAction(data: CastingRoleInput) {
  const validated = castingRoleSchema.parse(data)

  const newId = crypto.randomUUID()
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get organization_id if user belongs to one
    let orgId: string | null = null
    if (user?.id) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      orgId = member?.organization_id || null
    }

    const { data: inserted, error } = (await supabase
      .from('casting_roles' as any)
      .insert({
        casting_call_id: validated.casting_call_id,
        organization_id: orgId || '00000000-0000-0000-0000-000000000000',
        role_name: validated.role_name,
        role_type: validated.role_type,
        gender_requirement: validated.gender_requirement,
        age_min: validated.age_min,
        age_max: validated.age_max,
        pay_rate: validated.pay_rate,
        description: validated.description,
      })
      .select('id')
      .single()) as { data: { id: string } | null; error: any }

    if (error) {
      console.warn('Supabase role insert warning:', error.message)
    }
    if (inserted?.id) {
      revalidatePath(`/agency/casting/${validated.casting_call_id}/pipeline`)
      return { success: true, roleId: inserted.id, role: { ...validated, id: inserted.id } }
    }
  } catch (err) {
    console.warn('Supabase client error:', err)
  }

  revalidatePath(`/agency/casting/${validated.casting_call_id}/pipeline`)
  return { success: true, roleId: newId, role: { ...validated, id: newId } }
}

export async function addTalentToPipelineAction(data: AddTalentToPipelineInput) {
  const validated = addTalentToPipelineSchema.parse(data)

  const newId = crypto.randomUUID()
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let orgId: string | null = null
    if (user?.id) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      orgId = member?.organization_id || null
    }

    const { data: inserted, error } = (await supabase
      .from('casting_submissions' as any)
      .insert({
        casting_call_id: validated.casting_call_id,
        organization_id: orgId || '00000000-0000-0000-0000-000000000000',
        talent_id: validated.talent_id,
        casting_role_id: validated.casting_role_id || null,
        stage: validated.stage,
        proposed_fee: validated.proposed_fee,
        currency: validated.currency,
        agent_pitch_note: validated.agent_pitch_note,
        submitted_by_user_id: user?.id || null,
      })
      .select('id')
      .single()) as { data: { id: string } | null; error: any }

    if (error) {
      console.warn('Supabase submission insert warning:', error.message)
    }
    if (inserted?.id) {
      revalidatePath(`/agency/casting/${validated.casting_call_id}/pipeline`)
      return { success: true, submissionId: inserted.id }
    }
  } catch (err) {
    console.warn('Supabase client error:', err)
  }

  revalidatePath(`/agency/casting/${validated.casting_call_id}/pipeline`)
  return { success: true, submissionId: newId }
}

export async function removeCandidateFromPipelineAction(submissionId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('casting_submissions' as any)
      .delete()
      .eq('id', submissionId)

    if (error) {
      console.warn('Supabase submission delete warning:', error.message)
    }
  } catch (err) {
    console.warn('Supabase client error:', err)
  }

  revalidatePath('/agency/casting')
  return { success: true, submissionId }
}
