export type AIFeatureType =
  | 'talent_matching'
  | 'brief_parser'
  | 'profile_builder'
  | 'contract_analyzer'
  | 'email_generator'
  | 'assistant_chat'

export interface AIMatchCandidate {
  talentId: string
  fullName: string
  matchScore: number // 0 - 100
  matchedCriteria: string[]
  missingCriteria: string[]
  avatarUrl?: string | null
  city?: string
  gender?: string
  age?: number
  experienceYears?: number
  skills?: string[]
  isAvailable?: boolean
}

export interface StructuredBrief {
  projectTitle?: string
  roleName?: string
  categorySlug?: string
  genderPreference?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'any'
  ageMin?: number
  ageMax?: number
  location?: string
  skillsRequired?: string[]
  shootDates?: string
  budget?: string
  description?: string
}

export interface ContractAnalysisResult {
  parties: {
    client: string
    talent: string
  }
  feeAmount?: string
  usageRightsSummary: string
  territory: string
  exclusivityNotice?: string
  keyDates: string[]
  potentialIssuesToReview: string[]
  riskLevel?: 'low' | 'medium' | 'high'
}

export interface TalentProfileBuilderResult {
  headline: string
  polishedBio: string
  extractedSkills: string[]
  suggestedCategories: string[]
  experienceSummary: string
}

export interface AIAssistantMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  actionLink?: {
    label: string
    href: string
  }
  dataItems?: Array<{
    title: string
    subtitle?: string
    badge?: string
    href?: string
  }>
}

export interface AIServiceProvider {
  parseClientBrief(rawText: string): Promise<StructuredBrief>
  matchTalentToBrief(brief: string, talentPool: any[]): Promise<AIMatchCandidate[]>
  analyzeContract(contractText: string): Promise<ContractAnalysisResult>
  generateAgencyEmail(templateType: string, context: Record<string, string>): Promise<string>
  buildTalentProfile(rawInput: { bio?: string; experience?: string; skills?: string[] }): Promise<TalentProfileBuilderResult>
  chatAssistantQuery(query: string, contextSummary?: string): Promise<string>
}
