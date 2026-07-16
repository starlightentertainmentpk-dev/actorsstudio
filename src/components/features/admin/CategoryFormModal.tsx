'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryNode } from '@/lib/categories'

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.coerce.number().min(0).default(0),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CategoryFormData) => Promise<void>
  initialData?: CategoryNode | null
  categories: CategoryNode[]
  isSubmitting?: boolean
}

function flattenTree(nodes: CategoryNode[], depth = 0): { id: string; name: string; depth: number }[] {
  let list: { id: string; name: string; depth: number }[] = []
  for (const node of nodes) {
    list.push({ id: node.id, name: node.name, depth })
    if (node.children && node.children.length > 0) {
      list = list.concat(flattenTree(node.children, depth + 1))
    }
  }
  return list
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  isSubmitting = false,
}: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      parent_id: '',
      sort_order: 0,
    },
  })

  // Auto-generate slug from name
  const nameValue = watch('name')
  useEffect(() => {
    if (nameValue && !initialData) {
      const generatedSlug = nameValue
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
        .replace(/\s+/g, '-')         // Replace spaces with -
        .replace(/-+/g, '-')          // Collapse multiple hyphens
      setValue('slug', generatedSlug, { shouldValidate: true })
    }
  }, [nameValue, setValue, initialData])

  // Reset form when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          slug: initialData.slug,
          parent_id: initialData.parent_id || '',
          sort_order: initialData.sort_order,
        })
      } else {
        reset({
          name: '',
          slug: '',
          parent_id: '',
          sort_order: 0,
        })
      }
    }
  }, [isOpen, initialData, reset])

  if (!isOpen) return null

  // Flatten the category list, excluding the current category and its children to avoid self-referencing loops
  const allFlattened = flattenTree(categories)
  
  // Helper to find all child IDs recursively
  const getChildIds = (node: CategoryNode): string[] => {
    let ids = [node.id]
    if (node.children) {
      for (const child of node.children) {
        ids = ids.concat(getChildIds(child))
      }
    }
    return ids
  }

  const excludedIds = initialData ? getChildIds(initialData) : []
  const availableParents = allFlattened.filter(cat => !excludedIds.includes(cat.id))

  const handleFormSubmit = async (data: any) => {
    // Convert empty string parent_id to null
    const formattedData = {
      ...data,
      parent_id: data.parent_id === '' ? null : data.parent_id,
    }
    await onSubmit(formattedData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="font-heading text-lg font-bold text-foreground mb-4">
          {initialData ? 'Edit Category' : 'Create Category'}
        </h3>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Category Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Film Actor"
              {...register('name')}
              className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm text-foreground focus:ring-1 focus:ring-brand-500 outline-none"
            />
            {errors.name?.message && (
              <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.name.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Slug *
            </label>
            <input
              type="text"
              placeholder="e.g. film-actor"
              {...register('slug')}
              className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm text-foreground focus:ring-1 focus:ring-brand-500 outline-none"
            />
            {errors.slug?.message && (
              <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.slug.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Parent Category (Optional)
            </label>
            <select
              {...register('parent_id')}
              className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm text-foreground focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer"
            >
              <option value="">None (Root Category)</option>
              {availableParents.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {'\u00A0'.repeat(cat.depth * 2)}
                  {cat.depth > 0 ? '↳ ' : ''}
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.parent_id?.message && (
              <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.parent_id.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Sort Order
            </label>
            <input
              type="number"
              {...register('sort_order')}
              className="w-full px-3.5 py-2 border border-border rounded-xl bg-background text-sm text-foreground focus:ring-1 focus:ring-brand-500 outline-none"
            />
            {errors.sort_order?.message && (
              <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.sort_order.message as string}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialData ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
