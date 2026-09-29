'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { agencyOnboardingSchema, createOrganizationSchema } from '@/lib/validations/organization'

export interface CreateAgencyResult {
  success: boolean
  orgId?: string
  slug?: string
  error?: string
}

export async function createAgencyOrganization(
  dataOrFormData: FormData | Record<string, any>
): Promise<CreateAgencyResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized: You must be logged in to create an agency.' }
    }

    let rawData: Record<string, any>
    if (dataOrFormData instanceof FormData) {
      rawData = {
        name: dataOrFormData.get('name'),
        slug: dataOrFormData.get('slug'),
        agency_type: dataOrFormData.get('agency_type'),
        country: dataOrFormData.get('country') || 'Pakistan',
        currency: dataOrFormData.get('currency') || 'PKR',
        timezone: dataOrFormData.get('timezone') || 'Asia/Karachi',
        logo_url: dataOrFormData.get('logo_url') || undefined,
        brand_color: dataOrFormData.get('brand_color') || '#4f46e5',
        website: dataOrFormData.get('website') || undefined,
        bio: dataOrFormData.get('bio') || undefined,
        default_commission_rate: dataOrFormData.get('default_commission_rate') || 20,
      }
    } else {
      rawData = dataOrFormData
    }

    const validated = agencyOnboardingSchema.parse(rawData)

    // Check slug collision
    const { data: existingSlug } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', validated.slug)
      .maybeSingle()

    if (existingSlug) {
      return { success: false, error: 'An agency with this URL slug already exists. Please choose a different one.' }
    }

    // 1. Insert organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: validated.name,
        slug: validated.slug,
        agency_type: validated.agency_type,
        country: validated.country,
        currency: validated.currency,
        timezone: validated.timezone,
        logo_url: validated.logo_url || null,
        brand_color: validated.brand_color,
        website: validated.website || null,
        bio: validated.bio || null,
      })
      .select('id, slug')
      .single()

    if (orgError) {
      return { success: false, error: orgError.message }
    }

    // 2. Insert organization settings
    const { error: settingsError } = await supabase.from('organization_settings').insert({
      organization_id: org.id,
      default_commission_rate: validated.default_commission_rate || 20.0,
      public_directory_enabled: true,
      settings_json: {
        team_invites_queued: validated.team_invites || [],
      },
    })

    if (settingsError) {
      console.warn('Failed to insert organization settings:', settingsError.message)
    }

    // 3. Make current user the agency_owner
    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'agency_owner',
    })

    if (memberError) {
      console.warn('Failed to insert organization owner:', memberError.message)
    }

    // 4. Set active organization cookie
    const cookieStore = await cookies()
    cookieStore.set('active_org_id', org.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    revalidatePath('/agency')
    revalidatePath('/', 'layout')

    return { success: true, orgId: org.id, slug: org.slug }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during agency setup.',
    }
  }
}
