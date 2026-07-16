'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Layers,
  Search,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryNode } from '@/lib/categories'
import { createClient } from '@/lib/supabase/client'

interface CategoryTreeProps {
  initialTree: CategoryNode[]
  onAddSub: (parent: CategoryNode) => void
  onEdit: (node: CategoryNode) => void
  onDelete: (nodeId: string) => Promise<void>
  onReorder: (updates: { id: string; sort_order: number }[]) => Promise<void>
}

// A recursive search helper to filter the tree
function filterTree(nodes: CategoryNode[], query: string): CategoryNode[] {
  if (!query) return nodes

  const lowerQuery = query.toLowerCase()

  return nodes
    .map(node => {
      // Check if this node matches
      const matchesSelf = node.name.toLowerCase().includes(lowerQuery) || node.slug.toLowerCase().includes(lowerQuery)
      
      // Filter children
      const filteredChildren = node.children ? filterTree(node.children, query) : []
      
      // If matches self or has matching children, keep it
      if (matchesSelf || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        }
      }
      return null
    })
    .filter((n): n is CategoryNode => n !== null)
}

function findSiblingsAndParent(nodes: CategoryNode[], targetId: string): { siblings: CategoryNode[], parentId: string | null } | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return { siblings: nodes, parentId: node.parent_id }
    }
    if (node.children && node.children.length > 0) {
      const result = findSiblingsAndParent(node.children, targetId)
      if (result) return result
    }
  }
  return null
}

function updateTreeOrder(nodes: CategoryNode[], parentId: string | null, newSiblings: CategoryNode[]): CategoryNode[] {
  if (parentId === null) {
    return newSiblings
  }
  return nodes.map(node => {
    if (node.id === parentId) {
      return { ...node, children: newSiblings }
    }
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateTreeOrder(node.children, parentId, newSiblings) }
    }
    return node
  })
}

export function CategoryTree({
  initialTree,
  onAddSub,
  onEdit,
  onDelete,
  onReorder,
}: CategoryTreeProps) {
  const [localTree, setLocalTree] = useState<CategoryNode[]>(initialTree)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  
  // Delete confirm modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<CategoryNode | null>(null)
  const [associatedTalentsCount, setAssociatedTalentsCount] = useState<number>(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    setLocalTree(initialTree)
  }, [initialTree])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeContext = findSiblingsAndParent(localTree, activeId)
    if (!activeContext) return

    const { siblings, parentId } = activeContext
    const overInSiblings = siblings.some(s => s.id === overId)
    
    if (!overInSiblings) {
      // Only allow reordering within the same parent
      return
    }

    const oldIndex = siblings.findIndex(s => s.id === activeId)
    const newIndex = siblings.findIndex(s => s.id === overId)

    const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex)

    const updates = reorderedSiblings.map((s, idx) => ({
      id: s.id,
      sort_order: idx + 1,
    }))

    // Optimistic update
    const updatedTree = updateTreeOrder(localTree, parentId, reorderedSiblings)
    setLocalTree(updatedTree)

    try {
      await onReorder(updates)
    } catch (err: any) {
      console.error('Failed to reorder categories:', err)
      // Rollback
      setLocalTree(initialTree)
    }
  }

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }

  const handleDeleteClick = async (node: CategoryNode) => {
    setDeleteError('')
    
    // Check if category has sub-categories
    if (node.children && node.children.length > 0) {
      alert('Cannot delete a category that has sub-categories. Delete or reassign sub-categories first.')
      return
    }

    setNodeToDelete(node)
    setDeleteConfirmOpen(true)
    setAssociatedTalentsCount(0)

    try {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('talent_profiles')
        .select('id', { count: 'exact', head: true })
        .or(`category_id.eq.${node.id},sub_category_id.eq.${node.id}`)

      if (error) throw error
      setAssociatedTalentsCount(count || 0)
    } catch (err) {
      console.error('Failed to fetch associated talents:', err)
    }
  }

  const handleConfirmDelete = async () => {
    if (!nodeToDelete) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await onDelete(nodeToDelete.id)
      setDeleteConfirmOpen(false)
      setNodeToDelete(null)
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete category.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredData = filterTree(localTree, searchQuery)

  return (
    <div className="space-y-4">
      {/* Search and Header */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border/80 rounded-xl text-sm outline-none focus:ring-1 focus:ring-brand-500 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="border border-border/40 bg-card/20 rounded-2xl p-4 min-h-[300px]">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Layers className="h-10 w-10 text-muted-foreground/60 mb-2 stroke-1" />
              <p className="text-sm font-semibold">No categories found</p>
              <p className="text-xs mt-1">Create a root category to start building your taxonomy.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <SortableContext
                items={filteredData.map(node => node.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredData.map(node => (
                  <CategoryTreeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    expandedNodes={expandedNodes}
                    toggleExpand={toggleExpand}
                    onAddSub={onAddSub}
                    onEdit={onEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </div>
      </DndContext>

      {/* Delete Confirmation Alert Dialog */}
      {deleteConfirmOpen && nodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Confirm Deletion
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete the category <strong className="text-foreground">"{nodeToDelete.name}"</strong>?
            </p>

            {associatedTalentsCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl p-3.5 mb-4 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Warning
                </p>
                <p>
                  There are <strong className="font-bold">{associatedTalentsCount}</strong> talent profiles currently assigned to this category.
                  Deleting this category will set their category to null (uncategorized).
                </p>
              </div>
            )}

            {deleteError && (
              <p className="text-red-500 text-xs font-semibold p-2 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Proceed Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TreeItemProps {
  node: CategoryNode
  depth: number
  expandedNodes: Record<string, boolean>
  toggleExpand: (nodeId: string) => void
  onAddSub: (parent: CategoryNode) => void
  onEdit: (node: CategoryNode) => void
  onDelete: (node: CategoryNode) => void
}

function CategoryTreeItem({
  node,
  depth,
  expandedNodes,
  toggleExpand,
  onAddSub,
  onEdit,
  onDelete,
}: TreeItemProps) {
  const isExpanded = expandedNodes[node.id] !== false // Default to true if not explicitly set to false
  const hasChildren = node.children && node.children.length > 0

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      {/* Node Row */}
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-card border border-transparent hover:border-border/40 group transition-all"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => toggleExpand(node.id)}
          className={`h-5 w-5 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground cursor-pointer transition-transform ${
            hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${isExpanded ? 'rotate-90' : ''}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-foreground text-muted-foreground p-1 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Category Label */}
        <span className="flex-1 text-sm font-semibold text-foreground truncate">
          {node.name}
        </span>
        
        {/* Category Slug Badge */}
        <span className="text-[10px] text-muted-foreground bg-muted font-medium px-2 py-0.5 rounded-full border border-border/30">
          {node.slug}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg cursor-pointer"
            onClick={() => onAddSub(node)}
            title="Add Sub-category"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg cursor-pointer"
            onClick={() => onEdit(node)}
            title="Edit Category"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg cursor-pointer"
            onClick={() => onDelete(node)}
            title="Delete Category"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children list */}
      {isExpanded && hasChildren && (
        <div className="border-l border-brand-500/20 my-1 ml-6 pl-1">
          <SortableContext
            items={node.children.map(child => child.id)}
            strategy={verticalListSortingStrategy}
          >
            {node.children.map(child => (
              <CategoryTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
                onAddSub={onAddSub}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  )
}
