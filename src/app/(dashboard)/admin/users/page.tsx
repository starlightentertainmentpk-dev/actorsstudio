"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { createClient } from "@/lib/supabase/client"
import { updateUserRole, updateUserStatus } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Search,
  AlertCircle,
  User,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Users
} from "lucide-react"
import type { Database } from "@/types/database"

type UserRow = Database["public"]["Tables"]["users"]["Row"]

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin", "studio_admin"])
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Search & Filter UI states
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Action status indicators
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")

  // Query all users from database
  const { data: usersList = [], isLoading: dataLoading } = useQuery<UserRow[]>({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  // Handle User Role Change
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to "${newRole.replace(/_/g, " ")}"?`)) return
    setActionLoadingId(userId)
    setActionError("")
    setActionSuccess("")

    try {
      const result = await updateUserRole(userId, newRole)
      if (result.success) {
        setActionSuccess("User role updated successfully!")
        queryClient.invalidateQueries({ queryKey: ["admin-users-list"] })
        setTimeout(() => setActionSuccess(""), 3000)
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to update user role.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handle User Status Change (Suspend / Unsuspend)
  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const isSuspended = currentStatus === "suspended"
    const newStatus = isSuspended ? "active" : "suspended"
    const actionText = isSuspended ? "unsuspend" : "suspend"

    if (!confirm(`Are you sure you want to ${actionText} this user account?`)) return
    setActionLoadingId(userId)
    setActionError("")
    setActionSuccess("")

    try {
      const result = await updateUserStatus(userId, newStatus)
      if (result.success) {
        setActionSuccess(`User account has been ${isSuspended ? "unsuspended and reactivated" : "suspended"} successfully!`)
        queryClient.invalidateQueries({ queryKey: ["admin-users-list"] })
        setTimeout(() => setActionSuccess(""), 3000)
      }
    } catch (err: any) {
      setActionError(err.message || `Failed to ${actionText} user account.`)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filtered list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    const matchesStatus = statusFilter === "all" || u.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; style: string }> = {
      super_admin: { label: "Super Admin", style: "bg-red-500/10 text-red-500 border border-red-500/20" },
      studio_admin: { label: "Studio Admin", style: "bg-pink-500/10 text-pink-500 border border-pink-500/20" },
      studio_staff: { label: "Studio Staff", style: "bg-purple-500/10 text-purple-500 border border-purple-500/20" },
      talent: { label: "Talent / Artist", style: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
      producer_brand: { label: "Producer / Brand", style: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
      casting_director: { label: "Casting Director", style: "bg-teal-500/10 text-teal-500 border border-teal-500/20" },
      agent_manager: { label: "Agent Manager", style: "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20" },
    }

    const config = roleConfig[role] || { label: role, style: "bg-muted text-muted-foreground" }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.style}`}>
        {config.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; style: string }> = {
      active: { label: "Active", style: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
      suspended: { label: "Suspended", style: "bg-red-500/10 text-red-500 border border-red-500/20" },
      deleted: { label: "Deleted", style: "bg-neutral-800 text-neutral-400 border border-neutral-700" },
    }

    const config = statusConfig[status] || { label: status, style: "bg-muted text-muted-foreground" }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.style}`}>
        {config.label}
      </span>
    )
  }

  const pageLoading = authLoading || dataLoading

  if (pageLoading) {
    return (
      <DashboardShell role="admin">
        <div className="flex h-[50vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-xs text-muted-foreground">Loading users list...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <Users className="h-8 w-8 text-brand-500" />
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure system roles, suspend/reactivate accounts, and manage platform permissions.
            </p>
          </div>
        </div>

        {actionError && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 flex items-start gap-2 animate-in fade-in-50">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Action Failed</p>
              <p className="text-xs mt-0.5">{actionError}</p>
            </div>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl border border-emerald-500/20 flex items-start gap-2 animate-in fade-in-50">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Success</p>
              <p className="text-xs mt-0.5">{actionSuccess}</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {/* Role Filter dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-input bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admins</option>
              <option value="studio_admin">Studio Admins</option>
              <option value="talent">Talent / Artists</option>
              <option value="producer_brand">Producers</option>
              <option value="casting_director">Casting Directors</option>
              <option value="agent_manager">Agent Managers</option>
            </select>

            {/* Status Filter dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-input bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Email or User ID..."
              className="w-full pl-9 pr-4 py-2 border border-input rounded-xl bg-background/50 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card/20 border border-border/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShieldAlert className="h-10 w-10 text-brand-500 bg-brand-500/10 p-2 rounded-full mb-3" />
              <p className="text-base font-bold text-foreground">No users found</p>
              <p className="text-sm mt-1 text-muted-foreground/80">
                Try modifying your search or filter options.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-card/40 text-muted-foreground font-semibold">
                    <th className="p-4">User Details</th>
                    <th className="p-4">Role Badge</th>
                    <th className="p-4">Active Status</th>
                    <th className="p-4">Created At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredUsers.map((u) => {
                    const formattedDate = new Date(u.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                    const isProcessing = actionLoadingId === u.id
                    const isDeleted = u.status === "deleted"

                    return (
                      <tr key={u.id} className="hover:bg-card/10 transition-colors group">
                        {/* User Details */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                              {u.email}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                              ID: {u.id}
                            </span>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-4">
                          {isDeleted ? (
                            getRoleBadge(u.role)
                          ) : (
                            <select
                              value={u.role}
                              disabled={isProcessing}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium transition-all"
                            >
                              <option value="talent">Talent / Artist</option>
                              <option value="producer_brand">Producer / Brand</option>
                              <option value="casting_director">Casting Director</option>
                              <option value="agent_manager">Agent Manager</option>
                              <option value="studio_staff">Studio Staff</option>
                              <option value="studio_admin">Studio Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          )}
                        </td>

                        {/* Active Status */}
                        <td className="p-4">
                          {getStatusBadge(u.status)}
                        </td>

                        {/* Created At */}
                        <td className="p-4 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formattedDate}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isProcessing ? (
                              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                            ) : isDeleted ? (
                              <span className="text-xs text-muted-foreground font-semibold px-2">Account Deleted</span>
                            ) : (
                              <Button
                                size="sm"
                                variant={u.status === "suspended" ? "outline" : "ghost"}
                                onClick={() => handleStatusToggle(u.id, u.status)}
                                className={`text-xs font-semibold h-8 rounded-lg border border-border/50 cursor-pointer ${
                                  u.status === "suspended"
                                    ? "text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20"
                                    : "text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent"
                                }`}
                              >
                                {u.status === "suspended" ? "Unsuspend" : "Suspend"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
