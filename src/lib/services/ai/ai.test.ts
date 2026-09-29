import { describe, it, expect } from 'vitest'
import {
  getAIService,
  MockAIServiceProvider,
  GeminiAIServiceProvider,
} from './provider'

describe('Subprompt 10 — AI Agency Suite & Intelligence Engine', () => {
  const ai = new MockAIServiceProvider()

  describe('1. Pluggable Service Abstraction', () => {
    it('initializes default AI service provider correctly', () => {
      const service = getAIService()
      expect(service).toBeDefined()
      expect(typeof service.matchTalentToBrief).toBe('function')
      expect(typeof service.parseClientBrief).toBe('function')
      expect(typeof service.analyzeContract).toBe('function')
      expect(typeof service.generateAgencyEmail).toBe('function')
      expect(typeof service.buildTalentProfile).toBe('function')
      expect(typeof service.chatAssistantQuery).toBe('function')
    })
  })

  describe('2. Transparent AI Talent Matching', () => {
    const sampleTalentPool = [
      {
        id: 't-1',
        full_name: 'Amina Khan',
        city: 'Lahore',
        gender: 'female',
        experience_years: 4,
        skills: ['Commercial Acting', 'Fashion Modeling', 'Fluent English', 'Fluent Urdu'],
        is_available: true,
      },
      {
        id: 't-2',
        full_name: 'Zara Ahmed',
        city: 'Karachi',
        gender: 'female',
        experience_years: 2,
        skills: ['Fashion Modeling'],
        is_available: false,
      },
      {
        id: 't-3',
        full_name: 'Bilal Tariq',
        city: 'Lahore',
        gender: 'male',
        experience_years: 5,
        skills: ['Dramatic Acting', 'Commercial Acting'],
        is_available: true,
      },
    ]

    it('ranks candidates descending by honest match score', async () => {
      const brief = 'Female commercial actor in Lahore with on-camera experience'
      const matches = await ai.matchTalentToBrief(brief, sampleTalentPool)

      expect(matches.length).toBe(3)
      expect(matches[0].matchScore).toBeGreaterThanOrEqual(matches[1].matchScore)
      expect(matches[1].matchScore).toBeGreaterThanOrEqual(matches[2].matchScore)
      // Amina Khan should be top match
      expect(matches[0].fullName).toBe('Amina Khan')
      expect(matches[0].matchScore).toBeGreaterThan(80)
    })

    it('produces transparent matchedCriteria and missingCriteria breakdowns', async () => {
      const brief = 'Urgent: Female model in Lahore for commercial shoot'
      const matches = await ai.matchTalentToBrief(brief, sampleTalentPool)

      const amina = matches.find((m) => m.fullName === 'Amina Khan')!
      expect(amina.matchedCriteria.some((c) => c.includes('Lahore'))).toBe(true)
      expect(amina.matchedCriteria.some((c) => c.includes('available'))).toBe(true)

      const zara = matches.find((m) => m.fullName === 'Zara Ahmed')!
      // Zara is in Karachi, not Lahore, and unavailable
      expect(zara.missingCriteria.some((c) => c.includes('Karachi') || c.includes('Travel'))).toBe(true)
      expect(zara.missingCriteria.some((c) => c.includes('booked') || c.includes('tentative'))).toBe(true)
    })
  })

  describe('3. AI Client Brief Parser', () => {
    it('parses messy WhatsApp notes into structured casting parameters', async () => {
      const whatsappNote = `Salam Bhai! We urgently need a female lead model for an upcoming Lawn commercial shooting in Lahore.
Age around 22-26, graceful expressions, fluent Urdu dialogue. Shoot is tentatively Oct 18-20. Total budget around PKR 350,000 all inclusive.`

      const parsed = await ai.parseClientBrief(whatsappNote)

      expect(parsed.location).toBe('Lahore')
      expect(parsed.genderPreference).toBe('female')
      expect(parsed.ageMin).toBe(22)
      expect(parsed.ageMax).toBe(26)
      expect(parsed.budget).toContain('350,000')
      expect(parsed.shootDates).toBeDefined()
      expect(parsed.skillsRequired?.length).toBeGreaterThan(0)
    })

    it('detects Karachi location, male gender, and budget estimates', async () => {
      const brief = `Casting call for Karachi TV drama: male lead, 30-40 years old, 500k budget.`
      const parsed = await ai.parseClientBrief(brief)

      expect(parsed.location).toBe('Karachi')
      expect(parsed.genderPreference).toBe('male')
      expect(parsed.ageMin).toBe(30)
      expect(parsed.ageMax).toBe(40)
      expect(parsed.budget).toContain('500')
    })
  })

  describe('4. AI Contract Clause Analyzer', () => {
    const rawContract = `
    AGREEMENT DATED October 10, 2026
    Client: Shan Foods International
    Talent: Amina Khan
    Fee: PKR 450,000
    Usage: Broadcast TV and Social Media across Pakistan & GCC for 12 months.
    Exclusivity: Talent is restricted from appearing in competing beverage or spice brands.
    `

    it('extracts parties, fee, territory, and exclusivity notice', async () => {
      const result = await ai.analyzeContract(rawContract)

      expect(result.parties.client).toContain('Shan Foods')
      expect(result.parties.talent).toContain('Amina Khan')
      expect(result.feeAmount).toContain('450,000')
      expect(result.territory).toContain('GCC')
      expect(result.exclusivityNotice).toContain('Exclusivity')
      expect(result.keyDates.length).toBeGreaterThan(0)
    })

    it('identifies risk flags such as missing overtime and strict exclusivity', async () => {
      const result = await ai.analyzeContract(rawContract)

      expect(result.potentialIssuesToReview.length).toBeGreaterThan(0)
      expect(
        result.potentialIssuesToReview.some(
          (issue) => issue.toLowerCase().includes('exclusiv') || issue.toLowerCase().includes('overtime')
        )
      ).toBe(true)
    })

    it('flags high risk when in perpetuity clause is detected', async () => {
      const perpetuityContract = `Client: Test Corp. Talent: John Doe. Rights: Worldwide in perpetuity.`
      const result = await ai.analyzeContract(perpetuityContract)

      expect(result.riskLevel).toBe('high')
      expect(
        result.potentialIssuesToReview.some((issue) => issue.toLowerCase().includes('perpetuity'))
      ).toBe(true)
    })
  })

  describe('5. Talent Profile Builder', () => {
    it('generates polished portfolio headline, bio, and competencies', async () => {
      const profile = await ai.buildTalentProfile({
        bio: 'Actor based in Lahore, did theater in NCA and some TV commercials.',
        experience: '3 years',
        skills: ['Urdu', 'English'],
      })

      expect(profile.headline).toBeDefined()
      expect(profile.polishedBio.length).toBeGreaterThan(30)
      expect(profile.extractedSkills).toContain('On-Camera Performance')
      expect(profile.suggestedCategories.length).toBeGreaterThan(0)
    })
  })

  describe('6. Agency Copilot Assistant', () => {
    it('answers queries about overdue invoices with actionable intelligence', async () => {
      const answer = await ai.chatAssistantQuery('Which invoices are currently overdue?')
      expect(answer.toLowerCase()).toContain('invoice')
      expect(answer.toLowerCase()).toContain('pkr')
    })

    it('answers queries about talent roster availability', async () => {
      const answer = await ai.chatAssistantQuery('Show female models in Lahore')
      expect(answer).toContain('Lahore')
      expect(answer).toContain('Amina Khan')
    })
  })
})
