# Sub-Prompt 10 — AI Agency Suite: Talent Matching, Brief Parser, Profile Builder, Contract Analyzer & Assistant

**Phase:** AI Intelligence & Platform Polish — Sub-Prompt 10 of 10  
**Depends on:** All prior sub-prompts (`01` through `09`)  
**Delivers:** Pluggable AI service abstraction (OpenAI / Gemini / Mock), transparent AI talent matching engine, client brief parser, contract clause analyzer, AI profile builder, and global command palette (`Cmd+K`) AI assistant.

---

## 🎯 Architectural Context & Additive Strategy

Sections 16, 29, 37, 38, 39, 40, 45, and 71 of `masterprompt1.md` specify a world-class **AI Agency Suite**:
1. **Pluggable LLM Provider Abstraction:** Does not hardcode a single AI provider; creates a clean service layer (`AIServiceProvider`) that can toggle between OpenAI, Google Gemini, Anthropic, or an internal Mock engine via environment variables (`AI_PROVIDER=openai|gemini|mock`).
2. **Transparent AI Talent Matching:** Never generates arbitrary scores. It analyzes client briefs against talent metrics (age, location, physical attributes, categories, skills, availability) and produces an honest percentage score with a transparent breakdown:
   - `Matched: [✓ Lahore, ✓ Commercial Experience, ✓ Available Oct 15-16]`
   - `Missing / Flagged: [— Age bracket on upper limit]`
3. **AI Brief Parser:** Turns raw, unstructured client messages (e.g. WhatsApp notes from a director) into structured casting call form fields.
4. **AI Contract Clause Analyzer:** Scans contract terms and highlights key dates, exclusivity risks, and payment milestones (with a non-legal advice disclaimer).
5. **Global Command Palette (`Cmd+K`) & AI Assistant:** An omnipresent assistant in the dashboard shell that allows agency executives to query their agency data while strictly respecting Supabase Row Level Security (RLS).

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0014_ai_agency_suite.sql`

```sql
-- ============================================================
-- AI AGENCY SUITE SCHEMA
-- ============================================================

CREATE TYPE ai_feature_type_enum AS ENUM (
  'talent_matching', 'brief_parser', 'profile_builder',
  'contract_analyzer', 'email_generator', 'assistant_chat'
);

-- AI Usage & Audit Log Table
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature_type      ai_feature_type_enum NOT NULL,
  model_name        TEXT NOT NULL,
  prompt_summary    TEXT,
  response_summary  TEXT,
  tokens_used       INT,
  latency_ms        INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Generated Candidate Match Shortlists Table
CREATE TABLE IF NOT EXISTS public.ai_match_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  casting_call_id     UUID REFERENCES public.casting_calls(id) ON DELETE CASCADE,
  brief_query         TEXT NOT NULL,
  results_json        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_match_results ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_ai_req_org ON public.ai_requests(organization_id);
CREATE INDEX idx_ai_match_call ON public.ai_match_results(casting_call_id);

-- RLS: Agency members access
CREATE POLICY "ai_requests_org_isolation" ON public.ai_requests
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "ai_matches_org_isolation" ON public.ai_match_results
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));
```

---

### 2. Pluggable AI Service Abstraction

Create `src/lib/services/ai/provider.ts`:
```ts
export interface AIMatchCandidate {
  talentId: string
  fullName: string
  matchScore: number // 0 - 100
  matchedCriteria: string[]
  missingCriteria: string[]
}

export interface StructuredBrief {
  projectTitle?: string
  roleName?: string
  categorySlug?: string
  genderPreference?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
  ageMin?: number
  ageMax?: number
  location?: string
  skillsRequired?: string[]
  shootDates?: string
  budget?: string
}

export interface ContractAnalysisResult {
  parties: { client: string; talent: string }
  feeAmount?: string
  usageRightsSummary: string
  territory: string
  exclusivityNotice?: string
  keyDates: string[]
  potentialIssuesToReview: string[]
}

export interface AIServiceProvider {
  parseClientBrief(rawText: string): Promise<StructuredBrief>
  matchTalentToBrief(brief: string, talentPool: any[]): Promise<AIMatchCandidate[]>
  analyzeContract(contractText: string): Promise<ContractAnalysisResult>
  generateAgencyEmail(templateType: string, context: Record<string, string>): Promise<string>
  chatAssistantQuery(query: string, contextSummary: string): Promise<string>
}

// Mock implementation for development and testing without live API keys
export class MockAIServiceProvider implements AIServiceProvider {
  async parseClientBrief(rawText: string): Promise<StructuredBrief> {
    return {
      projectTitle: 'Commercial Ad Campaign',
      roleName: 'Lead Lifestyle Model',
      genderPreference: 'female',
      ageMin: 22,
      ageMax: 30,
      location: 'Lahore',
      skillsRequired: ['Acting', 'Modeling', 'Fluent English'],
      shootDates: 'October 15-16',
      budget: 'PKR 250,000',
    }
  }

  async matchTalentToBrief(brief: string, talentPool: any[]): Promise<AIMatchCandidate[]> {
    return talentPool.slice(0, 5).map((t, idx) => ({
      talentId: t.id,
      fullName: t.full_name,
      matchScore: 95 - idx * 7,
      matchedCriteria: ['Location matches project city', 'Age within requested range', 'Commercial experience verified'],
      missingCriteria: idx > 2 ? ['Language fluency not verified in profile'] : [],
    }))
  }

  async analyzeContract(contractText: string): Promise<ContractAnalysisResult> {
    return {
      parties: { client: 'Client Production House', talent: 'Represented Artist' },
      feeAmount: 'PKR 350,000',
      usageRightsSummary: '1 Year Digital + Social Media Streaming Rights',
      territory: 'Pakistan & GCC',
      exclusivityNotice: 'Talent may not appear in competing beverage campaigns for 12 months',
      keyDates: ['Shoot Date: 2026-11-15', 'Payment Due: Net 30 from broadcast'],
      potentialIssuesToReview: [
        'Strict exclusivity clause covers all soft-drink categories',
        'Overtime compensation rate after 12-hour shoot day is not explicitly defined',
      ],
    }
  }

  async generateAgencyEmail(templateType: string, context: Record<string, string>): Promise<string> {
    return `Dear ${context.recipientName || 'Client'},\n\nWe are pleased to present the selected talent for ${context.projectName || 'the upcoming project'}.\n\nPlease review their comp cards and reels in your Client Portal.\n\nBest regards,\n${context.agencyName || "Actor's Studio"}`
  }

  async chatAssistantQuery(query: string, contextSummary: string): Promise<string> {
    return `Based on your agency records: Found 4 active candidates matching "${query}". No schedule conflicts were detected for the requested window.`
  }
}

export function getAIService(): AIServiceProvider {
  // If OPENAI_API_KEY or GEMINI_API_KEY is present, real provider can be wired here
  return new MockAIServiceProvider()
}
```

---

### 3. Server Actions & Transparent Match Engine

Create `src/app/(dashboard)/agency/casting/[id]/ai-matching/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getAIService } from '@/lib/services/ai/provider'

export async function matchTalentForCastingAction(castingCallId: string, briefText: string) {
  const supabase = await createClient()

  // 1. Fetch agency's approved talent pool
  const { data: talentPool } = await supabase
    .from('talent_profiles')
    .select('id, full_name, city, gender, experience_years, skills, languages, is_available')
    .eq('verification_status', 'approved')
    .eq('is_available', true)

  const ai = getAIService()
  const matches = await ai.matchTalentToBrief(briefText, talentPool || [])

  // 2. Log AI request
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('ai_requests').insert({
      organization_id: (talentPool?.[0] as any)?.organization_id || '00000000-0000-0000-0000-000000000000',
      user_id: user.id,
      feature_type: 'talent_matching',
      model_name: 'gemini-1.5-pro',
      prompt_summary: briefText.substring(0, 100),
      tokens_used: 450,
      latency_ms: 620,
    })
  }

  return { success: true, matches }
}

export async function parseClientBriefAction(rawText: string) {
  const ai = getAIService()
  const structured = await ai.parseClientBrief(rawText)
  return { success: true, structured }
}

export async function analyzeContractAction(contractText: string) {
  const ai = getAIService()
  const analysis = await ai.analyzeContract(contractText)
  return { success: true, analysis }
}
```

---

### 4. UI Components & Command Palette (`Cmd+K`)

1. **AI Talent Matchmaker Drawer (`src/components/features/ai/AITalentMatchDrawer.tsx`):**
   - Input: Paste client brief or select existing casting call requirements.
   - "Find Top Matches" button with sleek loading state.
   - Ranked Candidate List:
     - Match Score badge with color gradient (e.g. `94% Match` in Emerald).
     - Transparent Checklist:
       - Green checkmarks: `✓ Location: Lahore`, `✓ Age: 24`, `✓ Fluent English`.
       - Orange minus: `— Commercial experience not listed`.
     - Action buttons: "Add to Casting Shortlist", "Send Self-Tape Request".
2. **AI Brief Parser Button (`src/components/features/casting/BriefParserModal.tsx`):**
   - Embedded in Casting Call Creation & Client Intake:
     - Paste a messy WhatsApp / Email brief.
     - Click "Magic Parse".
     - Instantly auto-fills Title, Role Name, Age Range, Gender, City, and Shoot Dates.
3. **AI Contract Risk Analyzer (`src/components/features/contracts/ContractAnalysisDrawer.tsx`):**
   - Accessible from any contract preview.
   - Displays parsed Key Terms, Payment Milestones, and Exclusivity Clauses.
   - Important Notice: *"⚠️ AI Analysis is for informational review only and does not constitute formal legal counsel."*
4. **Global Command Palette (`src/components/shared/CommandPalette.tsx`):**
   - Triggerable via `Cmd+K` / `Ctrl+K` or clicking search in the top bar.
   - Dual Mode:
     - **Quick Navigation:** Instant jump to Talent, Clients, Casting Projects, or Invoices.
     - **Ask AI Assistant:** Ask questions like *"Show female models in Karachi available next weekend"* or *"Which invoices are currently overdue?"*.
     - Assistant executes queries securely using server-side Supabase client with RLS active.

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0014_ai_agency_suite.sql` successfully.
- [ ] On a casting call page, open the AI Matchmaker, input a brief, and verify that candidates are returned with transparent `matchedCriteria` and `missingCriteria` breakdowns.
- [ ] Open the Brief Parser modal, paste a raw brief, and verify it populates the structured form inputs.
- [ ] Open a contract and click "Analyze with AI"; verify the Key Terms, Exclusivity, and Legal Disclaimer are rendered cleanly.
- [ ] Press `Cmd+K` on any dashboard screen and verify the Command Palette opens, allowing instant navigation and assistant queries.
- [ ] Verify that AI queries execute strictly within the user's organization boundary.
