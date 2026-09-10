"use server"

import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Json } from "@/types/database"
import { dispatchNotification } from "@/lib/notifications"

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
  const { user, supabase } = await verifyAdmin()

  // Update producer profiles to verified = true
  const { error } = await adminClient
    .from("producer_profiles")
    .update({ verified: true, updated_at: new Date().toISOString() })
    .eq("id", producerId)

  if (error) throw error

  // Fetch producer email from users table
  const { data: userData } = await supabase
    .from("users")
    .select("email")
    .eq("id", producerUserId)
    .single()

  if (userData?.email) {
    // Trigger Notification to the producer
    await dispatchNotification({
      targetEmail: userData.email,
      type: "producer_approved",
      payload: { company_name: companyName },
    })
  } else {
    console.warn(`Could not find email for user ID ${producerUserId} to send verification notification.`)
  }

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
  const { user, supabase } = await verifyAdmin()

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

  // Fetch producer email from users table
  const { data: userData } = await supabase
    .from("users")
    .select("email")
    .eq("id", producerUserId)
    .single()

  if (userData?.email) {
    // Trigger Notification with Rejection Reason
    await dispatchNotification({
      targetEmail: userData.email,
      type: "producer_rejected",
      payload: {
        company_name: companyName,
        reason: reason,
      },
    })
  } else {
    console.warn(`Could not find email for user ID ${producerUserId} to send rejection notification.`)
  }

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
