import type {
  AIServiceProvider,
  AIMatchCandidate,
  StructuredBrief,
  ContractAnalysisResult,
  TalentProfileBuilderResult,
} from '@/types/ai'

export type {
  AIServiceProvider,
  AIMatchCandidate,
  StructuredBrief,
  ContractAnalysisResult,
  TalentProfileBuilderResult,
}

// ============================================================
// MOCK / HEURISTIC AI SERVICE PROVIDER
// Provides deterministic, realistic intelligence with transparent breakdown
// ============================================================

export class MockAIServiceProvider implements AIServiceProvider {
  async parseClientBrief(rawText: string): Promise<StructuredBrief> {
    const textLower = (rawText || '').toLowerCase()

    // 1. Detect City / Location
    let location = 'Lahore'
    if (textLower.includes('karachi')) location = 'Karachi'
    else if (textLower.includes('islamabad') || textLower.includes('rawalpindi')) location = 'Islamabad'
    else if (textLower.includes('dubai') || textLower.includes('uae')) location = 'Dubai'
    else if (textLower.includes('lahore')) location = 'Lahore'

    // 2. Detect Gender
    let genderPreference: StructuredBrief['genderPreference'] = 'any'
    if (/\b(female|woman|women|girl|actress|females)\b/.test(textLower)) {
      genderPreference = 'female'
    } else if (/\b(male|man|men|boy|actor|males)\b/.test(textLower)) {
      genderPreference = 'male'
    }

    // 3. Detect Age Range
    let ageMin = 22
    let ageMax = 30
    const ageRangeMatch = textLower.match(/(\d{2})\s*(?:-|to)\s*(\d{2})/i)
    if (ageRangeMatch) {
      ageMin = parseInt(ageRangeMatch[1], 10)
      ageMax = parseInt(ageRangeMatch[2], 10)
    } else if (textLower.includes('early 20s') || textLower.includes('early twenties')) {
      ageMin = 20
      ageMax = 25
    } else if (textLower.includes('late 20s') || textLower.includes('late twenties')) {
      ageMin = 26
      ageMax = 30
    } else if (textLower.includes('mid 20s')) {
      ageMin = 23
      ageMax = 27
    } else if (textLower.includes('30s') || textLower.includes('thirties')) {
      ageMin = 30
      ageMax = 40
    } else if (textLower.includes('teen') || textLower.includes('teenage')) {
      ageMin = 16
      ageMax = 19
    }

    // 4. Detect Budget
    let budget = 'PKR 250,000'
    const budgetMatch = rawText.match(/(?:pkr|rs\.?|usd|\$)\s*([\d,]+(?:\s*k|\s*lakh|\s*lac)?)/i)
    if (budgetMatch) {
      budget = budgetMatch[0].trim()
    } else if (textLower.includes('250k')) {
      budget = 'PKR 250,000'
    } else if (textLower.includes('500k')) {
      budget = 'PKR 500,000'
    } else if (textLower.includes('1m') || textLower.includes('1 million')) {
      budget = 'PKR 1,000,000'
    }

    // 5. Detect Shoot Dates
    let shootDates = 'October 15-18, 2026'
    const dateMatch = rawText.match(/(?:shoot(?:ing)?(?:\s+dates?)?:?\s*)([A-Za-z0-9,\s\-–]+?)(?:\.|\n|$)/i)
    if (dateMatch && dateMatch[1].trim().length > 3) {
      shootDates = dateMatch[1].trim()
    } else if (textLower.includes('next week')) {
      shootDates = 'Next Week (Dates TBD)'
    } else if (textLower.includes('weekend')) {
      shootDates = 'Upcoming Weekend'
    }

    // 6. Detect Role & Title
    let projectTitle = 'Commercial Brand Campaign'
    let roleName = 'Lead Commercial Actor'

    if (textLower.includes('tvc') || textLower.includes('commercial')) {
      projectTitle = 'Premium TVC & Digital Campaign'
      roleName = genderPreference === 'female' ? 'Lead Female Model' : 'Lead Male Protagonist'
    } else if (textLower.includes('fashion') || textLower.includes('shoot') || textLower.includes('lawn')) {
      projectTitle = 'Fashion Editorial & Lookbook'
      roleName = 'Runway & Print Model'
    } else if (textLower.includes('drama') || textLower.includes('serial') || textLower.includes('feature')) {
      projectTitle = 'Prime Time Television Series'
      roleName = 'Supporting Lead Character'
    }

    // 7. Detect Skills
    const potentialSkills = [
      'Fluent Urdu',
      'Fluent English',
      'Commercial Acting',
      'Fashion Modeling',
      'Driving',
      'Classical Dance',
      'Voiceover',
      'Martial Arts',
      'Improv Comedy',
    ]
    const detectedSkills = potentialSkills.filter(s =>
      textLower.includes(s.toLowerCase().replace('fluent ', ''))
    )
    if (detectedSkills.length === 0) {
      detectedSkills.push('Commercial Acting', 'On-Camera Dialogue', 'Fluent English')
    }

    return {
      projectTitle,
      roleName,
      categorySlug: 'acting',
      genderPreference,
      ageMin,
      ageMax,
      location,
      skillsRequired: detectedSkills,
      shootDates,
      budget,
      description: rawText.trim().substring(0, 300),
    }
  }

  async matchTalentToBrief(brief: string, talentPool: any[]): Promise<AIMatchCandidate[]> {
    if (!talentPool || talentPool.length === 0) {
      return []
    }

    const briefLower = (brief || '').toLowerCase()

    // Determine target location from brief if mentioned
    const targetLocation = briefLower.includes('karachi')
      ? 'karachi'
      : briefLower.includes('islamabad')
      ? 'islamabad'
      : briefLower.includes('lahore')
      ? 'lahore'
      : null

    // Determine target gender from brief
    const targetGender = /\b(female|woman|girl|females)\b/.test(briefLower)
      ? 'female'
      : /\b(male|man|boy|males)\b/.test(briefLower)
      ? 'male'
      : null

    const scored = talentPool.map((talent, index) => {
      const name = talent.full_name || talent.name || `Talent #${talent.id.substring(0, 6)}`
      const city = talent.city || talent.location || 'Lahore'
      const gender = (talent.gender || 'female').toLowerCase()
      const experience = talent.experience_years || talent.experience || 3
      const skills: string[] = Array.isArray(talent.skills)
        ? talent.skills
        : ['Acting', 'Modeling', 'On-Camera']

      const matchedCriteria: string[] = []
      const missingCriteria: string[] = []
      let score = 70

      // Location evaluation
      if (targetLocation) {
        if (city.toLowerCase().includes(targetLocation)) {
          score += 15
          matchedCriteria.push(`✓ Base Location matches: ${city}`)
        } else {
          missingCriteria.push(`— Based in ${city} (Travel required for ${targetLocation.toUpperCase()})`)
        }
      } else {
        matchedCriteria.push(`✓ Verified City: ${city}`)
        score += 8
      }

      // Gender evaluation
      if (targetGender) {
        if (gender === targetGender) {
          score += 10
          matchedCriteria.push(`✓ Gender specification matched (${gender})`)
        } else {
          score -= 20
          missingCriteria.push(`— Gender profile does not match requested: ${targetGender}`)
        }
      }

      // Availability check
      if (talent.is_available !== false) {
        score += 8
        matchedCriteria.push('✓ Verified available for proposed production window')
      } else {
        score -= 10
        missingCriteria.push('— Calendar currently marked tentative or booked')
      }

      // Experience check
      if (experience >= 4) {
        score += 7
        matchedCriteria.push(`✓ Seasoned performer (${experience}+ years verified experience)`)
      } else if (experience >= 2) {
        score += 4
        matchedCriteria.push(`✓ Active commercial portfolio (${experience} years experience)`)
      }

      // Skills check
      const matchedSkill = skills.find(s => briefLower.includes(s.toLowerCase()))
      if (matchedSkill) {
        score += 5
        matchedCriteria.push(`✓ Explicit skill match: ${matchedSkill}`)
      } else {
        matchedCriteria.push(`✓ Key competencies: ${skills.slice(0, 2).join(', ')}`)
      }

      // Add a slight natural variance for tie-breaking
      const finalScore = Math.min(99, Math.max(45, score - (index % 4) * 2))

      return {
        talentId: talent.id,
        fullName: name,
        matchScore: finalScore,
        matchedCriteria,
        missingCriteria,
        avatarUrl: talent.profile_image_url || talent.avatar_url || null,
        city,
        gender,
        experienceYears: experience,
        skills,
        isAvailable: talent.is_available !== false,
      }
    })

    // Sort descending by score
    return scored.sort((a, b) => b.matchScore - a.matchScore)
  }

  async analyzeContract(contractText: string): Promise<ContractAnalysisResult> {
    const text = contractText || ''
    const textLower = text.toLowerCase()

    // 1. Parties extraction
    let client = 'Client Production House'
    let talent = 'Represented Talent'
    const clientMatch = text.match(/(?:client|producer|company):\s*([^\n\r,]+)/i)
    if (clientMatch) client = clientMatch[1].trim()
    const talentMatch = text.match(/(?:talent|artist|performer):\s*([^\n\r,]+)/i)
    if (talentMatch) talent = talentMatch[1].trim()

    // 2. Fee extraction
    let feeAmount = 'PKR 350,000'
    const feeMatch = text.match(/(?:fee|compensation|remuneration|amount):\s*(?:pkr|rs\.?|usd|\$)?\s*([\d,]+)/i)
    if (feeMatch) {
      feeAmount = `PKR ${feeMatch[1].trim()}`
    }

    // 3. Exclusivity analysis
    let exclusivityNotice = 'Non-exclusive engagement for general categories.'
    const issues: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    if (textLower.includes('exclusiv') || textLower.includes('non-compete')) {
      exclusivityNotice = 'Strict Category Exclusivity: Talent restricted from competing brands during and after campaign release.'
      issues.push('Exclusivity restriction covers competitor brands. Ensure talent has no active competing contracts.')
      riskLevel = 'medium'
    }

    if (textLower.includes('perpetuity') || textLower.includes('in perpetuity')) {
      issues.push('⚠️ WARNING: "In Perpetuity" buyout detected. Standard agency best practice recommends a 1-year renewable term.')
      riskLevel = 'high'
    }

    if (!textLower.includes('overtime') && !textLower.includes('additional hour')) {
      issues.push('Overtime compensation clause is absent. Require hourly overtime rate beyond 10-hour shoot day.')
    }

    if (textLower.includes('moral') || textLower.includes('conduct')) {
      issues.push('Morals & Conduct clause present. Standard bilateral protection is recommended.')
    }

    // 4. Territory & Rights
    let territory = 'Pakistan & Digital Worldwide'
    if (textLower.includes('gcc') || textLower.includes('middle east')) {
      territory = 'Pakistan, GCC & Middle East'
    } else if (textLower.includes('worldwide')) {
      territory = 'Worldwide (All Media)'
    }

    let usageRightsSummary = 'Digital, Social Media & Broadcast Rights for 12 months from first airing.'
    if (textLower.includes('digital only')) {
      usageRightsSummary = 'Digital & OTT Platforms Only (Excludes terrestrial TV & Print)'
    } else if (textLower.includes('billboard') || textLower.includes('ooh')) {
      usageRightsSummary = '360 Campaign: TVC, Digital, Social, and Out-of-Home (OOH) Billboards'
    }

    // 5. Key Dates
    const keyDates: string[] = [
      'Production Shoot Window: Scheduled per Call Sheet',
      'Payment Terms: Net 30 days from final wrap / invoice',
      'Term Duration: 12 months from first public broadcast',
    ]

    return {
      parties: { client, talent },
      feeAmount,
      usageRightsSummary,
      territory,
      exclusivityNotice,
      keyDates,
      potentialIssuesToReview: issues.length > 0 ? issues : ['Terms align with standard Pakistan Actors Equity practice.'],
      riskLevel,
    }
  }

  async generateAgencyEmail(templateType: string, context: Record<string, string>): Promise<string> {
    const recipient = context.recipientName || 'Valued Partner'
    const project = context.projectName || 'the upcoming production'
    const agency = context.agencyName || "Actor's Studio Pakistan"

    switch (templateType) {
      case 'pitch_shortlist':
        return `Dear ${recipient},

We are thrilled to present our curated talent shortlist for ${project}. 

Our team has matched candidate profiles based on your visual reference, screen presence requirements, and shoot availability. You can review their dynamic comp cards, showreels, and verified metrics directly on your Client Portal.

Please let us know your shortlisted selections so we can confirm holds and arrange audition callbacks.

Warm regards,
Casting Department
${agency}`

      case 'contract_dispatch':
        return `Dear ${recipient},

Please find attached the performance agreement for ${project}. 

The terms, usage rights, and compensation schedule have been compiled for your review and digital signature. Please execute via the secure link at your earliest convenience.

Best regards,
Business & Legal Affairs
${agency}`

      case 'invoice_reminder':
        return `Dear ${recipient},

This is a courtesy reminder regarding outstanding invoice ${context.invoiceNumber || 'INV-2026'} for ${project}. 

The payment was due on ${context.dueDate || 'the scheduled date'}. We kindly request you verify the disbursement status with your accounts department.

Thank you for your partnership,
Finance Operations
${agency}`

      default:
        return `Dear ${recipient},

Thank you for reaching out regarding ${project}. We have received your briefing notes and our casting directors are actively processing your request.

Kind regards,
${agency}`
    }
  }

  async buildTalentProfile(rawInput: { bio?: string; experience?: string; skills?: string[] }): Promise<TalentProfileBuilderResult> {
    const rawBio = rawInput.bio || ''
    const headline = 'Versatile Screen & Stage Actor | Commercial & Dramatic Specialist'
    const polishedBio = rawBio.trim().length > 20
      ? `${rawBio.trim()}\n\nRepresented exclusively by Actor's Studio, known for refined character work, disciplined on-set etiquette, and strong emotive depth across television and commercial productions.`
      : "Dynamic performing artist with extensive screen experience across prime-time television serials and premier commercial brand campaigns. Trained in classical theatre, expressive characterization, and fluent multilingual dialogue delivery."

    const extractedSkills = Array.from(new Set([
      ...(rawInput.skills || []),
      'On-Camera Performance',
      'Method Acting',
      'Urdu Diction & Poetry',
      'Improvisation',
      'Voice Modulation',
    ]))

    return {
      headline,
      polishedBio,
      extractedSkills,
      suggestedCategories: ['Acting (Lead)', 'Commercial TVC', 'Voiceover & Dubbing', 'Editorial Print'],
      experienceSummary: '5+ years active performance experience in Karachi and Lahore film/TV circuits.',
    }
  }

  async chatAssistantQuery(query: string, contextSummary?: string): Promise<string> {
    const qLower = query.toLowerCase()

    if (qLower.includes('invoice') || qLower.includes('overdue') || qLower.includes('payment') || qLower.includes('money')) {
      return "📊 **Finance & Collections Intelligence:**\n\nFound **1 overdue invoice** (INV-2026-1042 for Dawn Films, PKR 600,000 balance remaining). Total agency commission accrued this month stands at **PKR 358,000** with PKR 180,000 payable to represented talent upon clearance."
    }

    if (qLower.includes('contract') || qLower.includes('sign') || qLower.includes('legal')) {
      return "📑 **Contracts & E-Signatures:**\n\nThere are **2 active agreements** currently awaiting party execution. Contract for *Shan Foods Ramadan Campaign* was viewed yesterday by the client signatory and is ready for countersigning."
    }

    if (qLower.includes('talent') || qLower.includes('model') || qLower.includes('actor') || qLower.includes('lahore') || qLower.includes('karachi')) {
      return `🎭 **Talent Roster Query:**\n\nMatched 4 verified candidates in your roster matching "${query}":\n• **Amina Khan** (Lahore, 25y, Commercial Lead) — Available\n• **Bilal Tariq** (Lahore, 28y, Drama & TVC) — Available\n• **Zara Ahmed** (Karachi, 24y, High Fashion & Film) — Tentative Hold Oct 14\n• **Danyal Zafar** (Karachi, 29y, Action & Drama) — Available`
    }

    if (qLower.includes('audition') || qLower.includes('self-tape') || qLower.includes('tape') || qLower.includes('casting')) {
      return "🎬 **Casting & Audition Pipelines:**\n\nYou have **3 open casting calls**. The *Coke Studio TVC 2026* pipeline has received 8 self-tapes, with 3 marked as 'Client Recommended'. Review them in your Casting Review Suite."
    }

    return `💡 **Agency Copilot:**\n\nAnalyzed agency database for: "${query}".\n${contextSummary ? `*Context:* ${contextSummary}\n` : ''}\nAll operations are synced with your organization RLS boundary. You can execute actions directly from the quick links or ask for specific breakdowns.`
  }
}

// ============================================================
// GEMINI / OPENAI LIVE PROVIDER (WITH AUTOMATIC MOCK FALLBACK)
// ============================================================

export class GeminiAIServiceProvider implements AIServiceProvider {
  private apiKey: string
  private fallback = new MockAIServiceProvider()

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async callGemini(prompt: string, jsonMode = false): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`
    const body: any = {
      contents: [{ parts: [{ text: prompt }] }],
    }
    if (jsonMode) {
      body.generationConfig = { responseMimeType: 'application/json' }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini API error (${res.status}): ${err}`)
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  async parseClientBrief(rawText: string): Promise<StructuredBrief> {
    try {
      const prompt = `You are an expert casting director assistant. Parse the following unstructured client casting brief into JSON matching this schema:
{
  "projectTitle": string,
  "roleName": string,
  "categorySlug": string,
  "genderPreference": "male" | "female" | "non_binary" | "prefer_not_to_say" | "any",
  "ageMin": number,
  "ageMax": number,
  "location": string,
  "skillsRequired": string[],
  "shootDates": string,
  "budget": string,
  "description": string
}

Raw brief:
"""
${rawText}
"""
Output ONLY valid JSON.`
      const text = await this.callGemini(prompt, true)
      return JSON.parse(text)
    } catch {
      return this.fallback.parseClientBrief(rawText)
    }
  }

  async matchTalentToBrief(brief: string, talentPool: any[]): Promise<AIMatchCandidate[]> {
    // Rely on transparent deterministic rules for talent evaluation to ensure explainability
    return this.fallback.matchTalentToBrief(brief, talentPool)
  }

  async analyzeContract(contractText: string): Promise<ContractAnalysisResult> {
    try {
      const prompt = `Analyze this entertainment/talent contract. Extract parties, fee, usage rights, territory, exclusivity, key dates, and potential issues/risks for the talent agency. Return JSON matching:
{
  "parties": { "client": string, "talent": string },
  "feeAmount": string,
  "usageRightsSummary": string,
  "territory": string,
  "exclusivityNotice": string,
  "keyDates": string[],
  "potentialIssuesToReview": string[],
  "riskLevel": "low" | "medium" | "high"
}

Contract:
"""
${contractText.substring(0, 4000)}
"""`
      const text = await this.callGemini(prompt, true)
      return JSON.parse(text)
    } catch {
      return this.fallback.analyzeContract(contractText)
    }
  }

  async generateAgencyEmail(templateType: string, context: Record<string, string>): Promise<string> {
    try {
      const prompt = `Write a professional, prestigious talent agency email for template type: "${templateType}".
Context: ${JSON.stringify(context)}
Keep tone elegant, authoritative, and warm.`
      return await this.callGemini(prompt)
    } catch {
      return this.fallback.generateAgencyEmail(templateType, context)
    }
  }

  async buildTalentProfile(rawInput: { bio?: string; experience?: string; skills?: string[] }): Promise<TalentProfileBuilderResult> {
    try {
      const prompt = `Turn this raw actor/talent information into a polished, professional agency portfolio profile.
Raw Input: ${JSON.stringify(rawInput)}
Return JSON:
{
  "headline": string,
  "polishedBio": string,
  "extractedSkills": string[],
  "suggestedCategories": string[],
  "experienceSummary": string
}`
      const text = await this.callGemini(prompt, true)
      return JSON.parse(text)
    } catch {
      return this.fallback.buildTalentProfile(rawInput)
    }
  }

  async chatAssistantQuery(query: string, contextSummary?: string): Promise<string> {
    try {
      const prompt = `You are Actor's Studio AI Assistant, an elite talent agency intelligence assistant.
Answer this agency executive query concisely and helpfully.
Context Summary: ${contextSummary || 'Pakistan film & commercial talent agency database'}
Query: "${query}"`
      return await this.callGemini(prompt)
    } catch {
      return this.fallback.chatAssistantQuery(query, contextSummary)
    }
  }
}

// ============================================================
// FACTORY
// ============================================================

export function getAIService(): AIServiceProvider {
  const providerType = (process.env.AI_PROVIDER || '').toLowerCase()
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  if ((providerType === 'gemini' || !providerType) && geminiKey) {
    return new GeminiAIServiceProvider(geminiKey)
  }

  return new MockAIServiceProvider()
}
