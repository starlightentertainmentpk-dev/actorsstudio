import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    paddingTop: 30,
    paddingBottom: 35,
    paddingHorizontal: 35,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#18181b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#d946ef',
    paddingBottom: 10,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    color: '#d946ef',
    textTransform: 'uppercase',
  },
  brandSubtitle: {
    fontSize: 7,
    color: '#71717a',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  headerBadgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#27272a',
    textTransform: 'uppercase',
  },
  badgeVerified: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  badgeVerifiedText: {
    color: '#059669',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },

  // Main Info Grid
  topGrid: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 16,
  },
  photoCol: {
    width: 140,
    height: 185,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
  },
  placeholderText: {
    color: '#a1a1aa',
    fontSize: 9,
  },

  detailsCol: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#09090b',
    marginBottom: 2,
  },
  stageName: {
    fontSize: 9.5,
    color: '#71717a',
    marginBottom: 4,
    fontFamily: 'Helvetica',
  },
  category: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#d946ef',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  infoTable: {
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    paddingTop: 6,
    gap: 4.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    width: 75,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoVal: {
    flex: 1,
    fontSize: 8,
    color: '#18181b',
  },

  // Sections
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#09090b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    paddingBottom: 3,
    marginBottom: 6,
  },

  // Specs Grid
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f4f4f5',
    borderRadius: 6,
    padding: 7,
    gap: 6,
  },
  specItem: {
    width: '23%',
    marginBottom: 3,
  },
  specLabel: {
    fontSize: 6.5,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1.5,
  },
  specValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
  },

  // Social Links Box
  socialBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f4f4f5',
    borderRadius: 6,
    padding: 7,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: 4,
    marginBottom: 2,
  },
  socialPlatform: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#d946ef',
    textTransform: 'uppercase',
    width: 50,
  },
  socialUrl: {
    fontSize: 7,
    color: '#27272a',
    flex: 1,
  },

  // Bio
  bioText: {
    fontSize: 8,
    color: '#3f3f46',
    lineHeight: 1.45,
  },

  // Chips
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#f4f4f5',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: '#e4e4e7',
  },
  tagText: {
    fontSize: 7,
    color: '#27272a',
  },

  // PAGE 2: Portfolio Gallery & Media
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  galleryPhotoCard: {
    width: '31.5%',
    height: 155,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  galleryPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  // Media rows
  mediaTable: {
    borderWidth: 1,
    borderColor: '#f4f4f5',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    backgroundColor: '#ffffff',
  },
  mediaRowEven: {
    backgroundColor: '#fafafa',
  },
  mediaTypeBadge: {
    width: 65,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#d946ef',
    textTransform: 'uppercase',
  },
  mediaTitle: {
    flex: 1,
    fontSize: 7.5,
    color: '#18181b',
  },
  mediaDuration: {
    fontSize: 7,
    color: '#71717a',
    width: 45,
    textAlign: 'right',
  },

  // Digital Link Box
  digitalBox: {
    backgroundColor: '#fdf4ff',
    borderWidth: 1,
    borderColor: '#f0abfc',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  digitalBoxLeft: {
    flex: 1,
  },
  digitalTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#a21caf',
    marginBottom: 2,
  },
  digitalDesc: {
    fontSize: 7,
    color: '#701a75',
  },
  digitalUrl: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#86198f',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 35,
    right: 35,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#a1a1aa',
  },
  footerBrand: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#d946ef',
  },
})

export interface TalentFullProfilePDFProps {
  talent: any
}

export function TalentFullProfilePDF({ talent }: TalentFullProfilePDFProps) {
  const displayName = talent.full_name || talent.stage_name || 'Talent Profile'
  const stageName = talent.stage_name && talent.stage_name !== talent.full_name ? talent.stage_name : null
  const primaryPhoto = talent.media_assets?.find((m: any) => m.is_primary && m.type === 'photo')?.url
  const secondaryPhotos = (talent.media_assets || [])
    .filter((m: any) => !m.is_primary && m.type === 'photo')
    .slice(0, 6)

  const videos = (talent.media_assets || []).filter((m: any) => m.type === 'video' || m.type === 'reel')
  const voiceClips = (talent.media_assets || []).filter((m: any) => m.type === 'voice' || m.type === 'voice_sample' || m.type === 'audio')
  const documents = (talent.media_assets || []).filter((m: any) => m.type === 'resume' || m.type === 'document' || m.type === 'doc')

  const categoryDisplay = talent.category_name || talent.categories?.name || 'Talent'
  const subCategoryDisplay = talent.sub_category_name || talent.sub_category?.name

  const measurements = (talent.measurements_json as Record<string, any>) || {}
  const social = measurements.social || {}

  const formatHeight = (cm: number | null | undefined) => {
    if (!cm) return '—'
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${cm} cm (${feet}'${inches}")`
  }

  const formatWeight = (kg: number | null | undefined) => {
    if (!kg) return '—'
    return `${kg} kg (${Math.round(kg * 2.20462)} lbs)`
  }

  const calculateAge = (dobString?: string | null) => {
    if (!dobString) return null
    const today = new Date()
    const birthDate = new Date(dobString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const age = calculateAge(talent.dob)

  const activeSocials = [
    { name: 'Instagram', url: social.instagram },
    { name: 'TikTok', url: social.tiktok },
    { name: 'YouTube', url: social.youtube },
    { name: 'Facebook', url: social.facebook },
    { name: 'Website', url: social.website },
  ].filter((s) => Boolean(s.url))

  return (
    <Document title={`${displayName} - Full Profile Dossier`}>
      {/* ===================== PAGE 1: OVERVIEW & BIO ===================== */}
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>Actor's Studio</Text>
            <Text style={styles.brandSubtitle}>Executive Casting Dossier • Page 1 of 2</Text>
          </View>
          <View style={styles.headerBadgeContainer}>
            {talent.verification_status === 'approved' && (
              <View style={[styles.badge, styles.badgeVerified]}>
                <Text style={styles.badgeVerifiedText}>ID Verified</Text>
              </View>
            )}
            {talent.union_member && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Union Member</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {talent.is_available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Section: Photo + Identification / Contact */}
        <View style={styles.topGrid}>
          <View style={styles.photoCol}>
            {primaryPhoto ? (
              <Image src={primaryPhoto} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.placeholderText}>No Headshot</Text>
              </View>
            )}
          </View>

          <View style={styles.detailsCol}>
            <Text style={styles.name}>{displayName}</Text>
            {stageName && <Text style={styles.stageName}>Stage Name: {stageName}</Text>}
            <Text style={styles.category}>
              {categoryDisplay} {subCategoryDisplay ? `• ${subCategoryDisplay}` : ''}
            </Text>

            <View style={styles.infoTable}>
              {talent.users?.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoVal}>{talent.users.email}</Text>
                </View>
              )}
              {talent.users?.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoVal}>{talent.users.phone}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoVal}>
                  {talent.city || '—'}, {talent.country || 'Pakistan'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age / Gender</Text>
                <Text style={styles.infoVal}>
                  {age ? `${age} yrs` : '—'} •{' '}
                  {talent.gender ? talent.gender.replace(/_/g, ' ') : 'Unspecified'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoVal}>
                  {talent.experience_years ?? 0}{' '}
                  {talent.experience_years === 1 ? 'Year' : 'Years'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Languages</Text>
                <Text style={styles.infoVal}>
                  {talent.languages && talent.languages.length > 0
                    ? talent.languages.join(', ')
                    : '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Physical Specs & Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Specs & Measurements</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Height</Text>
              <Text style={styles.specValue}>{formatHeight(talent.height_cm)}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Weight</Text>
              <Text style={styles.specValue}>{formatWeight(talent.weight_kg)}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Chest / Bust</Text>
              <Text style={styles.specValue}>
                {measurements.chest || measurements.bust ? `${measurements.chest || measurements.bust}"` : '—'}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Waist</Text>
              <Text style={styles.specValue}>
                {measurements.waist ? `${measurements.waist}"` : '—'}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Hips</Text>
              <Text style={styles.specValue}>
                {measurements.hip || measurements.hips ? `${measurements.hip || measurements.hips}"` : '—'}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Eye Color</Text>
              <Text style={styles.specValue}>
                {measurements.eye_color || measurements.eyes || '—'}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Hair Color</Text>
              <Text style={styles.specValue}>
                {measurements.hair_color || measurements.hair || '—'}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Shoe Size</Text>
              <Text style={styles.specValue}>
                {measurements.shoe_size || measurements.shoes || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Social Profiles */}
        {activeSocials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Profiles & Online Channels</Text>
            <View style={styles.socialBox}>
              {activeSocials.map((soc) => (
                <View key={soc.name} style={styles.socialItem}>
                  <Text style={styles.socialPlatform}>{soc.name}:</Text>
                  <Text style={styles.socialUrl}>{soc.url}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Biography */}
        {talent.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biography & Background</Text>
            <Text style={styles.bioText}>{talent.bio}</Text>
          </View>
        )}

        {/* Special Skills */}
        {talent.skills && talent.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Skills & Talents</Text>
            <View style={styles.tagsWrap}>
              {talent.skills.map((skill: string) => (
                <View key={skill} style={styles.tag}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Actor's Studio Pakistan</Text>
          <Text style={styles.footerText}>
            Page 1 of 2 • Confidential Talent Dossier • {new Date().toLocaleDateString('en-GB')}
          </Text>
        </View>
      </Page>

      {/* ===================== PAGE 2: PORTFOLIO & MEDIA DIRECTORY ===================== */}
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>Actor's Studio</Text>
            <Text style={styles.brandSubtitle}>Portfolio Gallery & Media Directory • Page 2 of 2</Text>
          </View>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#09090b' }}>
            {displayName}
          </Text>
        </View>

        {/* Secondary Photos Showcase */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Portfolio Photo Showcase ({secondaryPhotos.length} Images)
          </Text>
          {secondaryPhotos.length > 0 ? (
            <View style={styles.galleryGrid}>
              {secondaryPhotos.map((p: any, idx: number) => (
                <View key={p.id || idx} style={styles.galleryPhotoCard}>
                  <Image src={p.url} style={styles.galleryPhoto} />
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 8, color: '#71717a', fontStyle: 'italic', marginBottom: 12 }}>
              No secondary portfolio photos uploaded.
            </Text>
          )}
        </View>

        {/* Video Reels & Showreels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Reels & Performance Clips ({videos.length})</Text>
          {videos.length > 0 ? (
            <View style={styles.mediaTable}>
              {videos.map((vid: any, idx: number) => (
                <View key={vid.id || idx} style={[styles.mediaRow, idx % 2 === 1 ? styles.mediaRowEven : {}]}>
                  <Text style={styles.mediaTypeBadge}>{vid.type === 'reel' ? 'Showreel' : 'Video Clip'}</Text>
                  <Text style={styles.mediaTitle}>{vid.url}</Text>
                  <Text style={styles.mediaDuration}>
                    {vid.duration_sec ? `${Math.floor(vid.duration_sec / 60)}:${(vid.duration_sec % 60).toString().padStart(2, '0')}` : 'Video'}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 8, color: '#71717a', fontStyle: 'italic', marginBottom: 10 }}>
              No showreel or video links recorded.
            </Text>
          )}
        </View>

        {/* Voiceover & Audio Clips */}
        {voiceClips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Samples & Audio Clips ({voiceClips.length})</Text>
            <View style={styles.mediaTable}>
              {voiceClips.map((clip: any, idx: number) => (
                <View key={clip.id || idx} style={[styles.mediaRow, idx % 2 === 1 ? styles.mediaRowEven : {}]}>
                  <Text style={styles.mediaTypeBadge}>Voice Clip</Text>
                  <Text style={styles.mediaTitle}>{clip.url}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Credentials & Documents */}
        {documents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uploaded Resumes & Credentials ({documents.length})</Text>
            <View style={styles.mediaTable}>
              {documents.map((doc: any, idx: number) => (
                <View key={doc.id || idx} style={[styles.mediaRow, idx % 2 === 1 ? styles.mediaRowEven : {}]}>
                  <Text style={styles.mediaTypeBadge}>Resume / CV</Text>
                  <Text style={styles.mediaTitle}>{doc.url}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Digital Verification Box */}
        <View style={styles.digitalBox}>
          <View style={styles.digitalBoxLeft}>
            <Text style={styles.digitalTitle}>Verified Online Profile & Contact Access</Text>
            <Text style={styles.digitalDesc}>
              View dynamic video embeds, playable audio, and direct casting booking controls online.
            </Text>
          </View>
          <Text style={styles.digitalUrl}>
            {talent.slug ? `actorsstudio.pk/talent/${talent.slug}` : 'actorsstudio.pk'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Actor's Studio Pakistan</Text>
          <Text style={styles.footerText}>
            Page 2 of 2 • Confidential Talent Dossier • {new Date().toLocaleDateString('en-GB')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
