export type CategoryNode = {
  id: string
  name: string
  slug: string
  sort_order: number
  parent_id: string | null
  children: CategoryNode[]
}

export function buildTree(flat: any[], parentId: string | null = null): CategoryNode[] {
  return flat
    .filter(c => c.parent_id === parentId)
    .map(c => ({ ...c, children: buildTree(flat, c.id) }))
}
