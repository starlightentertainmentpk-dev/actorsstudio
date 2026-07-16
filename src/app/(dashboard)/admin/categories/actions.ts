'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type CategoryFormData = {
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
}

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData || !['super_admin', 'studio_admin'].includes(userData.role)) {
    throw new Error('Forbidden')
  }

  return { user, supabase }
}

async function logAudit(actorId: string, action: string, entityId: string, payload: any) {
  // Use adminClient to insert audit logs as it bypasses user RLS inserts
  const { error } = await adminClient.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity: 'categories',
    entity_id: entityId,
    payload_json: payload,
  })
  if (error) {
    console.error('Audit log insertion failed:', error)
  }
}

export async function createCategory(data: CategoryFormData) {
  const { user, supabase } = await verifyAdmin()

  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert(data)
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await logAudit(user.id, 'create', newCategory.id, data)
  revalidatePath('/admin/categories')
  return newCategory
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>) {
  const { user, supabase } = await verifyAdmin()

  const { error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logAudit(user.id, 'update', id, data)
  revalidatePath('/admin/categories')
}

export async function deleteCategory(id: string) {
  const { user, supabase } = await verifyAdmin()

  // Deletion guards:
  // 1. Check sub-categories
  const { data: children, error: childError } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', id)

  if (childError) throw new Error(childError.message)
  if (children && children.length > 0) {
    throw new Error('Cannot delete a category that has sub-categories. Delete or reassign children first.')
  }

  // 2. Check talent profiles
  // Note: Check category_id or sub_category_id usage
  const { data: talentCategory, error: catError } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('category_id', id)

  if (catError) throw new Error(catError.message)

  const { data: talentSubcat, error: subError } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('sub_category_id', id)

  if (subError) throw new Error(subError.message)

  const talentCount = (talentCategory?.length || 0) + (talentSubcat?.length || 0)
  if (talentCount > 0) {
    throw new Error(`Cannot delete — ${talentCount} talent profile(s) use this category.`)
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logAudit(user.id, 'delete', id, {})
  revalidatePath('/admin/categories')
}

export async function reorderCategories(updates: { id: string; sort_order: number }[]) {
  const { user, supabase } = await verifyAdmin()

  // Perform updates
  const results = await Promise.all(
    updates.map(u =>
      supabase
        .from('categories')
        .update({ sort_order: u.sort_order })
        .eq('id', u.id)
    )
  )

  // Find any errors
  const failed = results.find(r => r.error)
  if (failed && failed.error) {
    throw new Error(failed.error.message)
  }

  await logAudit(user.id, 'reorder', updates[0]?.id || '', updates)
  revalidatePath('/admin/categories')
}
