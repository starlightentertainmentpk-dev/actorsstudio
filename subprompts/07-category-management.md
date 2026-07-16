# Sub-Prompt 07 — Category Management (Admin CRUD)

**Phase:** Tier 1 — Step 7 of 10  
**Depends on:** `03-auth-roles.md` (admin auth working), `02-supabase-schema.md` (`categories` table with self-referencing parent_id)  
**Delivers:** A full admin UI for creating, editing, reordering, and deleting talent categories with unlimited nesting depth.

---

## Context

Categories drive the entire talent categorization system. Examples:
- Actor → Film Actor, TV Actor, Theatre Actor, Child Actor
- Model → Fashion Model, Commercial Model, Runway Model, Fitness Model
- Voice Artist → Dubbing Artist, Radio Jockey, Podcast Host

Admins must be able to manage this tree without code deployments.

---

## Tasks

### 1. Admin categories page

`src/app/(dashboard)/admin/categories/page.tsx`:

- Protected: only `super_admin` and `studio_admin` roles.
- Use `RoleGuard` from prompt 03.

### 2. Category tree fetching

`src/lib/categories.ts`:

```ts
import { createClient } from '@/lib/supabase/server'

export type CategoryNode = {
  id: string
  name: string
  slug: string
  sort_order: number
  parent_id: string | null
  children: CategoryNode[]
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const supabase = await createClient()
  const { data: flat } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, sort_order')
    .order('sort_order', { ascending: true })

  return buildTree(flat ?? [])
}

function buildTree(flat: any[], parentId: string | null = null): CategoryNode[] {
  return flat
    .filter(c => c.parent_id === parentId)
    .map(c => ({ ...c, children: buildTree(flat, c.id) }))
}
```

### 3. Category tree UI component

`src/components/features/admin/CategoryTree.tsx`:

- Renders the tree as a nested, collapsible list.
- Each node shows:
  - Expand/collapse toggle (if it has children)
  - Category name
  - Drag handle (for reordering within the same level)
  - "Add Sub-category" button
  - Edit (pencil icon) button
  - Delete (trash icon) button — disabled if the category has children or is assigned to any talent
- Use `@dnd-kit` for drag-and-drop reordering within a level.
- Indent children visually with left border (`border-l-2 border-brand-500/30 pl-4`).

```tsx
// Example tree item rendering
function CategoryTreeItem({ node, depth = 0 }: { node: CategoryNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div>
      <div className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-surface-800 group`}
           style={{ marginLeft: depth * 20 }}>
        {node.children.length > 0 && (
          <button onClick={() => setExpanded(e => !e)}>
            <ChevronRight className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />
          </button>
        )}
        <GripVertical className="h-4 w-4 text-surface-600 cursor-grab opacity-0 group-hover:opacity-100" />
        <span className="flex-1 text-sm font-medium">{node.name}</span>
        <Badge variant="outline" className="text-xs text-surface-500">{node.slug}</Badge>
        <Button size="icon" variant="ghost" onClick={() => onAddChild(node)}>
          <Plus className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onEdit(node)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(node)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {expanded && node.children.length > 0 && (
        <div className="border-l-2 border-brand-500/20 ml-6">
          {node.children.map(child => (
            <CategoryTreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### 4. Create / Edit category modal

`src/components/features/admin/CategoryFormModal.tsx`:

Fields:
- **Name** — text input (required)
- **Slug** — auto-generated from name (slugified), editable
- **Parent Category** — select dropdown of all existing categories (optional; leave empty for root)
- **Sort Order** — number input (default: last in current level + 1)

Zod schema:
```ts
const categorySchema = z.object({
  name:      z.string().min(2, 'Name must be at least 2 characters'),
  slug:      z.string().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.coerce.number().min(0).default(0),
})
```

Server actions:

```ts
// src/app/(dashboard)/admin/categories/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCategory(data: CategoryFormData) {
  const supabase = await createClient()
  // Verify caller is admin (server-side check)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['super_admin', 'studio_admin'].includes(userData?.role)) throw new Error('Forbidden')

  const { error } = await supabase.from('categories').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categories')
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>) {
  // ... same auth check, then update
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  // Check if category has children or is used by any talent_profiles
  const { data: children } = await supabase.from('categories').select('id').eq('parent_id', id)
  if (children?.length) throw new Error('Cannot delete a category that has sub-categories. Delete or reassign children first.')
  const { data: talents } = await supabase.from('talent_profiles').select('id').eq('category_id', id)
  if (talents?.length) throw new Error(`Cannot delete — ${talents.length} talent profiles use this category.`)
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categories')
}

export async function reorderCategories(updates: { id: string; sort_order: number }[]) {
  const supabase = await createClient()
  await Promise.all(
    updates.map(u => supabase.from('categories').update({ sort_order: u.sort_order }).eq('id', u.id))
  )
  revalidatePath('/admin/categories')
}
```

### 5. Delete confirmation dialog

Use shadcn `AlertDialog`. On delete attempt:
- If category has children: show error toast instead of confirmation.
- If category has talent: show count in dialog ("3 talent profiles use this category. They will be uncategorized. Proceed?").
- On confirm: call `deleteCategory()` server action.

### 6. Audit logging

Wrap all category mutations in an audit log insert:

```ts
async function logAudit(supabase: any, action: string, entityId: string, payload: any) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    actor_id: user?.id,
    action,
    entity: 'categories',
    entity_id: entityId,
    payload_json: payload,
  })
}
```

Call `logAudit(supabase, 'create', newId, data)`, `logAudit(supabase, 'update', id, data)`, `logAudit(supabase, 'delete', id, {})` in each action.

### 7. Admin sidebar update

Add "Categories" link to the admin sidebar:
```
Admin
├── Dashboard
├── Talent Management    ← prompt 12
├── Categories           ← this prompt
├── Casting Calls        ← prompt 09
├── Auditions            ← prompt 13
└── Settings
```

### 8. Seed categories expanded

Update `supabase/seed.sql` to include sub-categories:

```sql
-- Sub-categories for Actor
WITH actor AS (SELECT id FROM categories WHERE slug = 'actor')
INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
  ('Film Actor',    'film-actor',    (SELECT id FROM actor), 1),
  ('TV Actor',      'tv-actor',      (SELECT id FROM actor), 2),
  ('Theatre Actor', 'theatre-actor', (SELECT id FROM actor), 3),
  ('Child Actor',   'child-actor-film', (SELECT id FROM actor), 4);

-- Sub-categories for Model
WITH model AS (SELECT id FROM categories WHERE slug = 'model')
INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
  ('Fashion Model',    'fashion-model',    (SELECT id FROM model), 1),
  ('Commercial Model', 'commercial-model', (SELECT id FROM model), 2),
  ('Fitness Model',    'fitness-model',    (SELECT id FROM model), 3),
  ('Runway Model',     'runway-model',     (SELECT id FROM model), 4);

-- Sub-categories for Voice Artist
WITH va AS (SELECT id FROM categories WHERE slug = 'voice-artist')
INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
  ('Dubbing Artist', 'dubbing-artist', (SELECT id FROM va), 1),
  ('Radio Jockey',   'radio-jockey',   (SELECT id FROM va), 2),
  ('Podcast Host',   'podcast-host',   (SELECT id FROM va), 3);
```

---

## Deliverables checklist

- [ ] `getCategoryTree()` utility building nested tree from flat list
- [ ] `CategoryTree` component with expand/collapse and drag-and-drop reorder
- [ ] `CategoryFormModal` for create and edit (slug auto-generation)
- [ ] Server actions: create, update, delete, reorder with admin role check
- [ ] Delete guard: blocks deletion if children or talent assigned
- [ ] Audit logging on all mutations
- [ ] Delete confirmation with AlertDialog
- [ ] Admin sidebar updated with "Categories" link
- [ ] Expanded seed data with sub-categories
