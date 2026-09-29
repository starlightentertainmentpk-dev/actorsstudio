'use server'

import { createClient } from '@/lib/supabase/server'
import { clientSchema, clientContactSchema, agencyTaskSchema } from '@/lib/validations/client'
import { revalidatePath } from 'next/cache'

export async function createClientAction(orgId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized: Please log in.' }
    }

    const producerProfileId = formData.get('producer_profile_id')
    const raw = {
      company_name: formData.get('company_name')?.toString() || '',
      industry: formData.get('industry')?.toString() || 'Entertainment & Film',
      website: formData.get('website')?.toString() || undefined,
      country: formData.get('country')?.toString() || 'Pakistan',
      city: formData.get('city')?.toString() || 'Karachi',
      address: formData.get('address')?.toString() || undefined,
      billing_email: formData.get('billing_email')?.toString() || undefined,
      phone: formData.get('phone')?.toString() || undefined,
      status: (formData.get('status')?.toString() as any) || 'active',
      internal_notes: formData.get('internal_notes')?.toString() || undefined,
    }

    const validated = clientSchema.parse(raw)

    const payload: any = {
      ...validated,
      organization_id: orgId,
    }

    if (producerProfileId && producerProfileId.toString().trim() !== '') {
      payload.producer_profile_id = producerProfileId.toString()
    }

    const { data, error } = await supabase
      .from('clients')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/agency/clients')
    return { success: true, clientId: data.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create client account.' }
  }
}

export async function updateClientAction(clientId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const producerProfileId = formData.get('producer_profile_id')
    const raw = {
      company_name: formData.get('company_name')?.toString() || '',
      industry: formData.get('industry')?.toString() || 'Entertainment & Film',
      website: formData.get('website')?.toString() || undefined,
      country: formData.get('country')?.toString() || 'Pakistan',
      city: formData.get('city')?.toString() || 'Karachi',
      address: formData.get('address')?.toString() || undefined,
      billing_email: formData.get('billing_email')?.toString() || undefined,
      phone: formData.get('phone')?.toString() || undefined,
      status: (formData.get('status')?.toString() as any) || 'active',
      internal_notes: formData.get('internal_notes')?.toString() || undefined,
    }

    const validated = clientSchema.parse(raw)

    const updatePayload: any = {
      ...validated,
      updated_at: new Date().toISOString(),
    }

    if (producerProfileId !== null) {
      updatePayload.producer_profile_id =
        producerProfileId.toString().trim() !== '' ? producerProfileId.toString() : null
    }

    const { error } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', clientId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/agency/clients')
    revalidatePath(`/agency/clients/${clientId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update client.' }
  }
}

export async function deleteClientAction(clientId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase.from('clients').delete().eq('id', clientId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/agency/clients')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete client.' }
  }
}

export async function addContactAction(orgId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const raw = {
      client_id: formData.get('client_id')?.toString() || '',
      full_name: formData.get('full_name')?.toString() || '',
      role_title: formData.get('role_title')?.toString() || undefined,
      email: formData.get('email')?.toString() || '',
      phone: formData.get('phone')?.toString() || undefined,
      whatsapp_number: formData.get('whatsapp_number')?.toString() || undefined,
      is_primary: formData.get('is_primary') === 'true' || formData.get('is_primary') === 'on',
      notes: formData.get('notes')?.toString() || undefined,
    }

    const validated = clientContactSchema.parse(raw)

    // If marked as primary, reset existing primary contacts for this client
    if (validated.is_primary) {
      await supabase
        .from('client_contacts')
        .update({ is_primary: false })
        .eq('client_id', validated.client_id)
    }

    const { error } = await supabase.from('client_contacts').insert({
      client_id: validated.client_id,
      organization_id: orgId,
      full_name: validated.full_name,
      role_title: validated.role_title || null,
      email: validated.email,
      phone: validated.phone || null,
      whatsapp_number: validated.whatsapp_number || null,
      is_primary: validated.is_primary,
      notes: validated.notes || null,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/agency/clients/${validated.client_id}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to add contact.' }
  }
}

export async function deleteContactAction(contactId: string, clientId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase.from('client_contacts').delete().eq('id', contactId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/agency/clients/${clientId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete contact.' }
  }
}

export async function addClientNoteAction(clientId: string, noteText: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!noteText || noteText.trim().length === 0) {
      return { success: false, error: 'Note text cannot be empty.' }
    }

    const { error } = await supabase.from('client_notes').insert({
      client_id: clientId,
      author_id: user.id,
      note_text: noteText.trim(),
      is_pinned: false,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/agency/clients/${clientId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to post note.' }
  }
}

export async function togglePinNoteAction(noteId: string, clientId: string, currentPinned: boolean) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('client_notes')
      .update({ is_pinned: !currentPinned })
      .eq('id', noteId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/agency/clients/${clientId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update pin status.' }
  }
}

export async function deleteClientNoteAction(noteId: string, clientId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase.from('client_notes').delete().eq('id', noteId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/agency/clients/${clientId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete note.' }
  }
}

export async function createAgencyTaskAction(orgId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const clientId = formData.get('client_id')?.toString() || undefined
    const raw = {
      client_id: clientId,
      title: formData.get('title')?.toString() || '',
      description: formData.get('description')?.toString() || undefined,
      priority: (formData.get('priority')?.toString() as any) || 'medium',
      status: (formData.get('status')?.toString() as any) || 'todo',
      due_date: formData.get('due_date')?.toString() || undefined,
    }

    const validated = agencyTaskSchema.parse(raw)

    const { error } = await supabase.from('agency_tasks').insert({
      organization_id: orgId,
      client_id: validated.client_id || null,
      created_by_user_id: user.id,
      title: validated.title,
      description: validated.description || null,
      priority: validated.priority,
      status: validated.status,
      due_date: validated.due_date || null,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (validated.client_id) {
      revalidatePath(`/agency/clients/${validated.client_id}`)
    }
    revalidatePath('/agency/clients')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create agency task.' }
  }
}

export async function updateAgencyTaskStatusAction(
  taskId: string,
  clientId: string | null,
  status: 'todo' | 'in_progress' | 'completed'
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('agency_tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId)

    if (error) {
      return { success: false, error: error.message }
    }

    if (clientId) {
      revalidatePath(`/agency/clients/${clientId}`)
    }
    revalidatePath('/agency/clients')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update task status.' }
  }
}

export async function deleteAgencyTaskAction(taskId: string, clientId: string | null) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase.from('agency_tasks').delete().eq('id', taskId)

    if (error) {
      return { success: false, error: error.message }
    }

    if (clientId) {
      revalidatePath(`/agency/clients/${clientId}`)
    }
    revalidatePath('/agency/clients')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete task.' }
  }
}
