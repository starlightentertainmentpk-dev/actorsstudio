'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { dispatchNotification } from '@/lib/notifications'
import {
  ScreeningStage,
  InterviewDetails,
  parseScreeningData,
  encodeScreeningData,
  getEffectiveStage,
} from '@/lib/screening'

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

/**
 * Validates that the active logged-in user owns the casting call associated with this application.
 */
async function verifyApplicationOwnership(applicationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('id, casting_call_id, talent_id, status, cover_note')
    .eq('id', applicationId)
    .single()

  if (appError || !app) throw new Error('Application not found')

  const { data: call, error: callError } = await supabase
    .from('casting_calls')
    .select('id, title, producer_id, producer_profiles(user_id)')
    .eq('id', app.casting_call_id)
    .single()

  if (callError || !call) throw new Error('Casting call not found')

  const producerUserId = (call as any)?.producer_profiles?.user_id
  if (producerUserId !== user.id) throw new Error('Forbidden')

  return { supabase, user, app, call }
}

/**
 * Moves candidate to any screening stage: applied | shortlisted | deferred | audition | selected | rejected
 */
export async function updateCandidateStage(
  applicationId: string,
  targetStage: ScreeningStage
) {
  const { supabase, user, app, call } = await verifyApplicationOwnership(applicationId)

  const { cleanCoverNote, screening } = parseScreeningData(app.cover_note)

  // Determine new database status and deferred flag
  let dbStatus: 'applied' | 'shortlisted' | 'audition' | 'selected' | 'rejected' = 'applied'
  let isDeferred = false

  switch (targetStage) {
    case 'applied':
      dbStatus = 'applied'
      isDeferred = false
      break
    case 'shortlisted':
      dbStatus = 'shortlisted'
      isDeferred = false
      break
    case 'deferred':
      // Defer keeps the candidate active in the deferred bucket
      dbStatus = 'applied'
      isDeferred = true
      break
    case 'audition':
      dbStatus = 'audition'
      isDeferred = false
      break
    case 'selected':
      dbStatus = 'selected'
      isDeferred = false
      break
    case 'rejected':
      dbStatus = 'rejected'
      isDeferred = false
      break
  }

  const updatedScreening = {
    ...screening,
    isDeferred,
    history: [
      ...(screening.history || []),
      {
        stage: targetStage,
        changedAt: new Date().toISOString(),
        actorEmail: user.email,
      },
    ],
  }

  const updatedCoverNote = encodeScreeningData(cleanCoverNote, updatedScreening)

  const { error: updateError } = await supabase
    .from('applications')
    .update({
      status: dbStatus,
      cover_note: updatedCoverNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (updateError) throw new Error(updateError.message)

  // Dispatch candidate notifications for milestone stages
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
      if (targetStage === 'shortlisted') {
        await dispatchNotification({
          targetEmail: userData.email,
          type: 'application_shortlisted',
          payload: { call_title: call.title },
        })
      } else if (targetStage === 'selected') {
        await dispatchNotification({
          targetEmail: userData.email,
          type: 'talent_selected',
          payload: { call_title: call.title },
        })
      }
    }
  }

  await logAudit(user.id, 'update_candidate_stage', applicationId, {
    fromStage: getEffectiveStage(app.status, screening),
    toStage: targetStage,
    dbStatus,
  })

  revalidatePath(`/producer/casting/${app.casting_call_id}/applications`)
  revalidatePath('/producer/applications')
  revalidatePath('/talent/applications')

  return { success: true, stage: targetStage }
}

/**
 * Assigns or updates the 1-5 star rating for a candidate.
 */
export async function updateCandidateRating(
  applicationId: string,
  rating: number
) {
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5')
  const { supabase, user, app } = await verifyApplicationOwnership(applicationId)

  const { cleanCoverNote, screening } = parseScreeningData(app.cover_note)
  const updatedScreening = {
    ...screening,
    rating,
  }

  const updatedCoverNote = encodeScreeningData(cleanCoverNote, updatedScreening)

  const { error } = await supabase
    .from('applications')
    .update({
      cover_note: updatedCoverNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) throw new Error(error.message)

  await logAudit(user.id, 'update_candidate_rating', applicationId, { rating })
  revalidatePath('/producer/applications')
  return { success: true, rating }
}

/**
 * Saves recruiter internal private notes for a candidate.
 */
export async function updateCandidateNotes(
  applicationId: string,
  notes: string
) {
  const { supabase, user, app } = await verifyApplicationOwnership(applicationId)

  const { cleanCoverNote, screening } = parseScreeningData(app.cover_note)
  const updatedScreening = {
    ...screening,
    notes,
  }

  const updatedCoverNote = encodeScreeningData(cleanCoverNote, updatedScreening)

  const { error } = await supabase
    .from('applications')
    .update({
      cover_note: updatedCoverNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) throw new Error(error.message)

  await logAudit(user.id, 'update_candidate_notes', applicationId, { notesLength: notes.length })
  revalidatePath('/producer/applications')
  return { success: true }
}

/**
 * Schedules an interview / audition call for a candidate.
 */
export async function scheduleCandidateInterview(
  applicationId: string,
  interviewData: InterviewDetails
) {
  const { supabase, user, app, call } = await verifyApplicationOwnership(applicationId)

  // 1. Insert or update row in auditions table
  const { data: audition, error: auditErr } = await supabase
    .from('auditions')
    .insert({
      casting_call_id: app.casting_call_id,
      talent_id: app.talent_id,
      mode: interviewData.mode,
      scheduled_at: interviewData.scheduledAt,
      location_or_link: interviewData.locationOrLink,
      feedback: interviewData.instructions || null,
      result: 'pending',
    })
    .select()
    .single()

  if (auditErr) throw auditErr

  // 2. Update application cover note metadata and set status to 'audition'
  const { cleanCoverNote, screening } = parseScreeningData(app.cover_note)
  const updatedScreening = {
    ...screening,
    isDeferred: false,
    interview: interviewData,
    history: [
      ...(screening.history || []),
      {
        stage: 'audition' as ScreeningStage,
        changedAt: new Date().toISOString(),
        actorEmail: user.email,
      },
    ],
  }

  const updatedCoverNote = encodeScreeningData(cleanCoverNote, updatedScreening)

  const { error: appErr } = await supabase
    .from('applications')
    .update({
      status: 'audition',
      cover_note: updatedCoverNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (appErr) throw appErr

  // 3. Dispatch email notification to talent
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
      await dispatchNotification({
        targetEmail: userData.email,
        type: 'audition_scheduled',
        payload: {
          mode: interviewData.mode,
          time: interviewData.scheduledAt,
          link: interviewData.locationOrLink || '',
          call_title: call.title,
        },
      })
    }
  }

  await logAudit(user.id, 'schedule_candidate_interview', applicationId, {
    auditionId: audition.id,
    mode: interviewData.mode,
    scheduledAt: interviewData.scheduledAt,
  })

  revalidatePath('/producer/applications')
  revalidatePath(`/producer/casting/${app.casting_call_id}/applications`)
  revalidatePath('/talent/applications')
  revalidatePath('/producer/auditions')
  revalidatePath('/talent/auditions')

  return { success: true, auditionId: audition.id }
}

/**
 * Bulk updates candidates to a target stage.
 */
export async function bulkUpdateCandidateStages(
  applicationIds: string[],
  targetStage: ScreeningStage
) {
  const results = []
  for (const id of applicationIds) {
    try {
      await updateCandidateStage(id, targetStage)
      results.push({ id, success: true })
    } catch (error) {
      results.push({ id, success: false, error: (error as Error).message })
    }
  }
  return results
}

// -------------------------------------------------------------
// Backwards compatibility exports for existing components
// -------------------------------------------------------------
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: 'shortlisted' | 'audition' | 'selected' | 'rejected'
) {
  return updateCandidateStage(applicationId, newStatus)
}

export async function bulkUpdateApplicationStatus(
  applicationIds: string[],
  newStatus: 'shortlisted' | 'rejected'
) {
  return bulkUpdateCandidateStages(applicationIds, newStatus)
}

export async function scheduleAudition(params: {
  castingCallId: string
  talentId: string
  mode: 'in_person' | 'self_tape' | 'video_call'
  scheduledAt: string
  locationOrLink?: string
}) {
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('applications')
    .select('id')
    .eq('casting_call_id', params.castingCallId)
    .eq('talent_id', params.talentId)
    .maybeSingle()

  if (app) {
    return scheduleCandidateInterview(app.id, {
      mode: params.mode,
      scheduledAt: params.scheduledAt,
      locationOrLink: params.locationOrLink || '',
    })
  }

  // Fallback to direct insertion if no application row found
  const { data: audition, error } = await supabase
    .from('auditions')
    .insert({
      casting_call_id: params.castingCallId,
      talent_id: params.talentId,
      mode: params.mode,
      scheduled_at: params.scheduledAt,
      location_or_link: params.locationOrLink || null,
      result: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return { success: true, auditionId: audition.id }
}

export async function submitAuditionResult(
  auditionId: string,
  score: number,
  feedback: string,
  result: 'pass' | 'fail'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('auditions')
    .update({
      score,
      feedback,
      result,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auditionId)

  if (error) throw error
  revalidatePath('/producer/auditions')
  return { success: true }
}
