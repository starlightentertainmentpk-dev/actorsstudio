'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Layers, Loader2, AlertCircle } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { DashboardShell } from '@/components/shared/DashboardShell'
import { CategoryTree } from '@/components/features/admin/CategoryTree'
import { CategoryFormModal } from '@/components/features/admin/CategoryFormModal'
import { buildTree, CategoryNode } from '@/lib/categories'
import { createClient } from '@/lib/supabase/client'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from './actions'

export default function AdminCategoriesPage() {
  const { user, isLoading: authLoading } = useRequireAuth(['super_admin', 'studio_admin'])
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Query flat categories
  const { data: flatCategories = [], isLoading: queryLoading } = useQuery({
    queryKey: ['admin-categories-flat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  // Build the hierarchical tree
  const categoryTree = buildTree(flatCategories)

  const handleCreateClick = () => {
    setEditingCategory(null)
    setErrorMsg('')
    setModalOpen(true)
  }

  const handleAddSubClick = (parent: CategoryNode) => {
    setErrorMsg('')
    setEditingCategory({
      id: '',
      name: '',
      slug: '',
      sort_order: 0,
      parent_id: parent.id,
      children: [],
    })
    setModalOpen(true)
  }

  const handleEditClick = (node: CategoryNode) => {
    setErrorMsg('')
    setEditingCategory(node)
    setModalOpen(true)
  }

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      if (editingCategory && editingCategory.id) {
        // Edit existing
        await updateCategory(editingCategory.id, data)
      } else {
        // Create new (could be root or sub-category)
        const parentId = editingCategory?.parent_id || data.parent_id
        await createCategory({
          ...data,
          parent_id: parentId || null,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['admin-categories-flat'] })
      setModalOpen(false)
      setEditingCategory(null)
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteCategory(id)
    queryClient.invalidateQueries({ queryKey: ['admin-categories-flat'] })
  }

  const handleReorder = async (updates: { id: string; sort_order: number }[]) => {
    await reorderCategories(updates)
    queryClient.invalidateQueries({ queryKey: ['admin-categories-flat'] })
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs text-muted-foreground">Authenticating admin...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Layers className="h-8 w-8 text-brand-500" /> Category Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Organize talent taxonomy with infinite nesting depth and order-based styling.
            </p>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-md shadow-brand-500/10 cursor-pointer w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Root Category
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Categories Tree list */}
        {queryLoading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-card/25 border border-border/40 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500 mb-2" />
            <p className="text-xs text-muted-foreground">Loading categories tree...</p>
          </div>
        ) : (
          <CategoryTree
            initialTree={categoryTree}
            onAddSub={handleAddSubClick}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        )}
      </div>

      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingCategory}
        categories={categoryTree}
        isSubmitting={isSubmitting}
      />
    </DashboardShell>
  )
}
