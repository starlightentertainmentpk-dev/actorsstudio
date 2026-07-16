import { renderToBuffer } from '@react-pdf/renderer'
import { CompCardPDF } from '@/lib/pdf/CompCard'
import { createClient } from '@/lib/supabase/server'
import React from 'react'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Fetch the approved talent profile
  const { data: talent, error: talentError } = await supabase
    .from('talent_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('verification_status', 'approved')
    .single()

  if (talentError || !talent) {
    return new Response('Talent not found or not approved', { status: 404 })
  }

  // 2. Fetch category and subcategory names using their UUIDs
  let categoryName = ''
  let subCategoryName = ''
  const categoryIds = [talent.category_id, talent.sub_category_id].filter(Boolean) as string[]
  
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds)
    
    categoryName = categories?.find(c => c.id === talent.category_id)?.name || ''
    subCategoryName = categories?.find(c => c.id === talent.sub_category_id)?.name || ''
  }

  // 3. Fetch media assets for this talent (using owner_id = user_id relationship)
  const { data: mediaAssets } = await supabase
    .from('media_assets')
    .select('*')
    .eq('owner_id', talent.user_id)
    .order('sort_order', { ascending: true })

  // Construct consolidated talent object
  const talentWithDetails = {
    ...talent,
    category_name: categoryName,
    sub_category_name: subCategoryName,
    media_assets: mediaAssets || []
  }

  try {
    // Render the Comp Card React PDF component to a Buffer
    const buffer = await renderToBuffer(
      <CompCardPDF talent={talentWithDetails} />
    )

    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${talent.slug}-comp-card.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating comp card PDF:', error)
    return new Response(`Error generating PDF: ${error.message || error}`, { status: 500 })
  }
}
