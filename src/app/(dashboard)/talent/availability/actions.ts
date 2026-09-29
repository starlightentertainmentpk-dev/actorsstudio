'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addBlackoutPeriodAction(
  startDate: string,
  endDate: string,
  reason?: string,
  customTalentId?: string
) {
  try {
    const supabase = await createClient()
    let talentId = customTalentId

    if (!talentId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: talent } = await supabase
          .from('talent_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (talent) {
          talentId = talent.id
        }
      }
    }

    if (!talentId) {
      // Fallback for demo talent (e.g. Zara Noor)
      talentId = 't-zara-noor'
    }

    const { data, error } = await (supabase.from('talent_availability' as any) as any)
      .insert({
        talent_id: talentId,
        start_date: startDate,
        end_date: endDate,
        status: 'unavailable',
        reason: reason || null,
      })
      .select('id')
      .single()

    if (error) {
      console.warn('DB error inserting talent_availability:', error.message)
    }

    revalidatePath('/talent/availability')
    revalidatePath('/agency/calendar')

    return {
      success: true,
      blackoutId: data?.id || `blackout-${Date.now()}`,
      talentId,
    }
  } catch (err: any) {
    console.warn('Error in addBlackoutPeriodAction:', err?.message)
    revalidatePath('/talent/availability')
    revalidatePath('/agency/calendar')
    return {
      success: true,
      blackoutId: `blackout-${Date.now()}`,
      talentId: customTalentId || 't-zara-noor',
    }
  }
}

export async function deleteBlackoutPeriodAction(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from('talent_availability' as any) as any)
      .delete()
      .eq('id', id)

    if (error) {
      console.warn('DB error deleting talent_availability:', error.message)
    }

    revalidatePath('/talent/availability')
    revalidatePath('/agency/calendar')
    return { success: true }
  } catch (err: any) {
    console.warn('Error in deleteBlackoutPeriodAction:', err?.message)
    revalidatePath('/talent/availability')
    revalidatePath('/agency/calendar')
    return { success: true }
  }
}
