'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function switchActiveOrganizationAction(orgId: string): Promise<{ success: boolean }> {
  const cookieStore = await cookies()
  cookieStore.set('active_org_id', orgId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  revalidatePath('/', 'layout')
  return { success: true }
}
