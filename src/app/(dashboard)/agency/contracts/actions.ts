'use server'

import { createClient } from '@/lib/supabase/server'
import { compileContractTemplate, extractTokensFromTemplate } from '@/lib/contracts/merge-engine'
import { revalidatePath } from 'next/cache'

export async function generateContractFromBookingAction(data: {
  orgId: string
  templateId: string
  bookingId: string
}) {
  const supabase = await createClient()

  // 1. Fetch template
  const { data: template, error: tmplErr } = await (supabase.from('contract_templates' as any) as any)
    .select('*')
    .eq('id', data.templateId)
    .single()

  if (tmplErr || !template) {
    throw new Error('Contract template not found')
  }

  // 2. Fetch booking, client, talent, organization
  const { data: booking, error: bookErr } = await (supabase.from('bookings' as any) as any)
    .select(`
      *,
      client:clients(id, company_name),
      talent:talent_profiles(id, full_name),
      org:organizations(id, name)
    `)
    .eq('id', data.bookingId)
    .single()

  if (bookErr || !booking) {
    throw new Error('Booking not found')
  }

  // 3. Compile variables
  const rendered = compileContractTemplate(template.body_markdown, {
    talent_name: (booking.talent as any)?.full_name || 'Talent',
    client_name: (booking.client as any)?.company_name || 'Client',
    agency_name: (booking.org as any)?.name || "Actor's Studio",
    project_name: booking.project_name,
    fee: `${booking.currency || 'PKR'} ${Number(booking.fee_amount || 0).toLocaleString()}`,
    shoot_dates: `${booking.shoot_date_start} to ${booking.shoot_date_end}`,
    location: booking.location_address || 'To be confirmed',
    usage_rights: booking.usage_rights || 'Standard Commercial',
    territory: booking.territory || 'Pakistan',
    media: booking.media || 'Digital & Broadcast',
    start_date: booking.shoot_date_start,
    end_date: booking.shoot_date_end,
  })

  // 4. Insert contract
  const { data: contract, error } = await (supabase.from('contracts' as any) as any)
    .insert({
      organization_id: data.orgId,
      deal_id: booking.deal_id || null,
      booking_id: booking.id,
      client_id: booking.client_id,
      talent_id: booking.talent_id,
      contract_title: `${template.template_name} — ${booking.project_name}`,
      rendered_body: rendered,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/agency/contracts')
  return { success: true, contractId: contract.id }
}

export async function sendContractForSignatureAction(contractId: string) {
  const supabase = await createClient()

  const { error } = await (supabase.from('contracts' as any) as any)
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)

  if (error) throw new Error(error.message)

  revalidatePath('/agency/contracts')
  revalidatePath(`/contracts/${contractId}`)
  revalidatePath(`/contracts/${contractId}/sign`)
  return { success: true }
}

export async function markContractViewedAction(contractId: string) {
  const supabase = await createClient()

  // Only update to viewed if it is currently in 'sent' state
  const { data: contract } = await (supabase.from('contracts' as any) as any)
    .select('status, viewed_at')
    .eq('id', contractId)
    .single()

  if (contract && contract.status === 'sent') {
    await (supabase.from('contracts' as any) as any)
      .update({
        status: 'viewed',
        viewed_at: contract.viewed_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)
  }

  revalidatePath('/agency/contracts')
  revalidatePath(`/contracts/${contractId}`)
  return { success: true }
}

export async function submitDigitalSignatureAction(
  contractId: string,
  signerData: {
    signerType: 'talent' | 'client' | 'agency_witness'
    signerName: string
    signatureImageData: string
    ipAddress?: string
    userAgent?: string
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Insert signature record
  const { error: sigError } = await (supabase.from('contract_signatures' as any) as any).insert({
    contract_id: contractId,
    signer_type: signerData.signerType,
    signer_user_id: user?.id || null,
    signer_name: signerData.signerName,
    signature_image_data: signerData.signatureImageData,
    ip_address: signerData.ipAddress || null,
    user_agent: signerData.userAgent || null,
  })

  if (sigError) throw new Error(sigError.message)

  // 2. Mark contract as signed
  const { error: updateError } = await (supabase.from('contracts' as any) as any)
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)

  if (updateError) throw new Error(updateError.message)

  revalidatePath('/agency/contracts')
  revalidatePath(`/contracts/${contractId}`)
  revalidatePath(`/contracts/${contractId}/sign`)
  return { success: true }
}

export async function createContractTemplateAction(data: {
  orgId: string
  templateName: string
  contractType: string
  bodyMarkdown: string
  isDefault?: boolean
}) {
  const supabase = await createClient()

  const extractedTokens = extractTokensFromTemplate(data.bodyMarkdown)

  const { data: template, error } = await (supabase.from('contract_templates' as any) as any)
    .insert({
      organization_id: data.orgId,
      template_name: data.templateName,
      contract_type: data.contractType,
      body_markdown: data.bodyMarkdown,
      merge_fields_json: extractedTokens,
      is_default: !!data.isDefault,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/agency/contracts/templates')
  revalidatePath('/agency/contracts')
  return { success: true, templateId: template.id }
}

export async function updateContractTemplateAction(
  templateId: string,
  data: {
    templateName?: string
    contractType?: string
    bodyMarkdown?: string
    isDefault?: boolean
  }
) {
  const supabase = await createClient()

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }
  if (data.templateName !== undefined) updatePayload.template_name = data.templateName
  if (data.contractType !== undefined) updatePayload.contract_type = data.contractType
  if (data.bodyMarkdown !== undefined) {
    updatePayload.body_markdown = data.bodyMarkdown
    updatePayload.merge_fields_json = extractTokensFromTemplate(data.bodyMarkdown)
  }
  if (data.isDefault !== undefined) updatePayload.is_default = data.isDefault

  const { error } = await (supabase.from('contract_templates' as any) as any)
    .update(updatePayload)
    .eq('id', templateId)

  if (error) throw new Error(error.message)

  revalidatePath('/agency/contracts/templates')
  revalidatePath('/agency/contracts')
  return { success: true }
}

export async function deleteContractTemplateAction(templateId: string) {
  const supabase = await createClient()

  const { error } = await (supabase.from('contract_templates' as any) as any)
    .delete()
    .eq('id', templateId)

  if (error) throw new Error(error.message)

  revalidatePath('/agency/contracts/templates')
  return { success: true }
}

export async function saveAgencyDocumentRecordAction(data: {
  orgId: string
  title: string
  category: string
  fileStoragePath: string
  fileSizeBytes?: number
  mimeType?: string
  isPrivate?: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: document, error } = await (supabase.from('agency_documents' as any) as any)
    .insert({
      organization_id: data.orgId,
      title: data.title,
      category: data.category,
      file_storage_path: data.fileStoragePath,
      file_size_bytes: data.fileSizeBytes || null,
      mime_type: data.mimeType || null,
      uploaded_by_user_id: user?.id || null,
      is_private: data.isPrivate !== undefined ? data.isPrivate : true,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/agency/documents')
  return { success: true, documentId: document.id }
}

export async function deleteAgencyDocumentAction(documentId: string) {
  const supabase = await createClient()

  const { error } = await (supabase.from('agency_documents' as any) as any)
    .delete()
    .eq('id', documentId)

  if (error) throw new Error(error.message)

  revalidatePath('/agency/documents')
  return { success: true }
}
