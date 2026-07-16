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
    !["super_admin", "studio_admin", "studio_staff"].includes(userData.role)
  ) {
    throw new Error("Forbidden")
  }

  return { user, supabase }
}

// Stub function for dispatching notifications (to be implemented fully in Prompt 14)
async function dispatchNotification(params: {
  userId: string
  type: string
  channel: "email" | "in_app" | "whatsapp"
  payload: Record<string, unknown>
}) {
  console.log("Notification dispatched:", params)
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
    entity: "producer_profiles",
    entity_id: entityId,
    payload_json: payload as Json,
  })
  if (error) {
    console.error("Audit log insertion failed:", error)
  }
}

// Action: Verify Producer
export async function verifyProducer(producerId: string, producerUserId: string, companyName: string) {
  const { user } = await verifyAdmin()

  // Update producer profiles to verified = true
  const { error } = await adminClient
    .from("producer_profiles")
    .update({ verified: true, updated_at: new Date().toISOString() })
    .eq("id", producerId)

  if (error) throw error

  // Trigger Notification to the producer
  await dispatchNotification({
    userId: producerUserId,
    type: "producer_verified",
    channel: "email",
    payload: { company_name: companyName },
  })

  // Audit Logging
  await logAudit(user.id, "verify_producer", producerId, { company_name: companyName })

  revalidatePath("/admin/producers")
  return { success: true }
}

// Action: Reject Producer
export async function rejectProducer(
  producerId: string,
  producerUserId: string,
  companyName: string,
  reason: string
) {
  const { user } = await verifyAdmin()

  // Update profile to reset docs URL (allowing re-upload) and mark unverified
  const { error } = await adminClient
    .from("producer_profiles")
    .update({
      verified: false,
      verification_docs_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", producerId)

  if (error) throw error

  // Trigger Notification with Rejection Reason
  await dispatchNotification({
    userId: producerUserId,
    type: "producer_rejected",
    channel: "email",
    payload: {
      company_name: companyName,
      rejection_reason: reason,
    },
  })

  // Audit Logging
  await logAudit(user.id, "reject_producer", producerId, {
    company_name: companyName,
    reason,
  })

  revalidatePath("/admin/producers")
  return { success: true }
}

// Action: Get Signed URLs for Documents Preview
export async function getSignedUrlsForDocs(producerUserId: string) {
  await verifyAdmin()

  // List all files in the producer's storage folder
  const { data: files, error: listError } = await adminClient.storage
    .from("producer-docs")
    .list(producerUserId)

  if (listError) throw listError
  if (!files || files.length === 0) return []

  // Generate signed URLs (valid for 15 minutes) for each file
  const signedFiles = await Promise.all(
    files.map(async (file) => {
      const { data, error } = await adminClient.storage
        .from("producer-docs")
        .createSignedUrl(`${producerUserId}/${file.name}`, 15 * 60)

      return {
        name: file.name,
        url: data?.signedUrl || null,
        error: error?.message || null,
      }
    })
  )

  return signedFiles
}
