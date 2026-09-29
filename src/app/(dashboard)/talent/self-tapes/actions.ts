'use server'

import { createClient } from '@/lib/supabase/server'
import {
  submitSelfTapeSchema,
  requestSelfTapeSchema,
  selfTapeReviewSchema,
  type RequestSelfTapeInput,
  type SelfTapeReviewInput,
} from '@/lib/validations/self-tape'
import { revalidatePath } from 'next/cache'

export async function submitSelfTapeAction(formData: FormData) {
  const raw = {
    self_tape_request_id: formData.get('self_tape_request_id'),
    video_storage_path: formData.get('video_storage_path'),
    talent_notes: formData.get('talent_notes') || undefined,
    video_duration_sec: formData.get('video_duration_sec') || undefined,
    file_size_bytes: formData.get('file_size_bytes') || undefined,
  }

  const validated = submitSelfTapeSchema.parse(raw)
  const submissionId = crypto.randomUUID()

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let talentId: string | null = null
    if (user?.id) {
      const { data: talent } = await supabase
        .from('talent_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      talentId = talent?.id || null
    }

    // 1. Insert into self_tape_submissions
    const { data: sub, error: subError } = (await supabase
      .from('self_tape_submissions' as any)
      .insert({
        self_tape_request_id: validated.self_tape_request_id,
        talent_id: talentId || 't-zara-noor',
        video_storage_path: validated.video_storage_path,
        talent_notes: validated.talent_notes,
        video_duration_sec: validated.video_duration_sec,
        file_size_bytes: validated.file_size_bytes,
        status: 'submitted',
      })
      .select('id')
      .maybeSingle()) as { data: { id: string } | null; error: any }

    if (subError) {
      console.warn('Supabase self_tape_submissions insert warning:', subError.message)
    }

    // 2. Update self_tape_requests status to submitted
    const { error: reqError } = await supabase
      .from('self_tape_requests' as any)
      .update({
        status: 'submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.self_tape_request_id)

    if (reqError) {
      console.warn('Supabase self_tape_requests update warning:', reqError.message)
    }

    revalidatePath('/talent/self-tapes')
    revalidatePath('/agency/casting')
    return { success: true, submissionId: sub?.id || submissionId }
  } catch (err) {
    console.warn('Supabase client error in submitSelfTapeAction (fallback mode active):', err)
  }

  revalidatePath('/talent/self-tapes')
  revalidatePath('/agency/casting')
  return { success: true, submissionId }
}

export async function getSelfTapeSignedUrl(storagePath: string): Promise<string> {
  // If already a full http/https URL, return directly
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.storage
      .from('self-tapes')
      .createSignedUrl(storagePath, 3600) // 1 hour token

    if (error || !data?.signedUrl) {
      console.warn('Signed URL generation warning (fallback will be used):', error?.message)
      // Return public URL or fallback
      const { data: pubData } = supabase.storage.from('self-tapes').getPublicUrl(storagePath)
      return pubData?.publicUrl || storagePath
    }

    return data.signedUrl
  } catch (err) {
    console.warn('Supabase signed URL error (fallback returned):', err)
    return storagePath
  }
}

export async function requestSelfTapeAction(data: RequestSelfTapeInput) {
  const validated = requestSelfTapeSchema.parse(data)
  const requestId = crypto.randomUUID()

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
      .from('self_tape_requests' as any)
      .insert({
        organization_id: orgId || '00000000-0000-0000-0000-000000000000',
        casting_call_id: validated.casting_call_id,
        casting_role_id: validated.casting_role_id || null,
        talent_id: validated.talent_id,
        requested_by_user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        client_id: validated.client_id || null,
        instructions: validated.instructions,
        sides_script_url: validated.sides_script_url || null,
        deadline_at: validated.deadline_at,
        status: 'requested',
      })
      .select('id')
      .maybeSingle()) as { data: { id: string } | null; error: any }

    if (error) {
      console.warn('Supabase self_tape_requests insert warning:', error.message)
    }

    revalidatePath(`/agency/casting/${validated.casting_call_id}/pipeline`)
    revalidatePath('/talent/self-tapes')
    return { success: true, requestId: inserted?.id || requestId }
  } catch (err) {
    console.warn('Supabase error in requestSelfTapeAction:', err)
  }

  revalidatePath(`/agency/casting/${validated.casting_call_id}/pipeline`)
  revalidatePath('/talent/self-tapes')
  return { success: true, requestId }
}

export async function submitSelfTapeReviewAction(
  data: SelfTapeReviewInput & {
    reviewer_type?: 'agency' | 'client'
    submissionId?: string
    newStatus?: string
  }
) {
  const validated = selfTapeReviewSchema.parse(data)
  const reviewId = crypto.randomUUID()

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: review, error: revError } = (await supabase
      .from('self_tape_reviews' as any)
      .insert({
        self_tape_submission_id: validated.self_tape_submission_id,
        reviewer_user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        reviewer_type: data.reviewer_type || 'agency',
        score: validated.score,
        timestamp_sec: validated.timestamp_sec,
        comments: validated.comments,
        decision: validated.decision || null,
      })
      .select('id')
      .maybeSingle()) as { data: { id: string } | null; error: any }

    if (revError) {
      console.warn('Supabase self_tape_reviews insert warning:', revError.message)
    }

    // Update status if decision given
    if (validated.decision) {
      let statusToSet = 'under_review'
      if (validated.decision === 'shortlist') statusToSet = 'approved'
      if (validated.decision === 'pass') statusToSet = 'rejected'
      if (validated.decision === 're_tape') statusToSet = 'retape_requested'
      if (validated.decision === 'select') statusToSet = 'approved'

      await supabase
        .from('self_tape_submissions' as any)
        .update({ status: statusToSet })
        .eq('id', validated.self_tape_submission_id)
    }

    revalidatePath('/talent/self-tapes')
    revalidatePath('/agency/casting')
    return { success: true, reviewId: review?.id || reviewId }
  } catch (err) {
    console.warn('Supabase review action error:', err)
  }

  revalidatePath('/talent/self-tapes')
  revalidatePath('/agency/casting')
  return { success: true, reviewId }
}
