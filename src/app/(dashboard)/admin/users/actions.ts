"use server"

import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Json } from "@/types/database"

// Verify Admin Permissions helper
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Unauthorized")

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (
    userError ||
    !userData ||
    !["super_admin", "studio_admin"].includes(userData.role)
  ) {
    throw new Error("Forbidden")
  }

  return { user, supabase }
}

// Audit logging helper using adminClient
async function logAudit(
  actorId: string,
  action: string,
  entityId: string,
  payload: Record<string, unknown>
) {
  const { error } = await adminClient.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity: "users",
    entity_id: entityId,
    payload_json: payload as Json,
  })
  if (error) {
    console.error("Audit log insertion failed:", error)
  }
}

// Action: Update User Role
export async function updateUserRole(targetUserId: string, newRole: string) {
  const { user } = await verifyAdmin()

  // Get current user role for logging
  const { data: oldUser } = await adminClient
    .from("users")
    .select("role")
    .eq("id", targetUserId)
    .single()

  const { error } = await adminClient
    .from("users")
    .update({ role: newRole as any })
    .eq("id", targetUserId)

  if (error) throw error

  // Log the audit activity using adminClient
  await logAudit(user.id, "update_user_role", targetUserId, {
    old_role: oldUser?.role || null,
    new_role: newRole,
  })

  revalidatePath("/admin/users")
  return { success: true }
}

// Action: Update User Status
export async function updateUserStatus(targetUserId: string, newStatus: string) {
  const { user } = await verifyAdmin()

  // Get current user status for logging
  const { data: oldUser } = await adminClient
    .from("users")
    .select("status")
    .eq("id", targetUserId)
    .single()

  const { error } = await adminClient
    .from("users")
    .update({ status: newStatus })
    .eq("id", targetUserId)

  if (error) throw error

  // Log the audit activity using adminClient
  await logAudit(user.id, "update_user_status", targetUserId, {
    old_status: oldUser?.status || null,
    new_status: newStatus,
  })

  revalidatePath("/admin/users")
  return { success: true }
}
