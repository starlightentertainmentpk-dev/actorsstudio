import { renderToBuffer } from '@react-pdf/renderer'
import { TalentOverviewPDF } from '@/lib/pdf/TalentOverviewPDF'
import { TalentFullProfilePDF } from '@/lib/pdf/TalentFullProfilePDF'
import { CompCardPDF } from '@/lib/pdf/CompCard'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import React from 'react'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'overview' // 'overview' | 'full' | 'comp_card'
  const disposition = searchParams.get('disposition') === 'attachment' ? 'attachment' : 'inline'

  const supabase = await createClient()

  // 1. Fetch talent profile by slug or by UUID
  let query = supabase.from('talent_profiles').select('*, users(email, phone)')

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  let talent: any = null

  if (isUuid) {
    const { data } = await query.or(`id.eq.${slug},user_id.eq.${slug}`).maybeSingle()
    talent = data
  } else {
    const { data } = await query.eq('slug', slug).maybeSingle()
    talent = data
  }

  // Fallback to adminClient if not found or RLS prevented reading non-approved profile
  if (!talent) {
    let adminQuery = adminClient.from('talent_profiles').select('*, users(email, phone)')
    if (isUuid) {
      const { data } = await adminQuery.or(`id.eq.${slug},user_id.eq.${slug}`).maybeSingle()
      talent = data
    } else {
      const { data } = await adminQuery.eq('slug', slug).maybeSingle()
      talent = data
    }
  }

  if (!talent) {
    return new Response('Talent profile not found', { status: 404 })
  }

  // 2. Fetch category and subcategory names
  let categoryName = ''
  let subCategoryName = ''
  const categoryIds = [talent.category_id, talent.sub_category_id].filter(Boolean) as string[]

  if (categoryIds.length > 0) {
    const { data: categories } = await adminClient
      .from('categories')
      .select('id, name')
      .in('id', categoryIds)

    categoryName = categories?.find((c) => c.id === talent.category_id)?.name || ''
    subCategoryName = categories?.find((c) => c.id === talent.sub_category_id)?.name || ''
  }

  // 3. Fetch media assets (photos, reels, voice, documents)
  const { data: mediaAssets } = await adminClient
    .from('media_assets')
    .select('*')
    .eq('owner_id', talent.user_id)
    .order('sort_order', { ascending: true })

  // Construct consolidated talent object
  const talentWithDetails = {
    ...talent,
    category_name: categoryName,
    sub_category_name: subCategoryName,
    media_assets: mediaAssets || [],
  }

  try {
    let pdfComponent: any
    let filenameSuffix = 'profile'

    if (type === 'full') {
      pdfComponent = <TalentFullProfilePDF talent={talentWithDetails} />
      filenameSuffix = 'full-profile'
    } else if (type === 'comp_card') {
      pdfComponent = <CompCardPDF talent={talentWithDetails} />
      filenameSuffix = 'comp-card'
    } else {
      // Default: overview
      pdfComponent = <TalentOverviewPDF talent={talentWithDetails} />
      filenameSuffix = 'overview-bio'
    }

    const buffer = await renderToBuffer(pdfComponent as any)
    const safeFilename = `${talent.slug || talent.id || 'talent'}-${filenameSuffix}.pdf`

    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${safeFilename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('Error rendering talent PDF:', error)
    return new Response(`Error rendering talent PDF: ${error.message || error}`, { status: 500 })
  }
}
