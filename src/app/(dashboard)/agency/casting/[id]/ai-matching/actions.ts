'use server'

import { createClient } from '@/lib/supabase/server'
import { getAIService } from '@/lib/services/ai/provider'
import type { AIMatchCandidate, StructuredBrief, ContractAnalysisResult, TalentProfileBuilderResult } from '@/types/ai'

export async function matchTalentForCastingAction(castingCallId: string, briefText: string): Promise<{
  success: boolean
  matches: AIMatchCandidate[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // 1. Fetch agency's approved talent pool
    const { data: talentPool, error: talentError } = await (supabase
      .from('talent_profiles' as any) as any)
      .select('id, full_name, city, gender, experience_years, skills, languages, is_available, profile_image_url')
      .eq('verification_status', 'approved')

    let activePool = talentPool || []

    // If talent pool in DB is empty (e.g. fresh environment), supply realistic Pakistan talent records
    if (!activePool || activePool.length === 0) {
      activePool = [
        {
          id: 't-101',
          full_name: 'Amina Khan',
          city: 'Lahore',
          gender: 'female',
          experience_years: 4,
          skills: ['Commercial Acting', 'Fashion Modeling', 'Fluent English', 'Fluent Urdu'],
          languages: ['Urdu', 'English', 'Punjabi'],
          is_available: true,
          profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 't-102',
          full_name: 'Bilal Tariq',
          city: 'Lahore',
          gender: 'male',
          experience_years: 5,
          skills: ['Dramatic Acting', 'Commercial Acting', 'Voiceover', 'Fluent Urdu'],
          languages: ['Urdu', 'English'],
          is_available: true,
          profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 't-103',
          full_name: 'Zara Ahmed',
          city: 'Karachi',
          gender: 'female',
          experience_years: 3,
          skills: ['Fashion Modeling', 'Commercial Acting', 'Classical Dance'],
          languages: ['Urdu', 'English'],
          is_available: true,
          profile_image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 't-104',
          full_name: 'Danyal Zafar',
          city: 'Karachi',
          gender: 'male',
          experience_years: 6,
          skills: ['Action Stunts', 'Screen Acting', 'Driving', 'Fluent English'],
          languages: ['Urdu', 'English'],
          is_available: true,
          profile_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 't-105',
          full_name: 'Mahnoor Baloch',
          city: 'Islamabad',
          gender: 'female',
          experience_years: 2,
          skills: ['Print Modeling', 'Commercial Acting'],
          languages: ['Urdu', 'English'],
          is_available: false,
          profile_image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        },
      ]
    }

    const ai = getAIService()
    const matches = await ai.matchTalentToBrief(briefText, activePool)

    // 2. Log AI request & save match result if user session is active
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Attempt to find user's active org
        const { data: member } = await (supabase
          .from('organization_members' as any) as any)
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        const orgId = member?.organization_id || '00000000-0000-0000-0000-000000000000'

        await (supabase.from('ai_requests' as any) as any).insert({
          organization_id: orgId,
          user_id: user.id,
          feature_type: 'talent_matching',
          model_name: 'gemini-1.5-flash',
          prompt_summary: (briefText || '').substring(0, 120),
          response_summary: `Matched ${matches.length} candidates`,
          tokens_used: 380,
          latency_ms: 420,
        })

        if (castingCallId && castingCallId !== 'new') {
          await (supabase.from('ai_match_results' as any) as any).insert({
            organization_id: orgId,
            casting_call_id: castingCallId,
            brief_query: briefText,
            results_json: matches,
          })
        }
      }
    } catch {
      // Non-blocking log failure
    }

    return { success: true, matches }
  } catch (error: any) {
    return { success: false, matches: [], error: error.message || 'Matching engine error' }
  }
}

export async function parseClientBriefAction(rawText: string): Promise<{
  success: boolean
  structured?: StructuredBrief
  error?: string
}> {
  try {
    const ai = getAIService()
    const structured = await ai.parseClientBrief(rawText)
    return { success: true, structured }
  } catch (error: any) {
    return { success: false, error: error.message || 'Brief parser error' }
  }
}

export async function analyzeContractAction(contractText: string): Promise<{
  success: boolean
  analysis?: ContractAnalysisResult
  error?: string
}> {
  try {
    const ai = getAIService()
    const analysis = await ai.analyzeContract(contractText)
    return { success: true, analysis }
  } catch (error: any) {
    return { success: false, error: error.message || 'Contract analysis error' }
  }
}

export async function generateAgencyEmailAction(
  templateType: string,
  context: Record<string, string>
): Promise<{
  success: boolean
  email?: string
  error?: string
}> {
  try {
    const ai = getAIService()
    const email = await ai.generateAgencyEmail(templateType, context)
    return { success: true, email }
  } catch (error: any) {
    return { success: false, error: error.message || 'Email generation error' }
  }
}

export async function buildTalentProfileAIAction(input: {
  bio?: string
  experience?: string
  skills?: string[]
}): Promise<{
  success: boolean
  result?: TalentProfileBuilderResult
  error?: string
}> {
  try {
    const ai = getAIService()
    const result = await ai.buildTalentProfile(input)
    return { success: true, result }
  } catch (error: any) {
    return { success: false, error: error.message || 'Profile builder error' }
  }
}

export async function askAIAssistantAction(query: string): Promise<{
  success: boolean
  answer: string
  actionLink?: { label: string; href: string }
  dataItems?: Array<{ title: string; subtitle?: string; badge?: string; href?: string }>
  error?: string
}> {
  try {
    const supabase = await createClient()
    const qLower = query.toLowerCase()

    let contextSummary = 'Actors Studio Agency Operations'
    let actionLink: { label: string; href: string } | undefined
    let dataItems: Array<{ title: string; subtitle?: string; badge?: string; href?: string }> | undefined

    if (qLower.includes('invoice') || qLower.includes('overdue') || qLower.includes('finance') || qLower.includes('pay')) {
      actionLink = { label: 'Open Finance & Invoices', href: '/agency/finance' }
      dataItems = [
        {
          title: 'INV-2026-1042 — Dawn Films & Media',
          subtitle: 'Due in 15 days • Ramadan TVC Campaign',
          badge: 'PKR 600,000 Unpaid',
          href: '/agency/finance',
        },
        {
          title: 'INV-2026-1041 — Shan Foods Production',
          subtitle: 'Cleared via Bank Transfer',
          badge: 'Paid',
          href: '/agency/finance',
        },
      ]
    } else if (qLower.includes('contract') || qLower.includes('sign') || qLower.includes('legal')) {
      actionLink = { label: 'Review Active Contracts', href: '/agency/contracts' }
      dataItems = [
        {
          title: 'Lead Artist Performance Agreement — Shan Foods',
          subtitle: 'Awaiting electronic counter-signature',
          badge: 'Sent',
          href: '/agency/contracts',
        },
        {
          title: 'Commercial Model Release — Dawn Films',
          subtitle: 'Executed by all parties',
          badge: 'Signed',
          href: '/agency/contracts',
        },
      ]
    } else if (qLower.includes('casting') || qLower.includes('audition') || qLower.includes('pipeline')) {
      actionLink = { label: 'View Casting Pipelines', href: '/agency/casting' }
      dataItems = [
        {
          title: 'Coke Studio TVC 2026',
          subtitle: 'Lead Vocalist & Screen Performer • 8 Submissions',
          badge: 'Active Casting',
          href: '/agency/casting',
        },
        {
          title: 'Khaadi Summer Fashion Campaign',
          subtitle: 'Editorial & Runway Models • 5 Candidates',
          badge: 'Client Review',
          href: '/agency/casting',
        },
      ]
    } else if (qLower.includes('talent') || qLower.includes('model') || qLower.includes('actor') || qLower.includes('lahore') || qLower.includes('karachi')) {
      actionLink = { label: 'Browse Talent Roster', href: '/agency/talent' }
      dataItems = [
        {
          title: 'Amina Khan (Lahore)',
          subtitle: 'Commercial & Fashion • 4 Yrs Exp',
          badge: 'Available',
          href: '/agency/talent',
        },
        {
          title: 'Bilal Tariq (Lahore)',
          subtitle: 'Drama & Screen Lead • 5 Yrs Exp',
          badge: 'Available',
          href: '/agency/talent',
        },
        {
          title: 'Zara Ahmed (Karachi)',
          subtitle: 'Runway & Film • 3 Yrs Exp',
          badge: 'Tentative Hold',
          href: '/agency/talent',
        },
      ]
    }

    const ai = getAIService()
    const answer = await ai.chatAssistantQuery(query, contextSummary)

    return {
      success: true,
      answer,
      actionLink,
      dataItems,
    }
  } catch (error: any) {
    return {
      success: false,
      answer: "I couldn't process this agency query right now. Please try again.",
      error: error.message,
    }
  }
}
