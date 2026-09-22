import { describe, it, expect } from 'vitest'
import { renderToBuffer } from '@react-pdf/renderer'
import { TalentOverviewPDF } from './TalentOverviewPDF'
import { TalentFullProfilePDF } from './TalentFullProfilePDF'
import React from 'react'

describe('Talent PDF Generation', () => {
  const mockTalent = {
    id: 'test-talent-uuid',
    user_id: 'test-user-uuid',
    slug: 'john-doe',
    full_name: 'John Doe',
    stage_name: 'Johnny D',
    category_name: 'Actor',
    sub_category_name: 'Film & Drama',
    verification_status: 'approved',
    union_member: true,
    is_available: true,
    experience_years: 5,
    city: 'Karachi',
    country: 'Pakistan',
    dob: '1995-05-15',
    gender: 'male',
    height_cm: 182,
    weight_kg: 78,
    bio: 'Professional screen actor with over 5 years of experience in film, television, and theatre productions.',
    skills: ['Method Acting', 'Improvisation', 'Voiceover', 'Stunts'],
    languages: ['Urdu', 'English', 'Punjabi'],
    users: {
      email: 'john@actorsstudio.pk',
      phone: '+923001234567',
    },
    measurements_json: {
      chest: 40,
      waist: 32,
      hip: 38,
      eye_color: 'Hazel',
      hair_color: 'Black',
      shoe_size: '10.5',
      social: {
        instagram: 'https://instagram.com/johndoe',
        tiktok: 'https://tiktok.com/@johndoe',
        youtube: 'https://youtube.com/c/johndoe',
        facebook: 'https://facebook.com/johndoe',
        website: 'https://johndoe.com',
      },
    },
    media_assets: [
      {
        id: 'photo-1',
        owner_id: 'test-user-uuid',
        type: 'photo',
        is_primary: true,
        url: 'https://placehold.co/600x800.png',
      },
      {
        id: 'photo-2',
        owner_id: 'test-user-uuid',
        type: 'photo',
        is_primary: false,
        url: 'https://placehold.co/600x800.png',
      },
      {
        id: 'reel-1',
        owner_id: 'test-user-uuid',
        type: 'reel',
        url: 'https://youtube.com/watch?v=sample',
        duration_sec: 120,
      },
    ],
  }

  it('renders Option 1: Overview & Bio PDF to a valid buffer', async () => {
    const buffer = await renderToBuffer(
      React.createElement(TalentOverviewPDF, { talent: mockTalent }) as any
    )
    expect(buffer).toBeDefined()
    expect(buffer.length).toBeGreaterThan(1000)
    // Verify PDF header magic bytes "%PDF-"
    const header = buffer.subarray(0, 5).toString('utf-8')
    expect(header).toBe('%PDF-')
  })

  it('renders Option 2: Full Profile multi-page PDF to a valid buffer', async () => {
    const buffer = await renderToBuffer(
      React.createElement(TalentFullProfilePDF, { talent: mockTalent }) as any
    )
    expect(buffer).toBeDefined()
    expect(buffer.length).toBeGreaterThan(1000)
    const header = buffer.subarray(0, 5).toString('utf-8')
    expect(header).toBe('%PDF-')
  })
})
