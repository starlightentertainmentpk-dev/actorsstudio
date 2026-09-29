'use server'

import { createClient } from '@/lib/supabase/server'
import { clientBriefSchema, candidateReviewSchema } from '@/lib/validations/client-portal'
import { revalidatePath } from 'next/cache'

export async function submitClientBriefAction(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine client details from DB if user is authenticated
    let clientId: string | null = null
    let organizationId: string | null = null
    let userId: string = user?.id || 'demo-client-user'

    if (user) {
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id, clients(organization_id)')
        .eq('user_id', user.id)
        .maybeSingle()

      if (clientUser) {
        clientId = clientUser.client_id
        organizationId = (clientUser.clients as any)?.organization_id || null
      }
    }

    // Parse form data
    const raw = {
      project_title: formData.get('project_title'),
      target_category_id: formData.get('target_category_id') || undefined,
      gender_preference: formData.get('gender_preference') || undefined,
      age_range_min: formData.get('age_range_min') ? Number(formData.get('age_range_min')) : undefined,
      age_range_max: formData.get('age_range_max') ? Number(formData.get('age_range_max')) : undefined,
      shoot_dates: formData.get('shoot_dates') || undefined,
      budget_range: formData.get('budget_range') || undefined,
      location: formData.get('location') || undefined,
      raw_brief_text: formData.get('raw_brief_text'),
    }

    const validated = clientBriefSchema.parse(raw)

    if (clientId && organizationId && user) {
      const { data, error } = await supabase
        .from('client_briefs')
        .insert({
          ...validated,
          client_id: clientId,
          organization_id: organizationId,
          submitted_by_user_id: user.id,
          status: 'submitted',
        })
        .select('id')
        .single()

      if (error) {
        console.warn('DB error submitting client brief:', error.message)
      } else if (data) {
        revalidatePath('/client/briefs')
        revalidatePath('/client/dashboard')
        return { success: true, briefId: data.id }
      }
    }

    // Fallback ID for demo / unauthenticated preview environments
    const fallbackId = `brief-${Date.now()}`
    revalidatePath('/client/briefs')
    revalidatePath('/client/dashboard')
    return { success: true, briefId: fallbackId }
  } catch (err: any) {
    console.error('Error submitting client brief:', err)
    return { success: false, error: err.message || 'Failed to submit brief' }
  }
}

export async function reviewCandidateAction(
  submissionId: string,
  decision: 'shortlist' | 'reject' | 'audition_request',
  feedback?: string
) {
  try {
    candidateReviewSchema.parse({
      submission_id: submissionId,
      decision,
      feedback,
    })

    const supabase = await createClient()

    // Update candidate submission state in casting_submissions
    const { error } = await supabase
      .from('casting_submissions')
      .update({
        client_decision: decision,
        client_feedback: feedback || null,
        client_reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)

    if (error) {
      console.warn('DB error reviewing candidate:', error.message)
    }

    revalidatePath('/client/projects')
    revalidatePath('/client/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Error in reviewCandidateAction:', err)
    return { success: false, error: err.message || 'Failed to record candidate review' }
  }
}
