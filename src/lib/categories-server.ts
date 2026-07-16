import { createClient } from '@/lib/supabase/server'
import { buildTree, CategoryNode } from './categories'

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const supabase = await createClient()
  const { data: flat } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, sort_order')
    .order('sort_order', { ascending: true })

  return buildTree(flat ?? [])
}
