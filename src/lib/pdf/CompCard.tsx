import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer'

// Register Inter font for the PDF generator
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
})

const styles = StyleSheet.create({
  page: { flexDirection: 'row', backgroundColor: '#09090b', padding: 0 },
  photoColumn: { width: '40%', backgroundColor: '#1a1a1a' },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  contentColumn: { width: '60%', padding: 32, backgroundColor: '#09090b', color: '#ffffff', fontFamily: 'Inter' },
  name: { fontSize: 26, fontWeight: 700, color: '#ffffff', marginBottom: 4 },
  category: { fontSize: 11, color: '#d946ef', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2 },
  statTable: { borderTopWidth: 1, borderTopColor: '#27272a', borderBottomWidth: 1, borderBottomColor: '#27272a', py: 12, mb: 16 },
  statRow: { flexDirection: 'row', marginBottom: 6 },
  statLabel: { fontSize: 8, color: '#71717a', width: 90, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 9, color: '#e4e4e7', flex: 1 },
  sectionTitle: { fontSize: 8, color: '#d946ef', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 12, fontWeight: 700 },
  bioText: { fontSize: 9, color: '#a1a1aa', lineHeight: 1.5 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  skillTag: { backgroundColor: '#27272a', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, marginRight: 4, marginBottom: 4 },
  skillText: { fontSize: 8, color: '#e4e4e7' },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 8, color: '#52525b' },
  logoText: { fontSize: 9, color: '#d946ef', fontWeight: 700 },
})

export function CompCardPDF({ talent }: { talent: any }) {
  const displayName = talent.stage_name || talent.full_name
  const primaryPhoto = talent.media_assets?.find((m: any) => m.is_primary && m.type === 'photo')?.url
  const categoryDisplay = talent.category_name || talent.categories?.name || 'Talent'
  const subCategoryDisplay = talent.sub_category_name || talent.sub_category?.name

  const formatHeight = (cm: number | null) => {
    if (!cm) return '—'
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}'${inches}" (${cm} cm)`
  }

  const formatWeight = (kg: number | null) => {
    if (!kg) return '—'
    return `${kg} kg (${Math.round(kg * 2.20462)} lbs)`
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.photoColumn}>
          {primaryPhoto ? (
            <Image src={primaryPhoto} style={styles.photo} />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#18181b', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#52525b', fontSize: 10 }}>No Photo Available</Text>
            </View>
          )}
        </View>
        <View style={styles.contentColumn}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.category}>
            {categoryDisplay} {subCategoryDisplay ? `• ${subCategoryDisplay}` : ''}
          </Text>

          {/* Stats Bar */}
          <View style={styles.statTable}>
            {talent.height_cm && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Height</Text>
                <Text style={styles.statValue}>{formatHeight(talent.height_cm)}</Text>
              </View>
            )}
            {talent.weight_kg && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Weight</Text>
                <Text style={styles.statValue}>{formatWeight(talent.weight_kg)}</Text>
              </View>
            )}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>City</Text>
              <Text style={styles.statValue}>{talent.city || '—'}</Text>
            </View>
            {talent.languages && talent.languages.length > 0 && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Languages</Text>
                <Text style={styles.statValue}>{talent.languages.join(', ')}</Text>
              </View>
            )}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Experience</Text>
              <Text style={styles.statValue}>{talent.experience_years} {talent.experience_years === 1 ? 'year' : 'years'}</Text>
            </View>
          </View>

          {/* Bio */}
          {talent.bio && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{talent.bio.slice(0, 380)}</Text>
            </View>
          )}

          {/* Skills */}
          {talent.skills && talent.skills.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.skillsContainer}>
                {talent.skills.slice(0, 8).map((skill: string) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.logoText}>Actor's Studio</Text>
            <Text style={styles.footerText}>actorsstudio.pk/talent/{talent.slug}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
